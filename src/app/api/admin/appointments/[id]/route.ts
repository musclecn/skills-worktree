import { UserRole } from "@prisma/client";
import { fail, ok } from "@/lib/api";
import { isReviewStatus, normalizeAppointmentInput, validateAppointmentInput } from "@/lib/appointment";
import { requireRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const data = await prisma.appointmentRequest.findUnique({ where: { id } });
  return ok(data);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const payload = normalizeAppointmentInput(body);
  const validationMessage = validateAppointmentInput(payload);

  if (validationMessage) {
    return fail(validationMessage, 422);
  }

  const reviewStatus = (body as { reviewStatus?: unknown } | null)?.reviewStatus;
  const current = await prisma.appointmentRequest.findUnique({
    where: { id },
    select: { reviewStatus: true },
  });
  if (!current) {
    return fail("预约记录不存在", 404);
  }
  const statusChanged = isReviewStatus(reviewStatus) && reviewStatus !== current.reviewStatus;

  const data = await prisma.appointmentRequest.update({
    where: { id },
    data: {
      companyName: payload.companyName,
      contactName: payload.contactName,
      contactInfo: payload.contactInfo,
      sourcePage: payload.sourcePage,
      notes: payload.notes,
      topic: payload.topic,
      ...(statusChanged ? { reviewStatus, reviewedAt: new Date() } : {}),
    },
  });

  return ok(data);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  await prisma.appointmentRequest.delete({ where: { id } });
  return ok({ deleted: true });
}
