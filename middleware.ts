import { auth } from "./auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;

  // 未認証で /admin にアクセス（login 以外）→ ログインページへ
  if (!isLoggedIn && pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const url = new URL("/admin/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return Response.redirect(url);
  }

  return undefined;
});

export const config = {
  matcher: ["/admin/:path*"],
};
