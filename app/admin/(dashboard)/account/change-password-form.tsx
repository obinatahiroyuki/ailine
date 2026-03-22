"use client";

import { useState } from "react";
import { changeOwnPassword } from "../users/actions";

type Props = { hasPassword: boolean };

export function ChangePasswordForm({ hasPassword }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const currentPassword = formData.get("currentPassword")?.toString() ?? "";
    const newPassword = formData.get("newPassword")?.toString() ?? "";

    if (!newPassword || newPassword.length < 8) {
      setError("新しいパスワードは8文字以上で入力してください");
      return;
    }
    if (hasPassword && !currentPassword) {
      setError("現在のパスワードを入力してください");
      return;
    }

    setIsLoading(true);
    const result = await changeOwnPassword(currentPassword, newPassword);
    setIsLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      form.reset();
    }
  }

  if (!hasPassword) {
    return (
      <p className="text-sm text-neutral-600">
        Googleでログインしているため、パスワードは設定されていません。パスワードでログインしたい場合は、システム管理者にパスワードを設定してもらってください。
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          現在のパスワード
        </label>
        <input
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className="w-full max-w-xs rounded border border-neutral-300 px-3 py-2 text-sm"
          placeholder="現在のパスワード"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          新しいパスワード（8文字以上）
        </label>
        <input
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full max-w-xs rounded border border-neutral-300 px-3 py-2 text-sm"
          placeholder="新しいパスワード"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && (
        <p className="text-sm text-green-600">パスワードを変更しました。</p>
      )}
      <button
        type="submit"
        disabled={isLoading}
        className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {isLoading ? "変更中..." : "パスワードを変更"}
      </button>
    </form>
  );
}
