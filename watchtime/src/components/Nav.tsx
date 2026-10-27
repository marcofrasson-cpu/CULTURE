"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Ofertas" },
  { href: "/alertas", label: "Alertas" },
  { href: "/lojas", label: "Lojas" },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 border-t border-line bg-bg/95 backdrop-blur-none">
      <div className="max-w-2xl mx-auto grid grid-cols-3 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((t) => {
          const active = t.href === "/" ? path === "/" || path.startsWith("/p/") : path.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`py-3 text-center text-sm ${active ? "text-fg" : "text-muted"}`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
