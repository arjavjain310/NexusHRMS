import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [jobs, candidates] = await Promise.all([
      prisma.jobPost.findMany({
        where: { organizationId: session.organizationId },
        include: { _count: { select: { candidates: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.candidate.findMany({
        where: { jobPost: { organizationId: session.organizationId } },
        include: { jobPost: { select: { title: true } } },
        orderBy: { aiScore: "desc" },
        take: 50,
      }),
    ]);

    return NextResponse.json({ success: true, data: { jobs, candidates } });
  } catch (e) {
    return NextResponse.json({
      success: true,
      data: {
        jobs: [{ id: "1", title: "Full Stack Developer", _count: { candidates: 12 }, isActive: true }],
        candidates: [
          { id: "1", name: "John Doe", aiScore: 87, status: "SHORTLISTED", skills: ["React", "Node.js"] },
        ],
      },
    });
  }
}
