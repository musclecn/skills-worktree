import type { UserRole } from "@prisma/client";

export type AppLocale = "zh" | "en";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};
