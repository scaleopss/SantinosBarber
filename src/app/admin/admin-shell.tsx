"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { adminNavigation } from "./admin-navigation";

export default function AdminShell({ activeHref, children }: { activeHref: string; children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin">
          <span className="admin-brand-copy"><strong>SANTINO&apos;S</strong></span>
        </Link>
        <button
          className="admin-menu-toggle"
          type="button"
          aria-label={menuOpen ? "Fechar menu administrativo" : "Abrir menu administrativo"}
          aria-expanded={menuOpen}
          aria-controls="admin-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span /><span /><span />
        </button>
        <nav id="admin-navigation" className={`admin-nav ${menuOpen ? "is-open" : ""}`} aria-label="Navegação administrativa">
          {adminNavigation.map((item) => (
            <Link key={item.href} href={item.href} className={activeHref === item.href ? "active" : ""} aria-current={activeHref === item.href ? "page" : undefined} onClick={() => setMenuOpen(false)}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      {children}
    </div>
  );
}