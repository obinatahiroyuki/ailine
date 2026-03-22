"use client";

import { useState } from "react";
import { updateChannelName } from "./channel-name-actions";

type Props = {
  lineChannelId: string;
  initialName: string | null;
};

export function ChannelNameForm({
  lineChannelId,
  initialName,
}: Props) {
  const [name, setName] = useState(initialName ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const result = await updateChannelName(
      lineChannelId,
      name.trim() || null
    );
    setIsLoading(false);
    if (result?.error) setError(result.error);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex-1 max-w-xs">
        <label className="mb-1 block text-sm text-neutral-500">
          チャネル名
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
          placeholder="例：〇〇Bot"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {isLoading ? "保存中..." : "保存"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
