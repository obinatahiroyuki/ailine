"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteDocument } from "./documents-actions";

const MAX_KNOWLEDGE_CHARS = 50_000;
const UPLOAD_PROGRESS_MAX = 90; // アップロード完了までは90%まで表示

export function DocumentsSection({
  lineChannelId,
  documents,
  totalChars,
}: {
  lineChannelId: string;
  documents: { id: string; filename: string; contentType: string; createdAt: Date }[];
  totalChars: number;
}) {
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const isUploading = uploadProgress !== null;

  function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setUploadProgress(0);
    setUploadStatus("送信中...");

    const form = e.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("file") as File;

    if (!file || file.size === 0) {
      setError("ファイルを選択してください");
      setUploadProgress(null);
      return;
    }

    const xhr = new XMLHttpRequest();
    const url = `/api/admin/channels/${lineChannelId}/documents`;

    xhr.upload.addEventListener("progress", (ev) => {
      if (ev.lengthComputable) {
        const pct = Math.round((ev.loaded / ev.total) * UPLOAD_PROGRESS_MAX);
        setUploadProgress(pct);
      }
    });

    xhr.upload.addEventListener("load", () => {
      setUploadStatus("処理中...");
      setUploadProgress(UPLOAD_PROGRESS_MAX);
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setUploadProgress(100);
        setUploadStatus("完了");
        form.reset();
        setTimeout(() => {
          setUploadProgress(null);
          setUploadStatus("");
          router.refresh(); // 一覧を更新
        }, 500);
      } else {
        try {
          const res = JSON.parse(xhr.responseText);
          setError(res.error ?? "アップロードに失敗しました");
        } catch {
          setError("アップロードに失敗しました");
        }
        setUploadProgress(null);
        setUploadStatus("");
      }
    });

    xhr.addEventListener("error", () => {
      setError("ネットワークエラーが発生しました");
      setUploadProgress(null);
      setUploadStatus("");
    });

    xhr.addEventListener("abort", () => {
      setUploadProgress(null);
      setUploadStatus("");
    });

    xhr.open("POST", url);
    xhr.send(formData);

    setUploadStatus("送信中...");
  }

  async function handleDelete(documentId: string) {
    setDeletingId(documentId);
    setError(null);
    const result = await deleteDocument(lineChannelId, documentId);
    setDeletingId(null);
    if (result.error) {
      setError(result.error);
    }
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6">
      <h2 className="mb-4 font-medium text-neutral-900">
        ナレッジベース（参考ドキュメント）
      </h2>
      <p className="mb-4 text-sm text-neutral-500">
        PDFやテキストファイルをアップロードすると、AIの応答時に参照されます。マニュアルやFAQなどを登録して、GPTsのように専門的な回答をさせることができます。
      </p>

      <form onSubmit={handleUpload} className="mb-6 space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              ファイルを追加
            </label>
            <input
              name="file"
              type="file"
              accept=".pdf,.txt,.md,.csv,.json"
              className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-200"
              required
              disabled={isUploading}
            />
          </div>
          <button
            type="submit"
            disabled={isUploading}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {isUploading ? `${uploadProgress}%` : "アップロード"}
          </button>
        </div>
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600">{uploadStatus}</span>
              <span className="font-medium text-neutral-900">{uploadProgress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full rounded-full bg-neutral-900 transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </form>

      <p className="mb-4 text-xs text-neutral-500">
        対応形式: PDF, TXT, MD, CSV, JSON（各ファイル最大10MB）
      </p>

      {documents.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <p className="text-sm text-neutral-600">
            合計 <span className="font-medium">{totalChars.toLocaleString()}</span> 文字
          </p>
          {totalChars > MAX_KNOWLEDGE_CHARS ? (
            <p className="text-sm text-amber-700">
              ⚠ {MAX_KNOWLEDGE_CHARS.toLocaleString()}文字を超えています。先頭{MAX_KNOWLEDGE_CHARS.toLocaleString()}文字のみAIに渡されます。不要なドキュメントを削除するか、内容を短くすることをおすすめします。
            </p>
          ) : (
            <p className="text-xs text-neutral-500">
              （{MAX_KNOWLEDGE_CHARS.toLocaleString()}文字を超えると、超えた分はAIに渡されません）
            </p>
          )}
        </div>
      )}

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {documents.length > 0 ? (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3"
            >
              <div>
                <span className="font-medium text-neutral-900">{doc.filename}</span>
                <span className="ml-2 text-xs text-neutral-500">
                  {doc.contentType} · {new Date(doc.createdAt).toLocaleDateString("ja-JP")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(doc.id)}
                disabled={deletingId === doc.id}
                className="text-sm text-red-600 hover:underline disabled:opacity-50"
              >
                {deletingId === doc.id ? "削除中..." : "削除"}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-neutral-500">
          まだドキュメントが登録されていません。上記からアップロードしてください。
        </p>
      )}
    </div>
  );
}
