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
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useTheme } from "@/context/ThemeContext";
import Logo from "@/components/Logo";

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
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--header-bg)] backdrop-blur-2xl">
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        <div className="relative mx-2 hidden flex-1 max-w-sm md:block lg:mx-6">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="search"
            placeholder="Search gadgets..."
            className="input h-10 rounded-full pl-10 text-sm"
          />
        </div>

        <nav className="ml-auto hidden items-center gap-0.5 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-cyan-500/15 text-cyan-400"
                  : "text-[var(--muted)] hover:bg-[var(--nav-hover)] hover:text-[var(--heading)]"
              )}
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://hama-enterprise-ng.vercel.app/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full px-3.5 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--nav-hover)] hover:text-[var(--heading)]"
          >
            Main site
          </a>
        </nav>

        <div className="flex items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-full p-2.5 text-[var(--muted)] transition hover:bg-[var(--nav-hover)] hover:text-[var(--heading)]"
            title={theme === "dark" ? "Light mode" : "Dark mode"}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-[18px] w-[18px]" />
            ) : (
              <Moon className="h-[18px] w-[18px]" />
            )}
          </button>

          <Link
            href="/cart"
            className="relative rounded-full p-2.5 text-[var(--muted)] transition hover:bg-[var(--nav-hover)] hover:text-[var(--heading)]"
          >
            <ShoppingCart className="h-[18px] w-[18px]" />
            {totalItems > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-400 px-1 text-[10px] font-bold text-black">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </Link>

          <Link
            href={session ? "/account" : "/login"}
            className="rounded-full p-2.5 text-[var(--muted)] transition hover:bg-[var(--nav-hover)] hover:text-[var(--heading)]"
            title={session ? "My account" : "Sign in"}
          >
            <User className="h-[18px] w-[18px]" />
          </Link>

          <button
            className="rounded-full p-2.5 text-[var(--muted)] md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-[var(--border)] bg-[var(--card-solid)] px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-sm font-medium",
                  pathname === link.href
                    ? "bg-cyan-500/15 text-cyan-400"
                    : "text-[var(--muted)]"
                )}
              >
                {link.label}
              </Link>
            ))}
            <a
              href="https://hama-enterprise-ng.vercel.app/index.html"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-3 py-2.5 text-sm text-[var(--muted)]"
            >
              Main site
            </a>
            <Link
              href={session ? "/account" : "/login"}
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-3 py-2.5 text-sm text-[var(--muted)]"
            >
              {session ? "My account" : "Sign in"}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
