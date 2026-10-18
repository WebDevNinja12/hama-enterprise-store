"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Clock, Tag, Package } from "lucide-react";

type Suggest = {
  type: "product" | "category" | "popular";
  id: string;
  name: string;
  slug?: string;
  category?: string;
  price?: number;
  image?: string;
};

const RECENT_KEY = "hama-recent-searches";
const DEBOUNCE_MS = 280;
const MAX_RECENT = 6;

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function saveRecent(q: string) {
  try {
    const prev = loadRecent().filter((x) => x.toLowerCase() !== q.toLowerCase());
    const next = [q, ...prev].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export default function SearchBar({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Suggest[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const runSearch = useCallback(async (term: string) => {
    if (term.trim().length < 2) {
      setItems([]);
      setLoading(false);
      return;
    }
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(term.trim().slice(0, 64))}`,
        { signal: ac.signal }
      );
      const data = await res.json();
      if (!ac.signal.aborted) setItems(data.results || []);
    } catch {
      if (!ac.signal.aborted) setItems([]);
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, []);

  function onChange(value: string) {
    setQ(value);
    setOpen(true);
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length < 2) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(() => runSearch(value), DEBOUNCE_MS);
  }

  function go(term: string, slug?: string) {
    const t = term.trim();
    if (!t) return;
    saveRecent(t);
    setRecent(loadRecent());
    setOpen(false);
    setQ(t);
    if (slug) router.push(`/catalog?q=${encodeURIComponent(t)}#${slug}`);
    else router.push(`/catalog?q=${encodeURIComponent(t)}`);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    go(q);
  }

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <form onSubmit={onSubmit}>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
        <input
          type="search"
          value={q}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search products..."
          autoComplete="off"
          maxLength={64}
          className="input h-10 w-full rounded-full pl-10 pr-3 text-sm"
          aria-label="Search products"
          aria-autocomplete="list"
          aria-expanded={open}
        />
      </form>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] shadow-xl">
          {q.trim().length < 2 && recent.length > 0 && (
            <div className="p-2">
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                Recent
              </p>
              {recent.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => go(r)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[var(--heading)] hover:bg-cyan-500/10"
                >
                  <Clock className="h-3.5 w-3.5 text-[var(--muted)]" />
                  {r}
                </button>
              ))}
            </div>
          )}

          {q.trim().length >= 2 && (
            <div className="max-h-80 overflow-y-auto p-2">
              {loading && (
                <p className="px-3 py-2 text-xs text-[var(--muted)]">Searching…</p>
              )}
              {!loading && items.length === 0 && (
                <p className="px-3 py-2 text-xs text-[var(--muted)]">No matches</p>
              )}
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => go(item.name, item.slug)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-cyan-500/10"
                >
                  {item.type === "product" && item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt=""
                      className="h-9 w-9 rounded-lg object-cover"
                    />
                  ) : item.type === "category" ? (
                    <Tag className="h-4 w-4 shrink-0 text-cyan-400" />
                  ) : item.type === "popular" ? (
                    <Search className="h-4 w-4 shrink-0 text-[var(--muted)]" />
                  ) : (
                    <Package className="h-4 w-4 shrink-0 text-cyan-400" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[var(--heading)]">
                      {item.name}
                    </span>
                    {item.category && (
                      <span className="block text-[11px] text-[var(--muted)]">
                        {item.category}
                        {item.price != null ? ` · $${item.price}` : ""}
                      </span>
                    )}
                    {item.type === "popular" && (
                      <span className="block text-[11px] text-[var(--muted)]">
                        Popular search
                      </span>
                    )}
                    {item.type === "category" && (
                      <span className="block text-[11px] text-[var(--muted)]">
                        Category
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
