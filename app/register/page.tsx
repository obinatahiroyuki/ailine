import Link from "next/link";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="mb-2 text-2xl font-semibold text-neutral-900">
        コンテンツ管理者として登録
      </h1>
      <p className="mb-8 text-sm text-neutral-600">
        LINE公式アカウントの情報と課金プランをお選びいただき、登録とお支払いを完了してください。
      </p>

      <RegisterForm />

      <p className="mt-8 text-center text-sm text-neutral-500">
        既にアカウントをお持ちの方は{" "}
        <Link href="/admin/login" className="text-neutral-900 underline hover:no-underline">
          ログイン
        </Link>
      </p>
    </div>
  );
}
