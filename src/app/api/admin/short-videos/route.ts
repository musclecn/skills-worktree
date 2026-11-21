import { UserRole } from "@prisma/client";
import { fail, ok } from "@/lib/api";
import { requireRole } from "@/lib/auth/guard";
import { getShortVideos, uploadShortVideo } from "@/lib/short-videos";

export async function GET() {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;

  const data = await getShortVideos();
  return ok(data);
}

export async function POST(req: Request) {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;

  const formData = await req.formData();
  const file = formData.get("file");
  const title = formData.get("title");

  if (!(file instanceof File)) {
    return fail("file is required", 422);
  }

  try {
    const item = await uploadShortVideo(file, typeof title === "string" ? title : undefined);
    return ok(item);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "视频上传失败", 422);
  }
}
