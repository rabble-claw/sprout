// ABOUTME: Mobile bottom tab bar with Channels / Feed / Search / Profile sections.
// ABOUTME: Highlights the active tab by matching the current pathname prefix.
import type { ReactNode } from "react";
import { navigate, useRoute } from "../lib/router";

type Tab = {
  id: string;
  label: string;
  path: string;
  prefixes: string[];
  icon: () => ReactNode;
};

const TABS: Tab[] = [
  {
    id: "channels",
    label: "Channels",
    path: "/channels",
    prefixes: ["/", "/channels"],
    icon: HashIcon,
  },
  {
    id: "feed",
    label: "Feed",
    path: "/feed",
    prefixes: ["/feed"],
    icon: FeedIcon,
  },
  {
    id: "search",
    label: "Search",
    path: "/search",
    prefixes: ["/search"],
    icon: SearchIcon,
  },
  {
    id: "profile",
    label: "Profile",
    path: "/profile",
    prefixes: ["/profile"],
    icon: ProfileIcon,
  },
];

export function isActive(tab: Tab, pathname: string): boolean {
  if (tab.id === "channels" && (pathname === "/" || pathname.startsWith("/channels"))) {
    return true;
  }
  return tab.prefixes.some((prefix) => prefix !== "/" && pathname.startsWith(prefix));
}

export const _testing = { TABS };

export function BottomNav() {
  const route = useRoute();
  return (
    <nav
      className="sticky bottom-0 z-10 border-t bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/70"
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-screen-md items-stretch justify-around">
        {TABS.map((tab) => {
          const active = isActive(tab, route.pathname);
          const Icon = tab.icon;
          return (
            <li key={tab.id} className="flex-1">
              <button
                type="button"
                onClick={() => navigate(tab.path)}
                aria-current={active ? "page" : undefined}
                data-testid={`bottom-nav-${tab.id}`}
                className={
                  active
                    ? "flex w-full flex-col items-center gap-0.5 py-2 text-primary"
                    : "flex w-full flex-col items-center gap-0.5 py-2 text-muted-foreground hover:text-foreground"
                }
              >
                <Icon />
                <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function HashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  );
}

function FeedIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M4 11a9 9 0 0 1 9 9" />
      <path d="M4 4a16 16 0 0 1 16 16" />
      <circle cx="5" cy="19" r="1" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
