/**
 * PDF・テキストファイルからテキストを抽出
 */
import { extractText, getDocumentProxy } from "unpdf";

const MAX_TEXT_LENGTH = 100_000; // 1ファイルあたり最大10万文字
const SUPPORTED_PDF_TYPES = ["application/pdf"];
const SUPPORTED_TEXT_TYPES = [
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
];

export type ParseResult =
  | { ok: true; text: string; contentType: string }
  | { ok: false; error: string };

export async function parseDocument(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<ParseResult> {
  const normalizedType = contentType.toLowerCase().split(";")[0].trim();

  // PDF
  if (SUPPORTED_PDF_TYPES.includes(normalizedType)) {
    try {
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const { text } = await extractText(pdf, { mergePages: true });
      const trimmed = (text ?? "").trim().slice(0, MAX_TEXT_LENGTH);
      return {
        ok: true,
        text: trimmed,
        contentType: "application/pdf",
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: `PDFの解析に失敗しました: ${msg}` };
    }
  }

  // テキスト系
  if (SUPPORTED_TEXT_TYPES.includes(normalizedType)) {
    try {
      const text = buffer.toString("utf-8").trim().slice(0, MAX_TEXT_LENGTH);
      return {
        ok: true,
        text,
        contentType: normalizedType,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: `テキストの読み込みに失敗しました: ${msg}` };
    }
  }

  return {
    ok: false,
    error: `未対応のファイル形式です: ${contentType}。PDF (.pdf) またはテキスト (.txt, .md, .csv, .json) をアップロードしてください。`,
  };
}

export function getSupportedExtensions(): string[] {
  return [".pdf", ".txt", ".md", ".csv", ".json"];
}
