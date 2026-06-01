import { getOpenAI, isAIEnabled } from "./openai";
const SYSTEM_PROMPT = `You are Nexus AI, an intelligent HR assistant for a modern HRMS platform.
You help with recruitment, HR policies, leave policies, interview scheduling, and employee support.
Be professional, concise, and actionable. If you don't know company-specific policy details, provide general best-practice guidance and suggest checking with HR.
Current context: Enterprise HRMS with modules for attendance, leave, payroll, performance, and AI recruitment.`;
export async function chatWithHRAssistant(messages, context) {
  const openai = getOpenAI();
  if (!openai) {
    return mockAssistantResponse(messages[messages.length - 1].content || "");
  }
  const contextNote = context ? `\nUser role: ${context.userRole}. Organization: ${context.organizationName || "Nexus Technologies"}.` : "";
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{
      role: "system",
      content: SYSTEM_PROMPT + contextNote
    }, ...messages.map(m => ({
      role: m.role,
      content: m.content
    }))],
    max_tokens: 1024,
    temperature: 0.7
  });
  return completion.choices[0].message.content || "I couldn't generate a response. Please try again.";
}
function mockAssistantResponse(userMessage) {
  const lower = userMessage.toLowerCase();
  if (lower.includes("leave") || lower.includes("pto")) {
    return "For leave requests: submit through the Leave module, include dates and reason. Managers receive approval notifications. Standard policies often include 15–20 annual days — confirm with your HR admin.";
  }
  if (lower.includes("interview") || lower.includes("schedule")) {
    return "To schedule interviews: use Recruitment → select candidate → schedule. Voice Interview module can run AI screening first. Share calendar links and send prep materials 24h before.";
  }
  if (lower.includes("resume") || lower.includes("candidate")) {
    return "Upload resumes in Resume AI Screening. The system extracts skills, scores match %, and auto-shortlists top candidates. Connect OPENAI_API_KEY for semantic matching.";
  }
  if (lower.includes("payroll") || lower.includes("salary")) {
    return "Payroll runs monthly from the Payroll module (amounts in INR). Employees view payslips under Payroll → History. Admins manage salary structures and bonuses.";
  }
  return `I'm Nexus AI (demo mode). You asked: "${userMessage.slice(0, 100)}${userMessage.length > 100 ? "..." : ""}". Add OPENAI_API_KEY for full AI responses. I can help with leave, recruitment, interviews, payroll, and HR policies.`;
}
export { isAIEnabled };