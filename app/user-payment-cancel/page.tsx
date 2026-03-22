export default function UserPaymentCancelPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="max-w-md rounded-lg border border-neutral-200 bg-white p-8 text-center">
        <h1 className="mb-2 text-lg font-medium text-neutral-900">
          お支払いがキャンセルされました
        </h1>
        <p className="text-sm text-neutral-600">
          チャットボットをご利用になるには、お支払い手続きが必要です。
          LINEから再度お試しください。
        </p>
      </div>
    </div>
  );
}
