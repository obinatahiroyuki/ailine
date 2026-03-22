"use client";

import { useState } from "react";
import { uploadDocument, deleteDocument } from "./documents-actions";

const MAX_KNOWLEDGE_CHARS = 50_000;

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
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsUploading(true);

    const formData = new FormData(e.currentTarget);
    const result = await uploadDocument(lineChannelId, formData);
    setIsUploading(false);

    if (result.error) {
      setError(result.error);
    } else {
      (e.target as HTMLFormElement).reset();
    }
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

      <form onSubmit={handleUpload} className="mb-6 flex flex-wrap items-end gap-4">
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
          />
        </div>
        <button
          type="submit"
          disabled={isUploading}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {isUploading ? "アップロード中..." : "アップロード"}
        </button>
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
