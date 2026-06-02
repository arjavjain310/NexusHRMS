import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  generateInterviewQuestions,
  analyzeInterviewTranscript,
} from "@/lib/ai/voice-interview";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Resume file required" }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";
    if (file.type === "application/pdf" || file.name?.toString().endsWith(".pdf")) {
      try {
        const pdfParse = (await import("pdf-parse")).default;
        const pdf = await pdfParse(buffer);
        text = pdf.text;
      } catch {
        text = buffer.toString("utf-8").slice(0, 15000);
      }
    } else {
      text = buffer.toString("utf-8").slice(0, 15000);
    }
    return NextResponse.json({ success: true, data: { text: text.trim() } });
  }

  const body = await request.json();

  if (body.action === "generate-questions") {
    const questions = await generateInterviewQuestions(
      body.jobTitle || "Software Engineer",
      body.skills || [],
      body.count || 5,
      {
        jobDescription: body.jobDescription || "",
        resumeText: body.resumeText || "",
      }
    );
    return NextResponse.json({ success: true, data: questions });
  }

  if (body.action === "analyze") {
    const analysis = await analyzeInterviewTranscript(
      body.transcript || "",
      body.jobTitle || "Software Engineer"
    );

    try {
      if (body.candidateId) {
        await prisma.voiceInterview.create({
          data: {
            candidateId: body.candidateId,
            questions: body.questions || [],
            transcript: body.transcript,
            sentimentScore: analysis.sentimentScore,
            confidenceScore: analysis.confidenceScore,
            communicationScore: analysis.communicationScore,
            overallScore: analysis.overallScore,
            aiFeedback: analysis.feedback,
            completedAt: new Date(),
          },
        });
      }
    } catch {
      // optional persistence
    }

    return NextResponse.json({ success: true, data: analysis });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
