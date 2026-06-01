import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { parseResume, getEmbedding } from "@/lib/ai/resume-screening";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  const session = await getSession();
  if (!session || !hasPermission(session.role, "manageRecruitment")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") ;
  const jobPostId = formData.get("jobPostId") ;
  const jobDescription = (formData.get("jobDescription") ) || "";

  if (!file) {
    return NextResponse.json({ error: "Resume file required" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let text = "";

  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
    try {
      const pdfParse = (await import("pdf-parse")).default;
      const pdf = await pdfParse(buffer);
      text = pdf.text;
    } catch (e) {
      text = buffer.toString("utf-8").slice(0, 15000);
    }
  } else {
    text = buffer.toString("utf-8").slice(0, 15000);
  }

  const result = await parseResume(text, jobDescription);
  const embedding = await getEmbedding(`${result.summary} ${result.skills.join(" ")}`);

  try {
    const candidate = await prisma.candidate.create({
      data: {
        jobPostId: jobPostId || (await getOrCreateDemoJob(session.organizationId)),
        name: result.name,
        email: result.email,
        phone: result.phone,
        resumeText: text.slice(0, 10000),
        skills: result.skills,
        experience: result.experience,
        aiScore: result.aiScore,
        aiSummary: result.summary,
        matchReason: result.matchReason,
        status: result.aiScore >= 70 ? "SHORTLISTED" : "SCREENING",
        embedding: JSON.stringify(embedding),
      },
    });

    return NextResponse.json({ success: true, data: { ...result, candidateId: candidate.id } });
  } catch (e2) {
    return NextResponse.json({ success: true, data: result });
  }
}

async function getOrCreateDemoJob(orgId) {
  const existing = await prisma.jobPost.findFirst({ where: { organizationId: orgId } });
  if (existing) return existing.id;
  const job = await prisma.jobPost.create({
    data: {
      organizationId: orgId,
      title: "Open Position",
      description: "General application",
    },
  });
  return job.id;
}
