import { getOpenAI } from "./openai";
function cosineSimilarity(a, b) {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
export async function getEmbedding(text) {
  const openai = getOpenAI();
  if (!openai) {
    return Array(8).fill(0).map(() => Math.random());
  }
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.slice(0, 8000)
  });
  return res.data[0].embedding;
}
export async function parseResume(text, jobDescription) {
  const openai = getOpenAI();
  if (!openai) {
    return mockParseResume(text, jobDescription);
  }
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: {
      type: "json_object"
    },
    messages: [{
      role: "system",
      content: `You are an expert HR resume parser. Extract structured data and score the candidate (0-100) against the job description. Return JSON with keys: name, email, phone, skills (array), experience (array of {company, role, duration}), summary, aiScore (number), matchReason (string).`
    }, {
      role: "user",
      content: `JOB DESCRIPTION:\n${jobDescription}\n\nRESUME:\n${text.slice(0, 12000)}`
    }]
  });
  const raw = completion.choices[0].message.content || "{}";
  const parsed = JSON.parse(raw);
  return {
    name: parsed.name || "Unknown Candidate",
    email: parsed.email,
    phone: parsed.phone,
    skills: parsed.skills || [],
    experience: parsed.experience || [],
    summary: parsed.summary || "",
    aiScore: Math.min(100, Math.max(0, Number(parsed.aiScore) || 50)),
    matchReason: parsed.matchReason || "AI analysis completed."
  };
}
function mockParseResume(text, jobDescription) {
  const skills = ["JavaScript", "TypeScript", "React", "Node.js", "PostgreSQL"].filter(s => text.toLowerCase().includes(s.toLowerCase()) || jobDescription.toLowerCase().includes(s.toLowerCase()));
  const score = Math.min(95, 40 + skills.length * 12 + Math.floor(text.length / 500));
  return {
    name: extractName(text) || "Candidate",
    email: extractEmail(text),
    phone: extractPhone(text),
    skills: skills.length ? skills : ["Communication", "Problem Solving"],
    experience: [{
      company: "Previous Employer",
      role: "Software Engineer",
      duration: "2+ years"
    }],
    summary: "Resume parsed in demo mode. Connect OPENAI_API_KEY for full AI screening.",
    aiScore: score,
    matchReason: `Matched ${skills.length} key skills with the job description.`
  };
}
function extractName(text) {
  const line = text.split("\n")[0].trim();
  return line && line.length < 50 ? line : undefined;
}
function extractEmail(text) {
  return text.match(/[\w.-]+@[\w.-]+\.\w+/)[0];
}
function extractPhone(text) {
  return text.match(/\+?[\d\s()-]{10,}/)[0].trim();
}
export async function rankCandidates(jobEmbedding, candidates) {
  return candidates.map(c => ({
    id: c.id,
    score: Math.round(cosineSimilarity(jobEmbedding, c.embedding) * 100)
  })).sort((a, b) => b.score - a.score);
}
export { cosineSimilarity };