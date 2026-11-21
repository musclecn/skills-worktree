import { UserRole } from "@prisma/client";
import { fail, ok } from "@/lib/api";
import { requireRole } from "@/lib/auth/guard";
import { deleteShortVideo, updateShortVideoTitle } from "@/lib/short-videos";

export async function PATCH(req: Request, { params }: { params: Promise<{ fileName: string }> }) {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;

  const { fileName } = await params;
  const body = await req.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title : "";

  try {
    const item = await updateShortVideoTitle(fileName, title);
    return ok(item);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "视频更新失败", 422);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ fileName: string }> }) {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;

  const { fileName } = await params;
  try {
    const result = await deleteShortVideo(fileName);
    return ok(result);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "视频删除失败", 422);
  }
}
