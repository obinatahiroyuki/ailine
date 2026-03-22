"use client";

import { useState } from "react";
import { setUserBillingExempt } from "./actions";

export function BillingExemptCell({
  userId,
  billingExempt,
  isSystemAdmin,
}: {
  userId: string;
  billingExempt: boolean;
  isSystemAdmin: boolean;
}) {
  const [exempt, setExempt] = useState(billingExempt);
  const [isLoading, setIsLoading] = useState(false);

  if (isSystemAdmin) {
    return (
      <span className="text-neutral-400" title="システム管理者は常に免除">
        —
      </span>
    );
  }

  async function handleChange(checked: boolean) {
    setIsLoading(true);
    const result = await setUserBillingExempt(userId, checked);
    setIsLoading(false);
    if (!result?.error) setExempt(checked);
  }

  return (
    <label className="flex cursor-pointer items-center gap-2">
      <input
        type="checkbox"
        checked={exempt}
        onChange={(e) => handleChange(e.target.checked)}
        disabled={isLoading}
        className="h-4 w-4 rounded border-neutral-300"
      />
      <span className="text-sm">
        {exempt ? "免除" : "課金"}
      </span>
    </label>
  );
}
