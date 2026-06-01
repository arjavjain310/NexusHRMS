import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { chatWithHRAssistant } from "@/lib/ai/hr-assistant";
import { prisma } from "@/lib/prisma";
export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({
    error: "Unauthorized"
  }, {
    status: 401
  });
  const {
    messages,
    sessionId
  } = await request.json();
  if (!messages.length) {
    return NextResponse.json({
      error: "Messages required"
    }, {
      status: 400
    });
  }
  const reply = await chatWithHRAssistant(messages, {
    userRole: session.role,
    organizationName: "Nexus Technologies"
  });
  try {
    const sid = sessionId || `session-${session.id}`;
    await prisma.chatMessage.createMany({
      data: [{
        userId: session.id,
        role: "user",
        content: messages[messages.length - 1].content,
        sessionId: sid
      }, {
        userId: session.id,
        role: "assistant",
        content: reply,
        sessionId: sid
      }]
    });
  } catch (e) {
    // optional persistence
  }
  return NextResponse.json({
    success: true,
    data: {
      content: reply
    }
  });
}