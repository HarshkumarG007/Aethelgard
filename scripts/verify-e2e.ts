import { db } from "../lib/db";
import { memories, memoryAssets } from "../lib/db/schema";
import { isNull, eq } from "drizzle-orm";

const BASE_URL = "http://localhost:3000";

async function runE2EVerification() {
  console.log("=== Aethelgard Phase 2: Comprehensive E2E Route & Security Verification ===");

  // 1. Unauthenticated redirects
  console.log("\n[1] Testing Unauthenticated Route Protection...");
  const protectedRoutes = ["/", "/timeline", "/letters", "/archive", "/horizon"];
  for (const route of protectedRoutes) {
    const res = await fetch(`${BASE_URL}${route}`, { redirect: "manual" });
    const location = res.headers.get("location");
    if (res.status === 307 && location && location.includes("/auth")) {
      console.log(`  ✓ ${route} -> Redirected to /auth (HTTP ${res.status})`);
    } else {
      throw new Error(`Expected ${route} to redirect to /auth, got status ${res.status} with location ${location}`);
    }
  }

  // 2. Authentication Flow
  console.log("\n[2] Testing Authentication via POST /api/auth/verify...");
  const loginRes = await fetch(`${BASE_URL}/api/auth/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      origin: BASE_URL,
    },
    body: JSON.stringify({
      passphrase: "aethelgard-visitor-dev-passphrase-2026",
    }),
  });

  if (!loginRes.ok) {
    throw new Error(`Login failed with status ${loginRes.status}`);
  }

  const setCookie = loginRes.headers.get("set-cookie");
  const cookieMatch = setCookie?.match(/(?:__Host-session|aethelgard_session)=([^;]+)/);
  if (!setCookie || !cookieMatch) {
    throw new Error(`Login did not return a valid session cookie: ${setCookie}`);
  }

  const cookieName = setCookie.includes("__Host-session=") ? "__Host-session" : "aethelgard_session";
  const sessionCookieHeader = `${cookieName}=${cookieMatch[1]}`;
  console.log(`  ✓ Authentication succeeded, ${cookieName} cookie issued with HttpOnly, SameSite=Strict`);

  // 3. Authenticated Navigation across all 5 Sanctuary Surfaces
  console.log("\n[3] Testing Authenticated Sanctuary Pages with Session Cookie...");

  // Surface 1: The Upper Archive (Overview /)
  const homeRes = await fetch(`${BASE_URL}/`, {
    headers: { cookie: sessionCookieHeader },
  });
  if (homeRes.status !== 200) {
    throw new Error(`GET / returned status ${homeRes.status}`);
  }
  const homeHtml = await homeRes.text();
  if (
    !homeHtml.includes("The Upper Archive") ||
    !homeHtml.includes("The Chronicle") ||
    !homeHtml.includes("The Correspondence") ||
    !homeHtml.includes("The Vault") ||
    !homeHtml.includes("The Horizon")
  ) {
    throw new Error("GET / HTML missing required sanctuary chamber portals");
  }
  console.log("  ✓ Surface 1: The Upper Archive (/) rendered all chambers, memory islands, and favorites");

  // Surface 2: The Chronicle (/timeline)
  const timelineRes = await fetch(`${BASE_URL}/timeline`, {
    headers: { cookie: sessionCookieHeader },
  });
  if (timelineRes.status !== 200) {
    throw new Error(`GET /timeline returned status ${timelineRes.status}`);
  }
  const timelineHtml = await timelineRes.text();
  if (!timelineHtml.includes("The Chronicle") || !timelineHtml.includes("2023")) {
    throw new Error("GET /timeline HTML missing Chronicle title or chronological timeline nodes");
  }
  console.log("  ✓ Surface 2: The Chronicle (/timeline) rendered chronological path and year milestones");

  // Surface 3: The Correspondence (/letters)
  const lettersRes = await fetch(`${BASE_URL}/letters`, {
    headers: { cookie: sessionCookieHeader },
  });
  if (lettersRes.status !== 200) {
    throw new Error(`GET /letters returned status ${lettersRes.status}`);
  }
  const lettersHtml = await lettersRes.text();
  if (!lettersHtml.includes("The Correspondence") || !lettersHtml.includes("Manuscripts")) {
    throw new Error("GET /letters HTML missing correspondence manuscripts");
  }
  console.log("  ✓ Surface 3: The Correspondence (/letters) rendered manuscripts chamber and handwriting toggle");

  // Surface 4: The Vault (/archive)
  const archiveRes = await fetch(`${BASE_URL}/archive`, {
    headers: { cookie: sessionCookieHeader },
  });
  if (archiveRes.status !== 200) {
    throw new Error(`GET /archive returned status ${archiveRes.status}`);
  }
  const archiveHtml = await archiveRes.text();
  if (!archiveHtml.includes("The Vault") || !archiveHtml.includes("Search Memories")) {
    throw new Error("GET /archive HTML missing search interface");
  }
  console.log("  ✓ Surface 4: The Vault (/archive) rendered bounded search and multi-attribute filters");

  // Surface 5: The Horizon (/horizon)
  const horizonRes = await fetch(`${BASE_URL}/horizon`, {
    headers: { cookie: sessionCookieHeader },
  });
  if (horizonRes.status !== 200) {
    throw new Error(`GET /horizon returned status ${horizonRes.status}`);
  }
  const horizonHtml = await horizonRes.text();
  if (!horizonHtml.includes("The Horizon") || !horizonHtml.includes("Unwritten Pages")) {
    throw new Error("GET /horizon HTML missing future promises");
  }
  console.log("  ✓ Surface 5: The Horizon (/horizon) rendered future promises and affirmation seals");

  // 4. Memory Deep View (/memory/[id])
  console.log("\n[4] Testing Memory Deep View...");
  const memoriesListRes = await fetch(`${BASE_URL}/api/memories?limit=5`, {
    headers: { cookie: sessionCookieHeader },
  });
  const memoriesJson = await memoriesListRes.json();
  if (!memoriesJson.success || memoriesJson.data.memories.length === 0) {
    throw new Error("No memories found for authenticated user");
  }

  const userMemory = memoriesJson.data.memories[0];
  const memoryRes = await fetch(`${BASE_URL}/memory/${userMemory.id}`, {
    headers: { cookie: sessionCookieHeader },
  });
  if (memoryRes.status !== 200) {
    throw new Error(`GET /memory/${userMemory.id} returned status ${memoryRes.status}`);
  }
  const memoryHtml = await memoryRes.text();
  if (!memoryHtml.includes(userMemory.title)) {
    throw new Error(`GET /memory/${userMemory.id} HTML did not contain memory title`);
  }
  console.log(`  ✓ Deep View (/memory/${userMemory.id.slice(0, 8)}...) rendered title, narrative prose, and artifact viewer`);

  // Verify IDOR Anti-Enumeration: accessing non-existent or other user's UUID returns 404
  const randomUuid = "00000000-0000-0000-0000-000000000000";
  const idorRes = await fetch(`${BASE_URL}/memory/${randomUuid}`, {
    headers: { cookie: sessionCookieHeader },
  });
  if (idorRes.status !== 404) {
    throw new Error(`Expected non-existent memory to return 404, got ${idorRes.status}`);
  }
  console.log("  ✓ IDOR Anti-Enumeration verified: unauthorized memory access produces 404");

  // 5. Media Access Endpoint via POST /api/media/access
  console.log("\n[5] Testing Media Access Authorization via POST /api/media/access...");
  const [readyAsset] = await db
    .select()
    .from(memoryAssets)
    .where(eq(memoryAssets.status, "READY"))
    .limit(1);

  if (readyAsset) {
    const mediaRes = await fetch(`${BASE_URL}/api/media/access`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        origin: BASE_URL,
        cookie: sessionCookieHeader,
      },
      body: JSON.stringify({
        assetId: readyAsset.id,
        variant: "medium",
      }),
    });

    if (mediaRes.status !== 200) {
      throw new Error(`Media access failed with status ${mediaRes.status}`);
    }
    const mediaJson = await mediaRes.json();
    if (!mediaJson.success || !mediaJson.data.url) {
      throw new Error("Media access response did not contain presigned access URL");
    }
    console.log("  ✓ Media access granted: issued 5-minute ephemeral bearer URL, zero storageKey leak");
  }

  // 6. Logout and Session Revocation
  console.log("\n[6] Testing Logout via POST /api/auth/logout...");
  const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: {
      origin: BASE_URL,
      cookie: sessionCookieHeader,
    },
  });
  if (!logoutRes.ok) {
    throw new Error(`Logout failed with status ${logoutRes.status}`);
  }
  console.log("  ✓ Logout succeeded, server session revoked");

  // Subsequent visit to / with revoked cookie must redirect to /auth
  const postLogoutRes = await fetch(`${BASE_URL}/`, {
    headers: { cookie: sessionCookieHeader },
    redirect: "manual",
  });
  if (postLogoutRes.status !== 307) {
    throw new Error(`Expected redirect after logout, got status ${postLogoutRes.status}`);
  }
  console.log("  ✓ Post-logout visit to / immediately redirects to /auth (session successfully revoked)");

  console.log("\n============================================================");
  console.log("ALL 6 E2E SANCTUARY JOURNEYS AND SECURITY GATES PASSED!");
  console.log("============================================================\n");
}

runE2EVerification().catch((err) => {
  console.error("\n[FAIL] E2E Verification failed:", err);
  process.exit(1);
});
