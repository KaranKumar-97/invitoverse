import type { DefaultSession } from "next-auth";

type Role = "USER" | "ADMIN" | "SUPERADMIN";

declare module "next-auth" {
  interface Session {
    user: { id: string; role: Role } & DefaultSession["user"];
  }
  interface User {
    role?: Role;
    deletedAt?: Date | null;
    suspendedAt?: Date | null;
  }
}
