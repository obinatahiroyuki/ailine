"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function UserPaymentContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "redirecting" | "error">(
    "loading"
  );
  const [errorMsg, setErrorMsg] = useState<string>("");

  const channelId = searchParams.get("channelId");
  const lineUserId = searchParams.get("lineUserId");

  useEffect(() => {
    if (!channelId || !lineUserId) {
      setErrorMsg("リンクが正しくありません。");
      setStatus("error");
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/stripe/user-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lineChannelId: channelId,
            lineUserId,
          }),
        });
        const data = await res.json();

        if (data.url) {
          setStatus("redirecting");
          window.location.href = data.url;
          return;
        }

        setErrorMsg(data.error ?? "お支払いページの作成に失敗しました。");
        setStatus("error");
      } catch {
        setErrorMsg("エラーが発生しました。しばらくしてからお試しください。");
        setStatus("error");
      }
    })();
  }, [channelId, lineUserId]);

  if (status === "redirecting") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="text-center">
          <p className="text-neutral-600">決済ページへ移動しています...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <h1 className="mb-2 font-medium text-red-900">エラー</h1>
          <p className="text-sm text-red-800">{errorMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="text-center">
        <p className="text-neutral-600">読み込み中...</p>
      </div>
    </div>
  );
}

export default function UserPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-neutral-50">
          <p className="text-neutral-600">読み込み中...</p>
        </div>
      }
    >
      <UserPaymentContent />
    </Suspense>
  );
}
