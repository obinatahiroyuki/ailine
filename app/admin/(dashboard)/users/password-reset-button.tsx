"use client";

import { useState } from "react";
import { resetUserPassword } from "./actions";

type Props = {
  userId: string;
  userEmail: string;
};

export function PasswordResetButton({ userId, userEmail }: Props) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!password || password.length < 8) {
      setError("パスワードは8文字以上で入力してください");
      return;
    }
    setIsLoading(true);
    const result = await resetUserPassword(userId, password);
    setIsLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setOpen(false);
      setPassword("");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-neutral-600 underline hover:text-neutral-900"
      >
        パスワード変更
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-2 font-medium text-neutral-900">
              パスワードを変更
            </h3>
            <p className="mb-4 text-sm text-neutral-600">
              {userEmail} のパスワードを新しいものに変更します。
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  新しいパスワード（8文字以上）
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                  className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
                  placeholder="新しいパスワード"
                  autoComplete="new-password"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  {isLoading ? "変更中..." : "変更する"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setPassword("");
                    setError(null);
                  }}
                  className="rounded border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
