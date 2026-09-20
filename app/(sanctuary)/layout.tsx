import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_CONSTANTS } from "@/lib/auth/types";
import { validateSession } from "@/lib/auth/session";
import { SanctuaryHeader } from "@/components/sanctuary/SanctuaryHeader";

export default async function SanctuaryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_CONSTANTS.SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    redirect("/auth");
  }

  const validation = await validateSession(sessionCookie.value);
  if (!validation.valid) {
    redirect("/auth");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background-void text-gray-100">
      {/* Skip to Content accessible link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-gray-950 focus:font-semibold focus:rounded-lg focus:shadow-xl focus:ring-2 focus:ring-white focus:outline-none"
      >
        Skip to sanctuary content
      </a>

      {/* Persistent Sanctuary Navigation Header */}
      <SanctuaryHeader user={validation.user} />

      {/* Main Content Landmark */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 focus:outline-none"
      >
        {children}
      </main>

      {/* Accessible Footer Landmark */}
      <footer
        role="contentinfo"
        className="border-t border-background-border/60 bg-background-void/90 py-8 px-4 text-center text-xs text-gray-500"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            Aethelgard Sanctuary &bull; Where memories have weight, and love has geography.
          </p>
          <div className="flex items-center gap-4 text-gray-400">
            <span>2D Accessible Core</span>
            <span>&bull;</span>
            <span>Zero-Trust Persistence</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
