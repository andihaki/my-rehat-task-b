"use client";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@myrehat-task-b/ui/components/button";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
  const links = [
    { to: "/", label: "Home" },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/buy-homestay", label: "Buy Homestay" },
    { to: "/ai", label: "AI Chat" },
  ] as const;
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div>
      <div className="flex flex-row items-center justify-between px-2 py-1">
        <nav className="hidden gap-4 text-lg md:flex">
          {links.map(({ to, label }) => {
            return (
              <Link
                key={to}
                href={to}
                className={pathname === to ? "underline" : ""}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X /> : <Menu />}
        </Button>

        <div className="flex items-center gap-2">
          <ModeToggle />
          <UserMenu />
        </div>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-1 px-2 py-2 md:hidden">
          {links.map(({ to, label }) => {
            return (
              <Link
                key={to}
                href={to}
                onClick={() => setMenuOpen(false)}
                className={`px-2 py-2 text-lg ${pathname === to ? "underline" : ""}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      )}

      <hr />
    </div>
  );
}
