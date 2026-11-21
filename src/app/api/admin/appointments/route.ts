import { UserRole } from "@prisma/client";
import { fail, ok } from "@/lib/api";
import { isReviewStatus, normalizeAppointmentInput, validateAppointmentInput } from "@/lib/appointment";
import { requireRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;

  const data = await prisma.appointmentRequest.findMany({
    orderBy: [{ createdAt: "desc" }],
  });
  return ok(data);
}

export async function POST(req: Request) {
  const auth = await requireRole([UserRole.ADMIN, UserRole.EDITOR]);
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const reviewStatus = (body as { reviewStatus?: unknown } | null)?.reviewStatus;
  const payload = normalizeAppointmentInput(body);
  const validationMessage = validateAppointmentInput(payload);

  if (validationMessage) {
    return fail(validationMessage, 422);
  }

  const data = await prisma.appointmentRequest.create({
    data: {
      companyName: payload.companyName,
      contactName: payload.contactName,
      contactInfo: payload.contactInfo,
      sourcePage: payload.sourcePage,
      notes: payload.notes,
      topic: payload.topic,
      reviewStatus: isReviewStatus(reviewStatus) ? reviewStatus : "PENDING",
      reviewedAt: isReviewStatus(reviewStatus) && reviewStatus !== "PENDING" ? new Date() : null,
    },
  });

  return ok(data);
}
