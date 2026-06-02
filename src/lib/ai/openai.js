import OpenAI from "openai";

const OPENROUTER_BASE_URL =
  process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";

const clients = {
  resume: null,
  chat: null,
  legacy: null,
};

function openRouterHeaders() {
  return {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "X-Title": process.env.NEXT_PUBLIC_APP_NAME || "Nexus HRMS",
  };
}

function createClient(apiKey) {
  if (!apiKey) return null;
  return new OpenAI({
    apiKey,
    baseURL: OPENROUTER_BASE_URL,
    defaultHeaders: openRouterHeaders(),
  });
}

function resolveResumeApiKey() {
  return process.env.OPENROUTER_RESUME_API_KEY || process.env.OPENAI_API_KEY || null;
}

function resolveChatApiKey() {
  return process.env.OPENROUTER_CHAT_API_KEY || process.env.OPENAI_API_KEY || null;
}

/** Resume screening + embeddings (OpenRouter key: nexusresume) */
export function getOpenAIResume() {
  const apiKey = resolveResumeApiKey();
  if (!apiKey) return null;
  if (!clients.resume) {
    clients.resume = createClient(apiKey);
  }
  return clients.resume;
}

/** HR assistant + voice interview + performance AI (OpenRouter key: nexusinterview) */
export function getOpenAIChat() {
  const apiKey = resolveChatApiKey();
  if (!apiKey) return null;
  if (!clients.chat) {
    clients.chat = createClient(apiKey);
  }
  return clients.chat;
}

/** @deprecated Prefer getOpenAIChat() or getOpenAIResume() */
export function getOpenAI() {
  return getOpenAIChat();
}

export function getChatModel() {
  return process.env.OPENROUTER_CHAT_MODEL || "openai/gpt-4o-mini";
}

export function getResumeModel() {
  return process.env.OPENROUTER_RESUME_MODEL || getChatModel();
}

export function getEmbeddingModel() {
  return process.env.OPENROUTER_EMBEDDING_MODEL || "openai/text-embedding-3-small";
}

export function isResumeAIEnabled() {
  return !!resolveResumeApiKey();
}

export function isChatAIEnabled() {
  return !!resolveChatApiKey();
}

export function isAIEnabled() {
  return isResumeAIEnabled() || isChatAIEnabled();
}
