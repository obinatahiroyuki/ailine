export const AI_MODELS: Record<string, string[]> = {
  openai: [
    "gpt-5.4",
    "gpt-5.4-mini",
    "gpt-5.4-nano",
    "gpt-4.1",
    "gpt-4.1-mini",
    "gpt-4.1-nano",
    "o1-preview",
    "o1-mini",
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-turbo",
    "gpt-3.5-turbo",
  ],
  anthropic: [
    "claude-sonnet-4-20250514",
    "claude-3-5-sonnet-20241022",
    "claude-3-5-haiku-20241022",
    "claude-3-haiku-20240307",
  ],
  google: [
    "gemini-2.0-flash",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-1.0-pro",
  ],
};

/** 要約用の安価なモデル */
export const SUMMARY_MODELS: Record<string, string> = {
  openai: "gpt-4.1-mini",
  anthropic: "claude-3-5-haiku-20241022",
  google: "gemini-1.5-flash",
};
