"use client";

import { useState } from "react";
import { deleteUser } from "./actions";

export function DeleteUserButton({
  userId,
  isSelf,
  isSystemAdmin,
  systemAdminCount,
}: {
  userId: string;
  isSelf: boolean;
  isSystemAdmin: boolean;
  systemAdminCount: number;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const disabled =
    isSelf || (isSystemAdmin && systemAdminCount <= 1);

  async function handleDelete() {
    if (disabled) return;
    if (!confirm("このユーザーを削除しますか？関連するチャネル設定なども解除されます。")) return;
    setError(null);
    setIsLoading(true);
    const result = await deleteUser(userId);
    setIsLoading(false);
    if (result?.error) setError(result.error);
  }

  if (disabled) return null;

  return (
    <div>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isLoading}
        className="text-sm text-red-600 hover:underline disabled:opacity-50"
      >
        {isLoading ? "削除中..." : "削除"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
