"use client";

import * as React from "react";
import type { AppUser } from "@/types";

const UserContext = React.createContext<AppUser | null>(null);

export function UserProvider({
  user,
  children,
}: {
  user: AppUser | null;
  children: React.ReactNode;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

/** Read the signed-in app user (with role) inside any client component. */
export function useUser(): AppUser | null {
  return React.useContext(UserContext);
}
