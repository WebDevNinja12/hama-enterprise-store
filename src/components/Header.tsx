"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingCart,
  User,
  Search,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useTheme } from "@/context/ThemeContext";

const navLinks = [
  { href: "/", label: "Store" },
  { href: "/catalog", label: "Catalog" },
  { href: "/cart", label: "Cart" },
  { href: "/checkout", label: "Checkout" },
];

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalItems } = useCart();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--header-bg)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-bold text-cyan-500">
            H
          </div>
          <span className="hidden text-sm font-bold tracking-wide text-[var(--heading)] sm:block">
            HAMA ENTERPRISE NG
          </span>
        </Link>

        <div className="relative mx-4 hidden flex-1 max-w-md md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="search"
            placeholder="Search high-tech gadgets..."
            className="input h-10 pl-10 text-sm"
          />
        </div>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-cyan-500/15 text-cyan-500"
                  : "text-[var(--muted)] hover:text-[var(--heading)]"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--nav-hover)] hover:text-[var(--heading)]"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          <Link
            href="/cart"
            className="relative rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--nav-hover)] hover:text-[var(--heading)]"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-500 px-1 text-[10px] font-bold text-black">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </Link>

          <Link
            href="/login"
            className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--nav-hover)] hover:text-[var(--heading)]"
          >
            <User className="h-5 w-5" />
          </Link>

          <button
            className="rounded-lg p-2 text-[var(--muted)] md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-[var(--border)] bg-[var(--card)] px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium",
                  pathname === link.href
                    ? "bg-cyan-500/15 text-cyan-500"
                    : "text-[var(--muted)]"
                )}
              >
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                toggleTheme();
                setMobileOpen(false);
              }}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-[var(--muted)]"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-4 w-4" /> Light mode
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" /> Dark mode
                </>
              )}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
