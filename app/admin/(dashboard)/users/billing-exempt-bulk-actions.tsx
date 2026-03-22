"use client";

import { useState } from "react";
import { setAllUsersBillingExempt } from "./actions";

export function BillingExemptBulkActions({
  contentAdminIds,
}: {
  contentAdminIds: string[];
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (contentAdminIds.length === 0) return null;

  async function handleBulkExempt(exempt: boolean) {
    if (
      !confirm(
        exempt
          ? "全コンテンツ管理者を課金免除にしますか？"
          : "全コンテンツ管理者の課金免除を解除しますか？"
      )
    )
      return;
    setError(null);
    setIsLoading(true);
    const result = await setAllUsersBillingExempt(exempt, contentAdminIds);
    setIsLoading(false);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
      <span className="text-sm font-medium text-neutral-700">
        一括設定（緊急時用）:
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleBulkExempt(true)}
          disabled={isLoading}
          className="rounded-lg border border-amber-600 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
        >
          {isLoading ? "実行中..." : "全員を課金免除"}
        </button>
        <button
          type="button"
          onClick={() => handleBulkExempt(false)}
          disabled={isLoading}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
        >
          全員の課金免除を解除
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
