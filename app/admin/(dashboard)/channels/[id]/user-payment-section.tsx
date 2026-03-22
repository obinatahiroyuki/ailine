"use client";

import { useState } from "react";
import { updateUserPaymentSettings } from "./user-payment-actions";

type Props = {
  lineChannelId: string;
  billingEnabled: boolean;
  userPaymentRequired: boolean;
  userPlanId: string | null;
  userPlans: { id: string; name: string; monthlyPrice: number }[];
  users: {
    lineUserId: string;
    status: string | null;
    planName: string | null;
    lastMessageAt: Date | null;
  }[];
};

export function UserPaymentSection({
  lineChannelId,
  billingEnabled,
  userPaymentRequired,
  userPlanId,
  userPlans,
  users,
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

      {users.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-medium text-neutral-700">
            LINEユーザー一覧（{users.length}人）
          </h3>
          <div className="max-h-60 overflow-auto rounded border border-neutral-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-3 py-2">LINE User ID</th>
                  <th className="px-3 py-2">課金状態</th>
                  <th className="px-3 py-2">最終利用</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.lineUserId} className="border-t border-neutral-100">
                    <td className="px-3 py-2 font-mono text-xs">
                      {u.lineUserId.slice(0, 12)}...
                    </td>
                    <td className="px-3 py-2">
                      {u.status === "active" ? (
                        <span className="text-green-600">課金済み</span>
                      ) : u.status === "past_due" ? (
                        <span className="text-amber-600">決済失敗</span>
                      ) : (
                        <span className="text-neutral-500">未課金</span>
                      )}
                      {u.planName && (
                        <span className="ml-1 text-xs">({u.planName})</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-neutral-500">
                      {u.lastMessageAt
                        ? new Date(u.lastMessageAt).toLocaleDateString("ja-JP")
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
