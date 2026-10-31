"use client";

import { Button } from "@myrehat-task-b/ui/components/button";
import { cn } from "@myrehat-task-b/ui/lib/utils";
import {
  Building2,
  Home,
  LayoutDashboard,
  Menu,
  MessageCircle,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

const LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/listings", label: "Buy Homestay", icon: Building2 },
  { href: "/ai", label: "AI Chat", icon: MessageCircle },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4">
        <Link
          href="/"
          onClick={() => setMenuOpen(false)}
          className="flex items-center gap-2 outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <span className="grid size-7 place-items-center bg-primary font-bold text-primary-foreground text-xs tracking-tight">
            MR
          </span>
          <span className="font-semibold text-base tracking-tight">
            MyRehat
          </span>
        </Link>

        <nav
          aria-label="Main"
          className="ml-4 hidden items-center gap-1 md:flex"
        >
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);

            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground",
                  active && "bg-muted font-medium text-foreground",
                )}
              >
                <Icon className="size-4 opacity-70" aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <ModeToggle />
          <UserMenu />
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={
              menuOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      <nav
        id="mobile-nav"
        aria-label="Mobile"
        className={cn(
          "grid overflow-hidden transition-[grid-template-rows] duration-200 md:hidden",
          menuOpen ? "grid-rows-[1fr] border-t" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0">
          <ul className="flex flex-col py-2">
            {LINKS.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);

              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground",
                      active && "bg-muted font-medium text-foreground",
                    )}
                  >
                    <Icon className="size-4 opacity-70" aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </header>
  );
}
