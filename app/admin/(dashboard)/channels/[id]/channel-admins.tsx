"use client";

import { useState } from "react";
import {
  addChannelAdmin,
  removeChannelAdmin,
} from "./channel-admins-actions";

type Admin = { id: string; email: string; name: string | null };

export function ChannelAdminsSection({
  lineChannelId,
  admins,
}: {
  lineChannelId: string;
  admins: Admin[];
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const result = await addChannelAdmin(lineChannelId, email);
    setIsLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setEmail("");
    }
  }

  async function handleRemove(userId: string) {
    if (!confirm("この管理者を削除しますか？")) return;
    setError(null);
    const result = await removeChannelAdmin(lineChannelId, userId);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6">
      <h2 className="mb-4 font-medium text-neutral-900">
        コンテンツ管理者
      </h2>
      <ul className="mb-4 space-y-2">
        {admins.map((a) => (
          <li
            key={a.id}
            className="flex items-center justify-between rounded bg-neutral-50 px-3 py-2 text-sm"
          >
            <span>
              {a.name || a.email}
              <span className="ml-2 text-neutral-500">{a.email}</span>
            </span>
            <button
              type="button"
              onClick={() => handleRemove(a.id)}
              disabled={admins.length <= 1}
              className="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              削除
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="追加するユーザーのメールアドレス"
          className="flex-1 rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          追加
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
