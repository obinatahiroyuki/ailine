"use client";

import { useState } from "react";
import { createUser } from "./actions";

export function CreateUserForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await createUser(formData);
    setIsLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setError(null);
      (e.target as HTMLFormElement).reset();
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
      >
        ユーザーを追加
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
    >
      <h3 className="mb-4 font-medium text-neutral-900">新規ユーザー登録</h3>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            メールアドレス
          </label>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            placeholder="user@example.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            名前（任意）
          </label>
          <input
            name="name"
            type="text"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            placeholder="山田 太郎"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            パスワード
          </label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            placeholder="8文字以上"
          />
        </div>
      </div>
      <p className="mt-2 text-xs text-neutral-500">
        コンテンツ管理者ロールで登録されます。チャネルにはチャネル詳細ページから割り当ててください。
      </p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {isLoading ? "登録中..." : "登録"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
