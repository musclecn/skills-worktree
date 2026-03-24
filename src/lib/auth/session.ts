import { UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { SessionUser } from "@/lib/types";

export const SESSION_COOKIE_NAME = "sztaxs_session";
const DEFAULT_MAX_AGE = 60 * 60 * 12;

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing SESSION_SECRET");
  }
  return new TextEncoder().encode(secret);
}

type SessionPayload = {
  sub: string;
  name: string;
  email: string;
  role: UserRole;
};

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${DEFAULT_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string) {
  const verified = await jwtVerify<SessionPayload>(token, getSecret());
  return {
    id: verified.payload.sub,
    name: verified.payload.name,
    email: verified.payload.email,
    role: verified.payload.role,
  } as SessionUser;
}

export async function getSessionUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DEFAULT_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
