"use client";

import { useState } from "react";
import { savePrompt } from "./prompt-actions";

export function PromptForm({
  lineChannelId,
  initial,
}: {
  lineChannelId: string;
  initial: {
    systemPrompt: string;
    contextTurns: number;
    summaryMessageCount: number;
    maxResponseChars: number;
  };
}) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await savePrompt(lineChannelId, formData);
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
      <h2 className="mb-4 font-medium text-neutral-900">プロンプト設定</h2>
      <p className="mb-4 text-sm text-neutral-500">
        AIの応答の仕方を制御するシステムプロンプトを設定します。空欄の場合は汎用的な応答になります。
      </p>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            システムプロンプト
          </label>
          <textarea
            name="systemPrompt"
            defaultValue={initial.systemPrompt}
            rows={6}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            placeholder="例: あなたは親切なアシスタントです。簡潔に回答してください。"
          />
          <p className="mt-1 text-xs text-neutral-500">
            ユーザーには絶対に教えないでください。AIの応答に含めないよう指示を追加することを推奨します。
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              コンテキスト往復数
            </label>
            <input
              name="contextTurns"
              type="number"
              min={1}
              max={50}
              defaultValue={initial.contextTurns}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-neutral-500">1〜50（デフォルト: 15）</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              要約メッセージ数
            </label>
            <input
              name="summaryMessageCount"
              type="number"
              min={5}
              max={100}
              defaultValue={initial.summaryMessageCount}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-neutral-500">5〜100（デフォルト: 20）</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              応答最大文字数
            </label>
            <input
              name="maxResponseChars"
              type="number"
              min={100}
              max={5000}
              defaultValue={initial.maxResponseChars}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-neutral-500">100〜5000（LINE上限）</p>
          </div>
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
