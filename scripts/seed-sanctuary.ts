import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { users, chapters, memories, memoryAssets } from "../lib/db/schema";

/**
 * Fictional Development Seed Data for Phase 2 Sanctuary Testing.
 * Strictly fictional: no real personal memories or private information.
 */
async function seedSanctuary() {
  console.log("[SEED] Seeding fictional development sanctuary data...");

  // Look for provisioned viewer user
  const [viewer] = await db
    .select()
    .from(users)
    .where(eq(users.role, "viewer"))
    .limit(1);

  if (!viewer) {
    console.error("[SEED] No viewer user found. Run 'npm run db:seed' first.");
    process.exit(1);
  }

  const userId = viewer.id;
  const now = new Date();

  // 1. Clean existing memories and chapters for idempotent seeding
  await db.delete(chapters).where(eq(chapters.userId, userId));

  // 2. Fictional Chapters
  console.log("[SEED] Inserting fictional chapters...");
  const [chap1, chap2, chap3, chap4] = await db
    .insert(chapters)
    .values([
      {
        userId,
        title: "Chapter I: The Starlight Observatory",
        description: "Fictional expedition chronicles among the mountain telescopes.",
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId,
        title: "Chapter II: Archives of the Northern Sea",
        description: "Fictional maritime records and quiet passages along coastal winds.",
        sortOrder: 1,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId,
        title: "Chapter III: The Clockwork Garden",
        description: "Fictional mechanical botanical gardens and copper conservatory halls.",
        sortOrder: 2,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId,
        title: "Chapter IV: Beyond the Amber Spire",
        description: "Fictional horizon chronicles and unwritten expeditions.",
        sortOrder: 3,
        createdAt: now,
        updatedAt: now,
      },
    ])
    .returning();

  // 3. Fictional Memories
  console.log("[SEED] Inserting fictional memories across all categories...");
  const insertedMemories = await db
    .insert(memories)
    .values([
      // Chapter 1: Standard & Milestones
      {
        userId,
        chapterId: chap1.id,
        kind: "milestone",
        title: "First Arrival at the Starlight Observatory",
        description: "Fictional record: Entering the grand copper dome under the crisp mountain breeze.",
        bodyText: "The high stone gate groaned open on brass hinges. Outside, twilight had surrendered to deep indigo. Looking through the forty-foot refractor for the first time revealed the rings of Saturn in sharp silver relief.",
        memoryDate: "2023-04-12",
        location: { name: "Mount Horizon Observatory", lat: 45.1234, lng: -121.5678 },
        emotion: "wonder",
        sortOrder: 0,
        isFavorite: true,
        isDraft: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId,
        chapterId: chap1.id,
        kind: "letter",
        title: "Note Discovered Behind the Astrolabe",
        description: "Fictional correspondence: A sealed parchment discovered inside the gear cabinet.",
        bodyText: "Dearest traveler,\n\nIf you find this parchment, know that the third gear of the armillary sphere always sticks at the vernal equinox. Do not force it; simply warm the brass with your palm.\n\nAlways,\nThe Archivist",
        memoryDate: "2023-06-01",
        threadKey: "observatory-letters",
        emotion: "joy",
        sortOrder: 1,
        isFavorite: true,
        isDraft: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId,
        chapterId: chap1.id,
        kind: "standard",
        title: "Midnight Charting in the Lower Library",
        description: "Fictional record: Cataloging spectral lines by the green desk lamp.",
        bodyText: "The scent of cedarwood and old parchment filled the room. We spent four hours translating coordinate grids from the 1888 star atlas.",
        memoryDate: "2023-07-15",
        location: { name: "Observatory Lower Library" },
        emotion: "peace",
        sortOrder: 2,
        isFavorite: false,
        isDraft: false,
        createdAt: now,
        updatedAt: now,
      },

      // Chapter 2: Northern Sea
      {
        userId,
        chapterId: chap2.id,
        kind: "standard",
        title: "Walking the Foggy Cobblestones of Northport",
        description: "Fictional record: Morning fog drifting past fishing schooners at anchor.",
        bodyText: "The tide was receding, leaving dark kelp clinging to the granite pillars. Salt air carried the distant chime of the bell buoy three miles out at sea.",
        memoryDate: "2023-09-18",
        location: { name: "Northport Quays", lat: 54.321, lng: -4.567 },
        emotion: "peace",
        sortOrder: 0,
        isFavorite: false,
        isDraft: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId,
        chapterId: chap2.id,
        kind: "letter",
        title: "Postcard from the Granite Lighthouse",
        description: "Fictional correspondence: Stamped with the seal of the Outer Banks beacon.",
        bodyText: "Greetings from the tower.\n\nThe wind here howls like an organ pipe when the northwest gale strikes. Yesterday two gannets perched on the lantern gallery railing. Tea is steaming on the iron stove.\n\nWarm regards,\nK.",
        memoryDate: "2023-10-30",
        threadKey: "northern-sea",
        emotion: "nostalgia",
        sortOrder: 1,
        isFavorite: true,
        isDraft: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId,
        chapterId: chap2.id,
        kind: "standard",
        title: "The Midnight Lantern Crossing",
        description: "Fictional milestone: Ferry crossing across the deep fjord under October auroras.",
        bodyText: "Ribbons of pale jade light flickered between snow-capped crags. The ferry engine thrummed steadily beneath the deck planks, carving silver wakes across black glass waters.",
        memoryDate: "2023-11-05",
        emotion: "excitement",
        sortOrder: 2,
        isFavorite: true,
        isDraft: false,
        createdAt: now,
        updatedAt: now,
      },

      // Chapter 3: Clockwork Garden
      {
        userId,
        chapterId: chap3.id,
        kind: "standard",
        title: "The Singing Glass Lotus",
        description: "Fictional record: Acoustic mechanical automaton resonant in the central pool.",
        bodyText: "Each copper petal turned precisely as water trickled over the escapement wheel. The chime resonated at exactly 432 hertz through the steamy conservatory glass.",
        memoryDate: "2024-02-14",
        location: { name: "Mechanical Conservatory Hall" },
        emotion: "wonder",
        sortOrder: 0,
        isFavorite: false,
        isDraft: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId,
        chapterId: chap3.id,
        kind: "letter",
        title: "Letter Concerning the Autumn Equinox",
        description: "Fictional correspondence: Reflections penned under amber conservatory chandeliers.",
        bodyText: "My dear companion,\n\nThe autumn winds have arrived early this year. Watching the bronze maple leaves spin down between the glass panes reminded me of our promise to revisit the high orchards.\n\nAlways with affection,\nRowan",
        memoryDate: "2024-09-22",
        threadKey: "conservatory-letters",
        emotion: "longing",
        sortOrder: 1,
        isFavorite: false,
        isDraft: false,
        createdAt: now,
        updatedAt: now,
      },

      // Chapter 4: Future Promises (The Horizon)
      {
        userId,
        chapterId: chap4.id,
        kind: "future",
        title: "Promise: The Solstice Beacon Ascent",
        description: "Fictional promise: Climb the three hundred spiral steps of the high beacon.",
        bodyText: "When the longest day of summer arrives, we will meet at the base of the beacon before sunrise to watch first light ignite the western sea.",
        memoryDate: "2025-06-21",
        location: { name: "Western Solstice Beacon" },
        emotion: "gratitude",
        sortOrder: 0,
        isFavorite: true,
        isDraft: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId,
        chapterId: chap4.id,
        kind: "future",
        title: "Promise: Restoring the Ancient Star Chart",
        description: "Fictional promise: Reassemble the celestial globe of the lost archipelago.",
        bodyText: "An unwritten commitment to gather the remaining copper meridian rings and align the constellations once more in the high archive.",
        memoryDate: "2025-12-31",
        emotion: "wonder",
        sortOrder: 1,
        isFavorite: false,
        isDraft: false,
        createdAt: now,
        updatedAt: now,
      },
    ])
    .returning();

  // 4. Attach sample READY media assets to first memory for media access testing
  console.log("[SEED] Inserting sample READY media assets with variants...");
  const firstMemory = insertedMemories[0];
  await db.insert(memoryAssets).values([
    {
      memoryId: firstMemory.id,
      type: "image",
      status: "READY",
      storageKey: "dev/sample-observatory.jpg",
      filename: "sample_observatory.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 1048576,
      width: 1920,
      height: 1080,
      isPrimary: true,
      variants: {
        thumbnail: "dev/sample-observatory-thumb.jpg",
        small: "dev/sample-observatory-small.jpg",
        medium: "dev/sample-observatory-med.jpg",
        large: "dev/sample-observatory.jpg",
      },
      createdAt: now,
      updatedAt: now,
    },
  ]);

  console.log(
    `[SEED] Fictional development seed complete. Inserted ${insertedMemories.length} memories and 4 chapters.`
  );
  process.exit(0);
}

seedSanctuary().catch((err) => {
  console.error("[SEED] Seeding error:", err);
  process.exit(1);
});
