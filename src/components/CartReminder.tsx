"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useCart } from "@/context/CartContext";

/**
 * When cart items have 1–2 days left and user is signed in,
 * request a reminder email (once per item window).
 */
export default function CartReminder() {
  const { data: session, status } = useSession();
  const { items, needsReminder, daysLeft, markReminded } = useCart();
  const sentRef = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.email) return;

    const due = items.filter((i) => needsReminder(i));
    if (due.length === 0) return;

    // Debounce duplicate fires in same session
    if (sentRef.current) return;
    sentRef.current = true;

    const payload = due.map((i) => ({
      id: i.id,
      name: i.name,
      daysLeft: daysLeft(i),
    }));

    fetch("/api/cart/remind", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: payload }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          markReminded(due.map((i) => i.id));
        } else {
          sentRef.current = false;
        }
      })
      .catch(() => {
        sentRef.current = false;
      });
  }, [items, status, session, needsReminder, daysLeft, markReminded]);

  return null;
}
