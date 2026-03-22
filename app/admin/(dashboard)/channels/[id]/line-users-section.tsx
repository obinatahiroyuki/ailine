type Props = {
  users: {
    lineUserId: string;
    displayName: string | null;
    joinedAt: Date | null;
    lastMessageAt: Date | null;
    billingStatus: string;
    planName: string | null;
    totalInputTokens: number;
    totalOutputTokens: number;
  }[];
  userPaymentRequired: boolean;
};

export function LineUsersSection({ users, userPaymentRequired }: Props) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6">
      <h2 className="mb-4 font-medium text-neutral-900">
        LINE公式アカウントのユーザー一覧
      </h2>
      <p className="mb-4 text-sm text-neutral-600">
        このチャネルでメッセージを送ったLINEユーザー一覧です。名前はLINEのプロフィールから取得しています。
      </p>

      {users.length === 0 ? (
        <p className="text-sm text-neutral-500">
          まだメッセージを送ったユーザーはいません。
        </p>
      ) : (
        <div className="overflow-x-auto rounded border border-neutral-200">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-3 py-2 font-medium">参加日時</th>
                <th className="px-3 py-2 font-medium">名前</th>
                <th className="px-3 py-2 font-medium">LINE ID</th>
                <th className="px-3 py-2 font-medium">課金状態</th>
                <th className="px-3 py-2 font-medium">消費トークン</th>
                <th className="px-3 py-2 font-medium">最終利用</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.lineUserId} className="border-t border-neutral-100">
                  <td className="px-3 py-2 text-neutral-600">
                    {u.joinedAt
                      ? new Date(u.joinedAt).toLocaleString("ja-JP", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {u.displayName || (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {u.lineUserId}
                  </td>
                  <td className="px-3 py-2">
                    {!userPaymentRequired ? (
                      <span className="text-neutral-500">—</span>
                    ) : u.billingStatus === "active" ? (
                      <span className="text-green-600">
                        課金済み{u.planName ? ` (${u.planName})` : ""}
                      </span>
                    ) : u.billingStatus === "past_due" ? (
                      <span className="text-amber-600">決済失敗</span>
                    ) : (
                      <span className="text-neutral-500">未課金</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span title={`入力: ${u.totalInputTokens} / 出力: ${u.totalOutputTokens}`}>
                      {(u.totalInputTokens + u.totalOutputTokens).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-neutral-600">
                    {u.lastMessageAt
                      ? new Date(u.lastMessageAt).toLocaleString("ja-JP", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
