"use client";

import { useState } from "react";
import { updateUserPaymentSettings } from "./user-payment-actions";

type Props = {
  lineChannelId: string;
  billingEnabled: boolean;
  userPaymentRequired: boolean;
  userPlanId: string | null;
  userPlans: { id: string; name: string; monthlyPrice: number }[];
};

export function UserPaymentSection({
  lineChannelId,
  billingEnabled,
  userPaymentRequired,
  userPlanId,
  userPlans,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [required, setRequired] = useState(userPaymentRequired);
  const [planId, setPlanId] = useState(userPlanId ?? "");

  if (!billingEnabled) return null;

  async function handleSave() {
    setIsLoading(true);
    try {
      const result = await updateUserPaymentSettings(
        lineChannelId,
        required,
        required && planId ? planId : null
      );
      if (result.success) {
        window.location.reload();
      } else {
        alert(result.error ?? "更新に失敗しました");
      }
    } catch {
      alert("エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6">
      <h2 className="mb-4 font-medium text-neutral-900">ユーザー課金設定</h2>
      <p className="mb-4 text-sm text-neutral-600">
        有料コンテンツとして運用する場合、LINEユーザーが課金後にのみチャットボットを利用できるようになります。決済失敗時は即時利用停止、課金再開で復帰します。
      </p>

      <div className="space-y-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
          />
          <span className="text-sm">ユーザー課金を必須にする</span>
        </label>

        {required && (
          <div>
            <label className="mb-1 block text-sm text-neutral-600">
              ユーザー向けプラン
            </label>
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className="w-full max-w-xs rounded border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="">選択してください</option>
              {userPlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - ¥{p.monthlyPrice.toLocaleString()}/月
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={isLoading || (required && !planId)}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {isLoading ? "保存中..." : "保存"}
        </button>
      </div>
      <p className="mt-2 text-xs text-neutral-500">
        ユーザーごとの課金状態は「LINE公式アカウントのユーザー一覧」で確認できます。
      </p>
    </div>
  );
}
