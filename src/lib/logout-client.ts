/** Client helper: sign out and force-clear cookies. */
export async function fullLogout(callbackUrl = "/") {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    /* still continue */
  }
  try {
    const { signOut } = await import("next-auth/react");
    await signOut({ callbackUrl, redirect: true });
  } catch {
    if (typeof window !== "undefined") {
      window.location.href = callbackUrl;
    }
  }
}
