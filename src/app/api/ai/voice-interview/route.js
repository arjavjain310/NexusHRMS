import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import {
  generateInterviewQuestions,
  analyzeInterviewTranscript,
} from "@/lib/ai/voice-interview";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  const session = await getSession();
  if (!session || !hasPermission(session.role, "manageRecruitment")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  if (body.action === "generate-questions") {
    const questions = await generateInterviewQuestions(
      body.jobTitle || "Software Engineer",
      body.skills || [],
      body.count || 5
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
    } catch (e) {
      // optional
    }

    return NextResponse.json({ success: true, data: analysis });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
