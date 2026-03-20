"use client";

import { useState } from "react";
import { createLineChannel } from "./actions";

export function CreateChannelForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await createLineChannel(formData);
    setIsLoading(false);
    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
      (e.target as HTMLFormElement).reset();
      setError(null);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-neutral-200 bg-white p-6"
    >
      <h2 className="mb-4 text-lg font-medium text-neutral-900">
        新規チャネル登録
      </h2>
      <p className="mb-4 text-sm text-neutral-500">
        LINE Developers で作成した Messaging API チャネルの情報を入力してください。
      </p>
      <div className="space-y-4">
        <div>
          <label
            htmlFor="channelId"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            チャネルID
          </label>
          <input
            id="channelId"
            name="channelId"
            type="text"
            required
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            placeholder="1234567890"
          />
        </div>
        <div>
          <label
            htmlFor="channelSecret"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            チャネルシークレット
          </label>
          <input
            id="channelSecret"
            name="channelSecret"
            type="password"
            required
            autoComplete="off"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          />
        </div>
        <div>
          <label
            htmlFor="accessToken"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            チャネルアクセストークン
          </label>
          <input
            id="accessToken"
            name="accessToken"
            type="password"
            required
            autoComplete="off"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          />
          <p className="mt-1 text-xs text-neutral-500">
            Messaging API 設定の「チャネルアクセストークン」で発行できます
          </p>
        </div>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {isLoading ? "登録中..." : "登録する"}
        </button>
      </div>
    </form>
  );
}
