"use client";

import { useState } from "react";

type Props = {
  lineChannelId: string;
  billingEnabled: boolean;
  isExempt: boolean;
  subscription: {
    status: string;
    planName: string;
    monthlyPrice: number;
    stripeSubscriptionId: string | null;
  } | null;
  plans: { id: string; name: string; monthlyPrice: number }[];
};

export function SubscriptionSection({
  lineChannelId,
  billingEnabled,
  isExempt,
  subscription,
  plans,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);

  if (!billingEnabled) return null;

  async function handleSubscribe(planId: string) {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/stripe/checkout?channelId=${lineChannelId}&planId=${planId}`,
        { method: "POST" }
      );
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "エラーが発生しました");
      }
    } catch (err) {
      alert("エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  }

  if (isExempt) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6">
        <h2 className="mb-2 font-medium text-green-900">課金ステータス</h2>
        <p className="text-sm text-green-800">
          システム管理者がコンテンツ管理者に含まれているため、課金は免除されています。
        </p>
      </div>
    );
  }

  if (subscription?.status === "active") {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="mb-2 font-medium text-neutral-900">サブスクリプション</h2>
        <p className="text-sm text-neutral-600">
          {subscription.planName} - 月額 ¥{subscription.monthlyPrice.toLocaleString()}
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          ステータス: 有効
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
      <h2 className="mb-2 font-medium text-amber-900">サブスクリプション</h2>
      <p className="mb-4 text-sm text-amber-800">
        AI機能を利用するにはサブスクリプション契約が必要です。
      </p>
      <div className="flex flex-wrap gap-2">
        {plans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => handleSubscribe(plan.id)}
            disabled={isLoading}
            className="rounded-lg bg-amber-900 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-50"
          >
            {plan.name} - ¥{plan.monthlyPrice.toLocaleString()}/月
          </button>
        ))}
      </div>
      {plans.length === 0 && (
        <p className="text-sm text-amber-700">
          プランがありません。システム管理者にご連絡ください。
        </p>
      )}
    </div>
  );
}
