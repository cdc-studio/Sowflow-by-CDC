"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/new", label: "New SOW" },
  { href: "/dashboard/projects", label: "My SOWs" },
  { href: "/dashboard/settings/billing", label: "Billing" },
  { href: "/dashboard/settings/branding", label: "Branding" },
  { href: "/help", label: "Help" },
];

// Nav hrefs nest (every route lives under /dashboard), so more than one href
// can prefix-match the current path — e.g. both "/dashboard" and
// "/dashboard/projects" match "/dashboard/projects". Only the longest (most
// specific) match should be highlighted.
function activeHref(pathname: string): string | undefined {
  return NAV_LINKS.map((link) => link.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];
}

export function DashboardNav() {
  const pathname = usePathname();
  const active = activeHref(pathname);

  return (
    <div className="flex items-center gap-6">
      <Link href="/">
        <Logo />
      </Link>
      <nav className="hidden items-center gap-5 text-sm sm:flex">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "transition-colors hover:text-foreground",
              link.href === active ? "font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
