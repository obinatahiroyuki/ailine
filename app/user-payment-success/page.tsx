export default function UserPaymentSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="max-w-md rounded-lg border border-green-200 bg-green-50 p-8 text-center">
        <h1 className="mb-2 text-lg font-medium text-green-900">
          お支払いが完了しました
        </h1>
        <p className="text-sm text-green-800">
          LINEに戻り、メッセージを送信してチャットボットをご利用ください。
        </p>
      </div>
    </div>
  );
}
