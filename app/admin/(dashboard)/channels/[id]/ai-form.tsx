"use client";

import { useState } from "react";
import { saveAiProvider } from "./ai-actions";
import { AI_MODELS } from "@/lib/ai/models";

type AiProviderType = "openai" | "anthropic" | "google";

const PROVIDER_LABELS: Record<AiProviderType, string> = {
  openai: "OpenAI (ChatGPT)",
  anthropic: "Anthropic (Claude)",
  google: "Google (Gemini)",
};

export function AiProviderForm({
  lineChannelId,
  existing,
}: {
  lineChannelId: string;
  existing?: { provider: string; model: string } | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState<AiProviderType>(
    (existing?.provider as AiProviderType) ?? "openai"
  );

  const models = AI_MODELS[provider] ?? AI_MODELS.openai;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("provider", provider);
    const result = await saveAiProvider(lineChannelId, formData);
    setIsLoading(false);
    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
      setError(null);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-neutral-200 bg-white p-6"
    >
      <h2 className="mb-4 font-medium text-neutral-900">AI API 設定</h2>
      <p className="mb-4 text-sm text-neutral-500">
        メッセージ応答に使用するAIプロバイダーとAPIキーを設定します。
      </p>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            プロバイダー
          </label>
          <select
            value={provider}
            onChange={(e) =>
              setProvider(e.target.value as AiProviderType)
            }
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          >
            {(Object.keys(PROVIDER_LABELS) as AiProviderType[]).map((p) => (
              <option key={p} value={p}>
                {PROVIDER_LABELS[p]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            モデル
          </label>
          <select
            name="model"
            defaultValue={existing?.model}
            required
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          >
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            APIキー
          </label>
          <input
            name="apiKey"
            type="password"
            required={!existing}
            autoComplete="off"
            placeholder={existing ? "変更する場合のみ入力（空欄で現状維持）" : "sk-..."}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          {existing && (
            <p className="mt-1 text-xs text-neutral-500">
              既存のキーを変更しない場合は空欄のままにしてください
            </p>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {isLoading ? "保存中..." : "保存"}
        </button>
      </div>
    </form>
  );
}
