import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Delete own account permanently */
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const userId = session.user.id;

    // Prevent deleting the last admin accidentally is optional;
    // allow self-delete for all including admin
    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ ok: true, message: "Account deleted" });
  } catch (err) {
    console.error("Delete account error:", err);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
