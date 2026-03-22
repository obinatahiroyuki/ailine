"use client";

import { useState, useEffect } from "react";
import { registerWithBilling } from "./actions";

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [plans, setPlans] = useState<{ id: string; name: string; monthlyPrice: number }[]>([]);
  const [billingEnabled, setBillingEnabled] = useState(false);

  useEffect(() => {
    fetch("/api/register/plans")
      .then((r) => r.json())
      .then((d) => {
        setPlans(d.plans ?? []);
        setBillingEnabled(d.billingEnabled ?? false);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await registerWithBilling(formData);
    setIsLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    if (result?.checkoutUrl) {
      window.location.href = result.checkoutUrl;
      return;
    }

    if (result?.redirectUrl) {
      window.location.href = result.redirectUrl;
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-lg border border-neutral-200 bg-white p-6"
    >
      <div>
        <h2 className="mb-4 font-medium text-neutral-900">アカウント情報</h2>
        <div className="space-y-4">
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
      </div>

      <div>
        <h2 className="mb-4 font-medium text-neutral-900">LINEチャネル情報</h2>
        <p className="mb-4 text-sm text-neutral-500">
          LINE Developers で作成した Messaging API チャネルの情報を入力してください。
        </p>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              チャネルID
            </label>
            <input
              name="channelId"
              type="text"
              required
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              placeholder="1234567890"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              チャネルシークレット
            </label>
            <input
              name="channelSecret"
              type="password"
              required
              autoComplete="off"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              チャネルアクセストークン
            </label>
            <input
              name="accessToken"
              type="password"
              required
              autoComplete="off"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {billingEnabled && plans.length > 0 && (
        <div>
          <h2 className="mb-4 font-medium text-neutral-900">プラン選択</h2>
          <div className="space-y-2">
            {plans.map((p) => (
              <label
                key={p.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-neutral-200 p-4 hover:bg-neutral-50"
              >
                <input
                  name="planId"
                  type="radio"
                  value={p.id}
                  required={billingEnabled}
                  className="h-4 w-4"
                />
                <span className="font-medium">{p.name}</span>
                <span className="text-neutral-500">
                  月額 ¥{p.monthlyPrice.toLocaleString()}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {billingEnabled && plans.length === 0 && (
        <p className="text-sm text-amber-700">
          課金が有効ですが、プランが設定されていません。システム管理者に連絡してください。
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isLoading || (billingEnabled && plans.length === 0)}
        className="w-full rounded-lg bg-neutral-900 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {isLoading ? "登録中..." : billingEnabled ? "登録して課金する" : "登録する"}
      </button>
    </form>
  );
}
