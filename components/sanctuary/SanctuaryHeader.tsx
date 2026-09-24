"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { AuthenticatedUser } from "@/lib/auth/types";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";
import { KeyboardManager } from "./KeyboardManager";
import { MemoryComposerModal } from "@/components/admin/MemoryComposerModal";

interface SanctuaryHeaderProps {
  user: AuthenticatedUser;
}

const NAV_ITEMS = [
  { href: "/", label: "Overview", fullLabel: "Upper Archive" },
  { href: "/timeline", label: "Timeline", fullLabel: "The Chronicle" },
  { href: "/letters", label: "Letters", fullLabel: "The Correspondence" },
  { href: "/archive", label: "Archive", fullLabel: "The Vault" },
  { href: "/horizon", label: "Horizon", fullLabel: "The Horizon" },
];

export function SanctuaryHeader({ user }: SanctuaryHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch {
      // Proceed with redirection regardless
    } finally {
      router.push("/auth");
      router.refresh();
    }
  }

  return (
    <>
      <KeyboardManager
        isHelpOpen={isHelpOpen}
        onToggleHelp={() => setIsHelpOpen((prev) => !prev)}
        onCloseHelp={() => setIsHelpOpen(false)}
      />

      <KeyboardShortcutsModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {user.role === "admin" && (
        <MemoryComposerModal
          isOpen={isComposerOpen}
          onClose={() => setIsComposerOpen(false)}
        />
      )}

      <header
        role="banner"
        className="sticky top-0 z-40 w-full border-b border-background-border/80 bg-background-void/90 backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          {/* Brand Mark */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="group flex flex-col focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1 -m-1"
              aria-label="Aethelgard Sanctuary Home"
            >
              <span className="font-serif text-xl font-semibold tracking-wider text-white group-hover:text-primary-light transition-colors">
                Aethelgard
              </span>
              <span className="text-[10px] tracking-widest text-gray-500 uppercase">
                The Archive of Unwritten Things
              </span>
            </Link>

            {/* Role Badge */}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium tracking-wide uppercase ${
                user.role === "admin"
                  ? "bg-purple-950/60 text-purple-300 border border-purple-800/50"
                  : "bg-amber-950/50 text-primary-light border border-amber-800/40"
              }`}
            >
              {user.role}
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav
            aria-label="Sanctuary Navigation"
            className="hidden md:flex items-center gap-1"
          >
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-colors focus-visible:ring-2 focus-visible:ring-primary ${
                    isActive
                      ? "bg-background-elevated text-primary-light font-semibold shadow-inner border border-background-border"
                      : "text-gray-400 hover:text-gray-200 hover:bg-background-surface"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions & Utilities */}
          <div className="flex items-center gap-2">
            {/* Admin Inscribe Button */}
            {user.role === "admin" && (
              <button
                type="button"
                onClick={() => setIsComposerOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/40 text-primary-light hover:bg-primary hover:text-background-void text-xs font-semibold tracking-wide transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Inscribe new artifact into sanctuary"
              >
                <span className="text-sm leading-none font-bold">+</span>
                <span>Inscribe</span>
              </button>
            )}

            {/* Shortcuts Help Button */}
            <button
              type="button"
              onClick={() => setIsHelpOpen(true)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:bg-background-surface hover:text-white border border-background-border/50 text-xs font-mono transition-colors focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="View keyboard shortcuts guide (?)"
              title="Keyboard shortcuts (?)"
            >
              ?
            </button>

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-lg border border-background-border text-xs font-medium text-gray-400 hover:text-white hover:bg-background-surface transition-colors focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
              aria-label="Sign out of sanctuary"
            >
              {isLoggingOut ? "Departing..." : "Depart"}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:bg-background-surface hover:text-white focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open sanctuary menu"}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <nav
            id="mobile-navigation"
            aria-label="Mobile Sanctuary Navigation"
            className="md:hidden border-t border-background-border bg-background-sanctuary px-4 py-3 space-y-1 shadow-xl"
          >
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium tracking-wide transition-colors focus-visible:ring-2 focus-visible:ring-primary ${
                    isActive
                      ? "bg-background-elevated text-primary-light font-semibold border border-background-border"
                      : "text-gray-300 hover:bg-background-surface hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{item.fullLabel}</span>
                    <span className="text-xs text-gray-500">
                      {item.label}
                    </span>
                  </div>
                </Link>
              );
            })}
            {user.role === "admin" && (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsComposerOpen(true);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-primary-light bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors focus-visible:ring-2 focus-visible:ring-primary flex items-center justify-between"
              >
                <span>+ Inscribe Artifact</span>
                <span className="text-xs uppercase tracking-widest text-primary font-mono">Admin</span>
              </button>
            )}
            <div className="pt-2 border-t border-background-border/50">
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-background-surface transition-colors focus-visible:ring-2 focus-visible:ring-primary"
              >
                {isLoggingOut ? "Departing..." : "Depart Sanctuary"}
              </button>
            </div>
          </nav>
        )}
      </header>
    </>
  );
}
