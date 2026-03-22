"use client";

import { useState } from "react";
import { updateBillingEmergencyExempt } from "./actions";

export function BillingEmergencyExemptForm({
  initialEnabled,
}: {
  initialEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(checked: boolean) {
    setError(null);
    setIsLoading(true);
    const result = await updateBillingEmergencyExempt(checked);
    setIsLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setEnabled(checked);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <label className="relative inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => handleChange(e.target.checked)}
          disabled={isLoading}
          className="peer sr-only"
        />
        <div className="peer h-6 w-11 rounded-full bg-neutral-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-amber-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-disabled:opacity-50"></div>
        <span className="ml-3 text-sm font-medium text-neutral-900">
          {enabled ? "全員課金免除（ON）" : "全員課金免除（OFF）"}
        </span>
      </label>
      {isLoading && (
        <span className="text-sm text-neutral-500">保存中...</span>
      )}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
