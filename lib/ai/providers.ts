import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { decryptApiKey } from "./encrypt";
import { SUMMARY_MODELS } from "./models";

export type AiProvider = "openai" | "anthropic" | "google";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AiUsage = {
  inputTokens: number;
  outputTokens: number;
};

export type GenerateResponseResult = {
  text: string;
  usage: AiUsage;
};

export async function generateResponse(
  provider: AiProvider,
  apiKeyEncrypted: string,
  model: string,
  messages: ChatMessage[],
  maxTokens: number = 2000
): Promise<GenerateResponseResult> {
  const apiKey = decryptApiKey(apiKeyEncrypted);

  switch (provider) {
    case "openai":
      return generateOpenAI(apiKey, model, messages, maxTokens);
    case "anthropic":
      return generateAnthropic(apiKey, model, messages, maxTokens);
    case "google":
      return generateGoogle(apiKey, model, messages, maxTokens);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/** 会話履歴の要約を生成（安価なモデルを使用） */
export async function generateSummary(
  provider: AiProvider,
  apiKeyEncrypted: string,
  messages: { role: string; content: string }[]
): Promise<GenerateResponseResult> {
  const model = SUMMARY_MODELS[provider] ?? "gpt-4o-mini";
  const text = messages
    .map((m) => `${m.role === "user" ? "ユーザー" : "アシスタント"}: ${m.content}`)
    .join("\n");

  const summaryPrompt = `以下の会話履歴を要約してください。重要な情報や文脈を保持しつつ、簡潔にまとめてください。日本語で出力してください。\n\n---\n${text}`;

  return generateResponse(
    provider,
    apiKeyEncrypted,
    model,
    [{ role: "user", content: summaryPrompt }],
    500
  );
}

async function generateOpenAI(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  maxTokens: number
): Promise<GenerateResponseResult> {
  const client = new OpenAI({ apiKey });
  const formatted = messages.map((m) => ({
    role: m.role as "system" | "user" | "assistant",
    content: m.content,
  }));

  const completion = await client.chat.completions.create({
    model,
    messages: formatted,
    max_tokens: maxTokens,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned empty response");
  }

  const usage = completion.usage;
  return {
    text: content,
    usage: {
      inputTokens: usage?.prompt_tokens ?? 0,
      outputTokens: usage?.completion_tokens ?? 0,
    },
  };
}

async function generateAnthropic(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  maxTokens: number
): Promise<GenerateResponseResult> {
  const client = new Anthropic({ apiKey });
  const system = messages.find((m) => m.role === "system")?.content ?? "";
  const formatted = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: formatted,
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Anthropic returned empty response");
  }

  return {
    text: block.text,
    usage: {
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
    },
  };
}

async function generateGoogle(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  maxTokens: number
): Promise<GenerateResponseResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const system = messages.find((m) => m.role === "system")?.content ?? "";
  const chatMessages = messages.filter((m) => m.role !== "system");

  const modelInstance = genAI.getGenerativeModel({
    model,
    systemInstruction: system || undefined,
  });

  const parts: string[] = [];
  for (const m of chatMessages) {
    parts.push(`${m.role === "user" ? "User" : "Assistant"}: ${m.content}`);
  }
  const prompt =
    parts.length > 0 ? parts.join("\n\n") + "\n\nAssistant:" : "Hello";

  const result = await modelInstance.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: maxTokens },
  });

  const text = result.response.text();
  if (!text) {
    throw new Error("Google returned empty response");
  }

  const um = result.response.usageMetadata;
  return {
    text,
    usage: {
      inputTokens: um?.promptTokenCount ?? 0,
      outputTokens: um?.candidatesTokenCount ?? 0,
    },
  };
}
