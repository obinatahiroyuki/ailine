import { createHmac, timingSafeEqual } from "crypto";

const LINE_SIGNATURE_HEADER = "x-line-signature";

export function getLineSignature(request: Request): string | null {
  return request.headers.get(LINE_SIGNATURE_HEADER);
}

export function verifyLineSignature(
  body: string,
  channelSecret: string,
  signature: string
): boolean {
  const hash = createHmac("sha256", channelSecret)
    .update(body, "utf8")
    .digest("base64");

  if (hash.length !== signature.length) return false;
  try {
    return timingSafeEqual(
      Buffer.from(hash, "utf8"),
      Buffer.from(signature, "utf8")
    );
  } catch {
    return false;
  }
}
