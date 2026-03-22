"use client";

import { useState } from "react";
import { updateOwnName } from "../users/actions";

type Props = { initialName: string; email: string };

export function ChangeNameForm({ initialName, email }: Props) {
  const [name, setName] = useState(initialName);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!name.trim()) {
      setError("名前を入力してください");
      return;
    }
    setIsLoading(true);
    const result = await updateOwnName(name.trim());
    setIsLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-neutral-500">
          メールアドレス（変更不可）
        </label>
        <p className="text-sm text-neutral-700">{email}</p>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          名前
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full max-w-xs rounded border border-neutral-300 px-3 py-2 text-sm"
          placeholder="表示名を入力"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && (
        <p className="text-sm text-green-600">名前を変更しました。</p>
      )}
      <button
        type="submit"
        disabled={isLoading}
        className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {isLoading ? "保存中..." : "保存"}
      </button>
    </form>
  );
}
