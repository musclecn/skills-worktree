import { ok } from "@/lib/api";
import { clearSessionCookie } from "@/lib/auth/session";

export async function POST() {
  await clearSessionCookie();
  return ok({ message: "logged out" });
}
