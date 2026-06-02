import { getOpenAIChat, getChatModel } from "./openai";
export async function generateInterviewQuestions(jobTitle, skills, count = 5) {
  const openai = getOpenAIChat();
  if (!openai) {
    return mockQuestions(jobTitle, count);
  }
  const completion = await openai.chat.completions.create({
    model: getChatModel(),
    response_format: {
      type: "json_object"
    },
    messages: [{
      role: "system",
      content: "Generate interview questions as JSON: { questions: [{ id, question, category }] }"
    }, {
      role: "user",
      content: `Role: ${jobTitle}. Skills: ${skills.join(", ")}. Generate ${count} questions mixing behavioral and technical.`
    }]
  });
  const raw = JSON.parse(completion.choices[0].message.content || "{}");
  return raw.questions || mockQuestions(jobTitle, count);
}
function mockQuestions(jobTitle, count) {
  const pool = [{
    question: `Tell us about your experience relevant to ${jobTitle}.`,
    category: "Experience"
  }, {
    question: "Describe a challenging project and how you resolved blockers.",
    category: "Behavioral"
  }, {
    question: "How do you prioritize tasks when deadlines overlap?",
    category: "Behavioral"
  }, {
    question: "Walk us through your approach to collaborating with cross-functional teams.",
    category: "Soft Skills"
  }, {
    question: "What interests you about this role and our company?",
    category: "Motivation"
  }, {
    question: "Explain a technical decision you made and its trade-offs.",
    category: "Technical"
  }];
  return pool.slice(0, count).map((q, i) => ({
    id: `q-${i + 1}`,
    question: q.question,
    category: q.category
  }));
}
export async function analyzeInterviewTranscript(transcript, jobTitle) {
  const openai = getOpenAIChat();
  if (!openai || !transcript.trim()) {
    const wordCount = transcript.split(/\s+/).filter(Boolean).length;
    const base = Math.min(92, 55 + Math.floor(wordCount / 10));
    return {
      sentimentScore: 0.72,
      confidenceScore: base / 100,
      communicationScore: (base - 5) / 100,
      overallScore: base,
      feedback: "Demo analysis based on response length. Set OPENROUTER_CHAT_API_KEY for sentiment and communication scoring.",
      highlights: ["Clear structure in responses", "Relevant examples provided"],
      improvements: ["Add more quantifiable outcomes", "Reduce filler words"]
    };
  }
  const completion = await openai.chat.completions.create({
    model: getChatModel(),
    response_format: {
      type: "json_object"
    },
    messages: [{
      role: "system",
      content: `Analyze interview transcript for ${jobTitle}. Return JSON: sentimentScore (0-1), confidenceScore (0-1), communicationScore (0-1), overallScore (0-100), feedback, highlights (array), improvements (array).`
    }, {
      role: "user",
      content: transcript.slice(0, 8000)
    }]
  });
  const raw = JSON.parse(completion.choices[0].message.content || "{}");
  return {
    sentimentScore: Number(raw.sentimentScore) || 0.7,
    confidenceScore: Number(raw.confidenceScore) || 0.75,
    communicationScore: Number(raw.communicationScore) || 0.75,
    overallScore: Number(raw.overallScore) || 75,
    feedback: raw.feedback || "Interview completed.",
    highlights: raw.highlights || [],
    improvements: raw.improvements || []
  };
}