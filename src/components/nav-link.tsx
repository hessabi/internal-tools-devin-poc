"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={`text-sm ${active ? "font-medium text-slate-900 underline underline-offset-4" : "text-slate-600 hover:text-slate-900"}`}
      href={href}
    >
      {label}
    </Link>
  );
}
