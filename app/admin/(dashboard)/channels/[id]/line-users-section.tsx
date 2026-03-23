"use client";

import { useState } from "react";
import { downloadLineMessages } from "./line-messages-actions";

type Props = {
  lineChannelId: string;
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

export function LineUsersSection({
  lineChannelId,
  users,
  userPaymentRequired,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);

  const toggleOne = (lineUserId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(lineUserId)) next.delete(lineUserId);
      else next.add(lineUserId);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(users.map((u) => u.lineUserId)));
  const selectNone = () => setSelected(new Set());

  async function handleDownload() {
    const ids = Array.from(selected);
    if (ids.length === 0) {
      alert("ダウンロードするユーザーを選択してください");
      return;
    }
    setIsDownloading(true);
    try {
      const displayNames: Record<string, string | null> = {};
      for (const u of users) {
        displayNames[u.lineUserId] = u.displayName;
      }
      const result = await downloadLineMessages(lineChannelId, ids, displayNames);
      if (result.error) {
        alert(result.error);
        return;
      }
      if (!result.text) {
        alert("ダウンロードに失敗しました");
        return;
      }
      const blob = new Blob([result.text], {
        type: "text/plain;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `line-messages-${new Date().toISOString().slice(0, 10)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("ダウンロード中にエラーが発生しました");
    } finally {
      setIsDownloading(false);
    }
  }

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
        <>
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <span className="text-sm text-neutral-600">
              <button
                type="button"
                onClick={selectAll}
                className="text-neutral-600 underline hover:text-neutral-900"
              >
                すべて選択
              </button>
              {" / "}
              <button
                type="button"
                onClick={selectNone}
                className="text-neutral-600 underline hover:text-neutral-900"
              >
                選択解除
              </button>
            </span>
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading || selected.size === 0}
              className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {isDownloading ? "ダウンロード中..." : "メッセージをダウンロード"}
            </button>
          </div>
          <div className="overflow-x-auto rounded border border-neutral-200">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="w-10 px-2 py-2">
                    <span className="sr-only">選択</span>
                  </th>
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
                    <td className="px-2 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(u.lineUserId)}
                        onChange={() => toggleOne(u.lineUserId)}
                        className="rounded border-neutral-300"
                      />
                    </td>
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
                      <span
                        title={`入力: ${u.totalInputTokens} / 出力: ${u.totalOutputTokens}`}
                      >
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
          <p className="mt-2 text-xs text-neutral-500">
            チェックを入れたユーザーのメッセージ履歴をテキストファイルでダウンロードできます。
          </p>
        </>
      )}
    </div>
  );
}
