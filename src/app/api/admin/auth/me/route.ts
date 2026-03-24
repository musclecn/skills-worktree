import { fail, ok } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return fail("Unauthorized", 401);
  }
  return ok({ user });
}
