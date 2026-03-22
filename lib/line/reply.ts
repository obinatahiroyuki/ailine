const LINE_REPLY_URL = "https://api.line.me/v2/bot/message/reply";

export async function replyToLine(
  accessToken: string,
  replyToken: string,
  text: string
): Promise<boolean> {
  const res = await fetch(LINE_REPLY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text }],
    }),
  });
  if (!res.ok) {
    const errBody = await res.text();
    console.error("[LINE reply failed]", res.status, errBody);
  }
  return res.ok;
}
