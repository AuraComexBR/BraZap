"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  adminOnly?: boolean;
  comingSoon?: boolean;
};

// Itens ja funcionais + o resto do roadmap do BraZap (ver README_brazap.md,
// secao "Roadmap em fases"), pra deixar visivel pra onde o produto vai sem
// precisar ir consultar o documento. Itens "comingSoon" ficam desabilitados.
const NAV_ITEMS: NavItem[] = [
  { label: "Inbox", href: "/inbox" },
  { label: "Contatos", href: "/contacts", comingSoon: true },
  { label: "Templates", href: "/templates", comingSoon: true },
  { label: "Automações", href: "/automations", comingSoon: true },
  { label: "Métricas", href: "/metrics", comingSoon: true },
  { label: "Tenants", href: "/admin", adminOnly: true },
  { label: "Configurações", href: "/settings", comingSoon: true },
];

export default function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <nav
      style={{
        width: 200,
        borderRight: "1px solid #eee",
        padding: "1rem 0.5rem",
        display: "grid",
        gap: "0.25rem",
        alignContent: "start",
      }}
    >
      {items.map((item) => {
        const active = pathname?.startsWith(item.href);

        if (item.comingSoon) {
          return (
            <div
              key={item.href}
              style={{
                padding: "0.5rem 0.75rem",
                borderRadius: 6,
                color: "#aaa",
                fontSize: "0.9rem",
                display: "flex",
                justifyContent: "space-between",
              }}
              title="Ainda não implementado"
            >
              <span>{item.label}</span>
              <span style={{ fontSize: "0.7rem" }}>em breve</span>
            </div>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: 6,
              textDecoration: "none",
              color: active ? "#111" : "#444",
              background: active ? "#f1f1f1" : "transparent",
              fontWeight: active ? 600 : 400,
              fontSize: "0.9rem",
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
