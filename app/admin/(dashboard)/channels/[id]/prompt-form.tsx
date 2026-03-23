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
    fullContextInterval: number;
  };
}) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fullContextMode, setFullContextMode] = useState<"always" | "interval">(
    initial.fullContextInterval === 0 ? "always" : "interval"
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set(
      "fullContextInterval",
      fullContextMode === "always"
        ? "0"
        : String(formData.get("fullContextInterval") ?? "10")
    );
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
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            プロンプト・ナレッジの送信方法
          </label>
          <p className="mb-3 text-xs text-neutral-500">
            システムプロンプトとナレッジベースをAPIに送る頻度。毎回送ると確実ですがトークン消費が多いです。N回おきにすると1, 1+N, 1+2N回目などでフル送信し、それ以外は省略してAPI使用量を節約します。
          </p>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="fullContextMode"
                checked={fullContextMode === "always"}
                onChange={() => setFullContextMode("always")}
              />
              <span className="text-sm">毎回送る</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="fullContextMode"
                checked={fullContextMode === "interval"}
                onChange={() => setFullContextMode("interval")}
              />
              <span className="text-sm">
                <input
                  name="fullContextInterval"
                  type="number"
                  min={2}
                  max={100}
                  defaultValue={
                    initial.fullContextInterval > 0
                      ? initial.fullContextInterval
                      : 10
                  }
                  disabled={fullContextMode === "always"}
                  className="mx-1 w-14 rounded border border-neutral-300 px-2 py-1 text-sm"
                />
                回おきに送る（1回目、11回目、21回目…）
              </span>
            </label>
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
