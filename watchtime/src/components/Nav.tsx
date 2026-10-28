"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Ofertas" },
  { href: "/alertas", label: "Alertas" },
  { href: "/lojas", label: "Lojas" },
];

function isActive(href: string, path: string) {
  return href === "/" ? path === "/" || path.startsWith("/p/") : path.startsWith(href);
}

/** Abas no topo (desktop). */
export function TopNav() {
  const path = usePathname();
  return (
    <nav className="hidden md:flex gap-1">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`h-9 px-3 rounded-md text-sm flex items-center ${isActive(t.href, path) ? "bg-card text-fg" : "text-muted"}`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

/** Abas no rodapé (celular). */
export function Nav() {
  const path = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 border-t border-line bg-bg/95">
      <div className="grid grid-cols-3 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((t) => (
          <Link key={t.href} href={t.href} className={`py-3 text-center text-sm ${isActive(t.href, path) ? "text-fg" : "text-muted"}`}>
            {t.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
