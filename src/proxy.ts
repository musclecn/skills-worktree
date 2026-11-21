import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** 把页面语言传给根布局，使英文页输出 <html lang="en">。 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-site-locale", pathname === "/en" || pathname.startsWith("/en/") ? "en" : "zh");

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // 只处理页面请求：排除接口、构建产物和带扩展名的静态文件。
  matcher: ["/((?!api|_next/static|_next/image|.*\\.[a-zA-Z0-9]+$).*)"],
};
