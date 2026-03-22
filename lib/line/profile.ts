/**
 * LINE プロフィール API で表示名を取得
 * https://developers.line.biz/ja/reference/messaging-api/#get-profile
 */
export async function getLineUserProfile(
  accessToken: string,
  userId: string
): Promise<{ displayName?: string; pictureUrl?: string } | null> {
  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      displayName?: string;
      pictureUrl?: string;
    };
    return json;
  } catch {
    return null;
  }
}
