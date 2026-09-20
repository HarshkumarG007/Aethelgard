# AETHELGARD — MASTER BUILD SPECIFICATION v2.0

**Status:** Authoritative build specification  
**Date:** 20 September 2026  
**Audience:** Antigravity, senior engineers, designers, future maintainers  
**Product:** Aethelgard — The Archive of Unwritten Things

---

## 0. Document Control

This is a cleaned and technically corrected successor to the original Aethelgard specification.

The creative direction, UX, visual language, 3D world and interaction intent are preserved. The technical contract has been rewritten where the original implementation details were contradictory, stale, or stronger than their actual guarantees.

### Companion contracts

- `02_SECURITY_PRIVACY_CONTRACT.md`
- `03_DATA_API_MEDIA_CONTRACT.md`
- `04_ACCEPTANCE_RELEASE_GATE.md`

### Mandatory interpretation

If this master document conflicts with a companion contract, the companion contract wins for that domain.

---

# 01 — PRODUCT VISION

## Project Identity

**Working Title:** *Aethelgard* (Old English: "noble enclosure/protected sanctuary")

**Tagline:** *"Where memories have weight, and love has geography."*

## Core Purpose

Aethelgard is a private, encrypted digital sanctuary designed for exactly one visitor. It transforms the traditional "memory website" paradigm from a flat information presentation into a spatial, emotional experience where relationship milestones exist as discoverable artifacts within a living 3D environment.

The product serves a dual mandate:

1. **Emotional:** Create an experience that feels like entering a secret world built specifically for one person—a place where the architecture itself expresses care, intention, and intimacy.
2. **Technical:** Provide privacy-first defense-in-depth protection and resilient infrastructure, with explicit threat-model boundaries and testable security controls.

## Success Criteria

The project succeeds when:

- The visitor feels genuinely surprised by the depth of care evident in every detail
- Unauthorized access is resisted through the defined defense-in-depth controls and validated against the security test matrix
- The experience performs flawlessly across devices and network conditions
- The architecture can persist for decades with minimal maintenance
- The emotional arc feels complete—from mystery through discovery to quiet intimacy

---

---

# 02 — CREATIVE CONCEPT

## Concept Direction Evaluation

### Direction A: "The Celestial Observatory"

*Memories exist as stars and constellations in a personal night sky. The user navigates through space, zooming into stars to reveal moments.*

**Evaluation:**

- **Strengths:** Beautiful metaphor, infinite scalability, strong visual identity
- **Weaknesses:** Abstract to the point of coldness; space can feel lonely rather than intimate; difficult to represent temporal progression; limited tactile quality

**Verdict:** Rejected. Too impersonal despite visual beauty.

---

### Direction B: "The Memory Garden"

*A living garden where memories grow as plants, flowers, and trees. Paths represent time, seasons represent emotional chapters.*

**Evaluation:**

- **Strengths:** Warm, organic, temporal metaphor (growth/decay/seasons), tactile, universally understood
- **Weaknesses:** Risk of becoming cliché; difficult to represent non-visual memories (audio, text); garden metaphor may feel too domestic rather than magical

**Verdict:** Promising but risks sentimentality over sophistication.

---

### Direction C: "The Archive of Unwritten Things" *(Selected)*

*A mysterious, liminal space between a library, a observatory, and a private study. Memories exist as physical artifacts—floating manuscripts, crystallized moments, whispered recordings—suspended in a timeless twilight environment. The space feels like a secret room that shouldn't exist, accessed through a threshold that requires the visitor's presence to activate.*

**Evaluation:**

- **Strengths:**
  - Balances intimacy with mystery
  - Accommodates all media types naturally (manuscripts for text, crystals for photos, orbs for audio)
  - Temporal progression can be represented as "depth" or "chambers"
  - Feels handcrafted and personal
  - Strong emotional arc potential (threshold → discovery → sanctuary)
  - Sophisticated without being cold
  - Scales from minimal to extensive memory collections
- **Weaknesses:** Requires careful execution to avoid feeling like a generic "magical library"

**Mitigation:** The specificity of the artifact system, lighting design, and interaction model will differentiate this from generic magical environments.

**Verdict:** Selected. Best balance of emotional resonance, functional accommodation, and unique identity.

---

## Final Concept: "Aethelgard — The Archive of Unwritten Things"

### One-Sentence Concept

A private, encrypted 3D sanctuary where relationship memories exist as discoverable artifacts suspended in a timeless twilight environment, accessible only through authenticated presence.

### Emotional Objective

To make the visitor feel they have discovered a secret chamber that was waiting specifically for them—a space where someone has carefully preserved moments that matter, with the care evident in every detail.

### Visual Metaphor

**"Crystallized Time"**

In Aethelgard, memories don't just sit in albums—they exist as luminous artifacts suspended in a twilight space:

- **Written memories** appear as floating, illuminated manuscripts with handwriting that glows softly
- **Photographs** exist as crystalline prisms that refract light and reveal images within
- **Audio memories** manifest as floating resonant orbs that pulse with sound waves
- **Milestones** become architectural elements—archways, platforms, or floating islands
- **The passage of time** is represented as depth and elevation—older memories exist in "deeper" chambers, recent ones in the "upper" atmosphere
- **Emotional intensity** affects the luminosity and scale of artifacts

### Story Structure (Experience Arc)

**ACT I — THE VEIL (Authentication)**
A minimal, mysterious threshold. The visitor approaches what appears to be a simple, elegant surface. No indication of what lies beyond. Authentication is the ritual of entry.

**ACT II — THE THRESHOLD (Entry Transition)**
Upon authentication, the environment reveals itself gradually. The transition should feel like stepping through a membrane into another world. The visitor realizes they are somewhere that was hidden.

**ACT III — THE ATMOSPHERE (Orientation)**
The visitor finds themselves in the "Upper Archive"—a twilight space with floating artifacts visible at a distance. Ambient sound establishes the emotional tone. The visitor understands they can explore.

**ACT IV — THE DISCOVERY (Exploration)**
As the visitor moves through the space, they encounter memory artifacts. Each artifact responds to attention—glowing brighter, revealing previews, inviting interaction. The environment respects the visitor's pace.

**ACT V — THE INTIMACY (Deep Memory)**
When an artifact is selected, the environment focuses—other elements recede, and the memory reveals itself fully. This is the moment of emotional connection. Photographs fill the view, letters unfold, audio plays.

**ACT VI — THE CHRONICLE (Timeline)**
A dedicated space where time is the organizing principle. Memories arranged chronologically, allowing the visitor to traverse the relationship's history as a journey.

**ACT VII — THE CORRESPONDENCE (Letters)**
A private chamber for written communication—messages, letters, notes. The most intimate space, with its own atmosphere and pacing.

**ACT VIII — THE VAULT (Archive)**
A practical but beautiful space for browsing, searching, and accessing any memory directly. Useful when the visitor seeks something specific.

**ACT IX — THE HORIZON (Future)**
The experience concludes not in the past, but facing forward. Unwritten promises, future dreams, blank pages waiting to be filled. The emotional resolution is hope, not nostalgia.

### Core Interaction Philosophy

**"Attention as the Interface"**

In Aethelgard, the primary interaction is not clicking buttons but directing attention:

- Looking at an artifact causes it to respond (glow, orient toward visitor, reveal hints)
- Moving toward an artifact signals intent to engage
- Pausing allows the environment to breathe—no constant motion required
- Touch/click is the confirmation of intent, not the beginning of interaction

This creates a feeling of the environment being *aware* of the visitor's presence and interest.

### Why This Metaphor Works

1. **Privacy is inherent to the concept:** An archive of unwritten things implies secrecy, personal significance, and protection
2. **Artifacts have weight:** Physical metaphors make memories feel valuable rather than disposable
3. **Time as space:** The three-dimensional environment naturally accommodates temporal progression
4. **Emotional range:** The same space can accommodate joy, reflection, longing, and hope through lighting and audio changes
5. **Scalability:** From ten memories to ten thousand, the metaphor holds—more artifacts simply populate more of the space
6. **Personalization:** The specific artifacts, handwriting, and content make this space unmistakably unique to one relationship

### What Makes It Unique

Unlike typical "romantic websites" that rely on:

- Generic heart motifs and pink gradients
- Photo carousels with transition effects
- Timeline graphics with stock icons

Aethelgard offers:

- A genuine spatial experience where navigation is exploration
- An authentication system that feels like a ritual rather than a barrier
- Media presentation that treats each memory as a precious object
- A security architecture that matches the emotional stakes
- An ending that looks forward rather than backward

### Emotional Journey Map

| **PhaseVisitor Should FeelDesign Response** |                           |                                         |
| ------------------------------------------- | ------------------------- | --------------------------------------- |
| **Approach**                                | Curiosity, slight mystery | Minimal surface, no indication of depth |
| **Authentication**                          | Importance, trust         | Elegant, secure, no friction            |
| **Entry**                                   | Wonder, surprise          | Gradual reveal of the environment       |
| **Exploration**                             | Agency, discovery         | Responsive artifacts, no forced path    |
| **Deep engagement**                         | Intimacy, being known     | Full-screen memory presentation         |
| **Timeline traversal**                      | Nostalgia, continuity     | Chronological flow, temporal context    |
| **Letters**                                 | Vulnerability, closeness  | Private chamber, slower pacing          |
| **Archive**                                 | Empowerment, ease         | Efficient access, search, browse        |
| **Future/Ending**                           | Hope, continuation        | Forward-facing, unresolved beauty       |

---

---

# 03 — EXPERIENCE STORYBOARD

## Detailed Scene-by-Scene Specification

### Scene 1: The Threshold (Authentication)

**Visual Design:**

- Deep charcoal background (#0a0a0f)
- Single, elegant input field centered
- Soft, pulsing glow around the field
- No other visible elements
- Subtle particle drift (almost subliminal)

**Interaction:**

- Visitor enters passphrase/key
- No visible "submit" button—enter key or automatic submission on complete input
- Loading state: field transforms into a "breathing" light
- Success: The screen appears to dissolve or peel away

**Audio:**

- Near-silent ambience
- Subtle tone on keystroke (optional, respectful)
- Success: A deep, resonant chord that seems to come from below

**Technical Notes:**

- Client-side rate limiting (exponential backoff)
- Secure credential transmission
- No indication if failure is wrong password or system error (prevents enumeration)

---

### Scene 2: The Arrival (Entry Transition)

**Visual Design:**

- Fade from black through deep indigo
- Gradual reveal of the environment from darkness
- Camera appears to move forward through a "membrane" or threshold
- Particles coalesce into floating artifacts
- Lighting gradually increases from single source to ambient environment

**Duration:** 3-5 seconds (respects the moment)

**Camera Movement:**

- Slow, deliberate push-in
- Slight rotation to establish spatial depth
- Ends at the "Observation Point"—a neutral position in the Upper Archive

**Audio:**

- Ambient soundscape fades in—low drones, distant resonances
- No sudden sounds
- Volume normalization respects user's system settings

---

### Scene 3: The Upper Archive (Main Environment)

**Visual Design:**

- Twilight color palette: deep indigos, soft violets, warm amber accents
- Floating artifacts at various distances
- "Memory Islands"—larger platforms representing chapters/periods
- Subtle fog/haze for depth perception
- Particle systems representing atmosphere (dust motes, light traces)

**Spatial Organization:**

- Center: Current/most recent memories
- Outward/Upward: Older memories
- Below: Future/promises
- Periphery: Related memories, tangents

**Artifacts:**

- **Photographs:** Crystalline prisms, 20-40cm in apparent size, refract light
- **Letters:** Floating manuscripts, gently undulating, handwriting visible at distance
- **Audio:** Resonant orbs, 15-25cm, pulse with waveform visualization
- **Milestones:** Architectural elements—archways, pedestals, glowing pillars

**Interaction Model:**

- **Gaze/Proximity:** Artifacts glow brighter, orient slightly toward visitor
- **Approach:** Artifact details become clearer, ambient audio shifts
- **Select:** Camera moves to focus position, environment dims, artifact activates
- **Return:** Smooth camera pull-back, environment restores

**Navigation:**

- Free camera control (desktop): Mouse drag to look, scroll to move forward/back, right-click to pan
- Touch (mobile): Single finger look, pinch zoom, double-tap to focus on nearest artifact
- Keyboard: Arrow keys/WASD for movement, Space to select focused artifact, Escape to return

---

### Scene 4: Memory Focus (Deep View)

**Visual Design:**

- Camera positioned optimally for the memory type
- Background blurs significantly (bokeh effect)
- Memory artifact transforms to full presentation:
  - Photos: Full-screen with subtle frame, metadata appears as floating text
  - Letters: Manuscript unfolds, text becomes readable, handwriting preserved
  - Audio: Orb expands to show waveform, play controls appear
- Related memories shown as dimmed artifacts at periphery (suggestions)

**UI Elements:**

- Back button (subtle, bottom-left)
- Memory title (top-center, fades in)
- Date/location (below title)
- Story text (if applicable, bottom overlay)
- Navigation to previous/next memory (swipe or arrow keys)

**Transitions:**

- Enter: 0.8s ease-out, artifact expands and rotates to optimal viewing angle
- Exit: 0.5s ease-in, reverse transformation

**Audio:**

- Ambient audio dims 50%
- Memory-specific audio (if applicable) ready to play
- Interaction sounds (soft, non-intrusive)

---

### Scene 5: The Chronicle (Timeline View)

**Visual Design:**

- Transition from 3D space to a "tunnel of time" metaphor
- Memories arranged chronologically along a glowing path
- Visitor moves through time rather than space
- Visual indicators for years/periods
- Density of memories affects the "texture" of the path

**Interaction:**

- Scroll/momentum-based movement through timeline
- Memories appear as portals/windows along the path
- Selecting a memory transitions to Scene 4 (Deep View)
- "You are here" indicator for present moment
- Future section appears as unlit path extending forward

**Alternative View:**

- 2D timeline mode for accessibility and mobile efficiency
- Vertical scroll on mobile
- Horizontal on desktop
- Toggle between 3D and 2D views

---

### Scene 6: The Correspondence (Letters Chamber)

**Visual Design:**

- Separate, smaller environment
- Warmer lighting (candlelight/amber tones)
- Floating manuscripts arranged by conversation/thread
- Seating metaphor—camera at "reading height"
- Background: Shelves or floating stacks of sealed letters

**Interaction:**

- Manuscripts open on selection
- Handwriting animation (text appears as if being written)
- Page-turn gestures for long letters
- "Seal" metaphor for unread letters
- Timestamp and context for each letter

**Privacy Note:**

- This is the most intimate space
- Additional confirmation before entering (subtle—"Enter the private chamber?")
- No screenshots reminder (educational, not technical prevention)

---

### Scene 7: The Vault (Archive/Browse)

**Visual Design:**

- Practical but elegant grid layout
- Search interface (minimal, elegant)
- Filter options (date, type, location, tags)
- Sort options (chronological, alphabetical, recently added)
- Thumbnail view with hover/focus preview

**Technical:**

- Pagination or infinite scroll
- Lazy loading of thumbnails
- Quick-access to full memory
- Keyboard shortcuts for power users

---

### Scene 8: The Horizon (Future/Promises)

**Visual Design:**

- Transition to open space, lighter color palette
- Dawn-like lighting (soft golds, pale blues)
- Empty frames waiting for future photos
- Blank pages ready for future letters
- "Promises" as glowing commitments suspended in space
- Map of places to visit (if applicable)

**Interaction:**

- Visitor can "seal" promises (interactive commitment)
- Future dates appear as approaching lights
- Blank pages can be "written" on (if two-way communication desired)
- The experience ends here, facing the open horizon

**Final Moment:**

- No "end" or "close" button
- Visitor simply stops engaging
- After inactivity, gentle fade to the threshold state
- Ready for next visit

---

---

# 04 — UX ARCHITECTURE

## Information Architecture

### Content Hierarchy

```
Aethelgard (Root)
├── Authentication Layer
│   └── Passphrase Entry
│
├── Sanctuary (Authenticated)
│   ├── Upper Archive (3D Environment)
│   │   ├── Memory Artifacts (Photographs)
│   │   ├── Memory Artifacts (Letters)
│   │   ├── Memory Artifacts (Audio)
│   │   ├── Memory Artifacts (Milestones)
│   │   └── Chapter Islands
│   │
│   ├── Deep Memory View (Fullscreen)
│   │   ├── Photo Viewer
│   │   ├── Letter Reader
│   │   ├── Audio Player
│   │   └── Milestone Presentation
│   │
│   ├── The Chronicle (Timeline)
│   │   ├── Chronological Journey
│   │   ├── Year Markers
│   │   └── Chapter Transitions
│   │
│   ├── The Correspondence (Letters)
│   │   ├── Letter Threads
│   │   ├── Unread Indicators
│   │   └── Writing Interface (optional)
│   │
│   ├── The Vault (Archive)
│   │   ├── Grid View
│   │   ├── Search
│   │   ├── Filters
│   │   └── Sort
│   │
│   └── The Horizon (Future)
│       ├── Promises
│       ├── Future Dates
│       └── Blank Pages
│
└── Admin Interface (Separate)
    ├── Authentication (Elevated)
    ├── Memory Management
    ├── Media Upload
    ├── Content Editor
    └── Settings
```

### Navigation Patterns

**Primary Navigation (Spatial):**

- 3D environment IS the navigation
- No traditional "menu" in the main experience
- HUD elements appear only on interaction
- Escape key returns to previous level

**Secondary Navigation (Temporal):**

- Timeline mode for chronological traversal
- Accessible via keyboard shortcut (T) or gesture

**Tertiary Navigation (Functional):**

- Archive mode for direct access
- Accessible via keyboard shortcut (A) or gesture

**Emergency/Accessibility Navigation:**

- 2D sitemap/overview mode
- Screen reader compatible list view
- Always available via keyboard shortcut (O for overview)

### User Flows

**First-Time Visitor:**

1. Arrive at threshold
2. Enter passphrase (provided through secure side channel)
3. Experience entry transition
4. Brief, subtle onboarding (3-5 tooltips max, dismissible)
5. Free exploration

**Returning Visitor:**

1. Arrive at threshold
2. Enter passphrase
3. Option: "Resume where you left off" or "Start from beginning"
4. Immediate entry to environment

**Memory Discovery Flow:**

1. Navigate 3D space (or use timeline)
2. Artifact attracts attention (glow, orientation)
3. Visitor approaches/selects artifact
4. Transition to Deep View
5. Experience memory
6. Return to environment or continue to related memory

**Search Flow:**

1. Activate Archive (A key or gesture)
2. Enter search term or apply filters
3. Results appear as artifact collection
4. Select artifact to enter Deep View

---

## Responsive Strategy

### Breakpoint Philosophy

Rather than "shrinking desktop," design three distinct experiences:

**Desktop Immersive (1200px+)**

- Full 3D environment
- Free camera control
- All visual effects enabled
- Audio spatialization
- Keyboard shortcuts active

**Tablet Hybrid (768px - 1199px)**

- Simplified 3D environment (reduced particle count)
- Touch-optimized camera controls
- Split view: 3D exploration + 2D detail panel
- Gestures: swipe, pinch, tap
- Reduced shader complexity

**Mobile Focused (< 768px)**

- **Primary:** Elegant 2D presentation with 3D entry/transition only
- **Secondary:** Simplified 3D mode for high-end devices (toggle)
- Touch-optimized list/grid views
- Swipe navigation between memories
- Audio player with native controls
- Photo viewer with pinch zoom
- Reduced motion by default (respects system preference)

### Progressive Enhancement

```
Base Experience (All Devices):
├── Authentication
├── Memory content (text)
├── Timeline view (2D)
├── Archive view (2D)
└── Basic styling

Enhanced (Mid-range+):
├── 3D transitions
├── Particle effects (subtle)
├── Ambient audio
└── Smooth animations

Full (Desktop/High-end):
├── Complete 3D environment
├── Post-processing effects
├── Spatial audio
├── Advanced shaders
└── Physics interactions
```

### Accessibility-First Design

**Keyboard Navigation:**

- Tab order follows visual/spatial logic
- Enter to select focused artifact
- Escape to go back
- Arrow keys for movement
- Shortcut keys for major views (T=Timeline, A=Archive, L=Letters, H=Horizon)

**Screen Reader Support:**

- Semantic HTML underlying the 3D canvas
- ARIA labels for all interactive elements
- Alternative 2D list view of all memories
- Audio descriptions for photographs (if provided)
- Letter content readable as text

**Reduced Motion:**

- Respect `prefers-reduced-motion`
- Instant transitions instead of animations
- Static images instead of video backgrounds
- Option to disable all camera movement

**High Contrast:**

- High contrast mode available
- Ensures text readability against all backgrounds
- Focus indicators clearly visible

---

---

# 05 — VISUAL DESIGN SYSTEM

## Color System

### Semantic Color Tokens

**json**

```json
{
  "colors": {
    "background": {
      "primary": "#0a0a0f",
      "secondary": "#12121a",
      "tertiary": "#1a1a24"
    },
    "surface": {
      "base": "#151520",
      "elevated": "#1e1e2e",
      "overlay": "rgba(30, 30, 46, 0.85)"
    },
    "primary": {
      "50": "#f0e6ff",
      "100": "#d9b3ff",
      "200": "#c280ff",
      "300": "#a64dff",
      "400": "#8c1aff",
      "500": "#7300e6",
      "600": "#5c00b3",
      "700": "#450080",
      "800": "#2e0054",
      "900": "#17002b"
    },
    "secondary": {
      "50": "#fff4e6",
      "100": "#ffe4c2",
      "200": "#ffd399",
      "300": "#ffc26e",
      "400": "#ffb14a",
      "500": "#ffa02e",
      "600": "#e68a1f",
      "700": "#b36d18",
      "800": "#805012",
      "900": "#4d2f0a"
    },
    "accent": {
      "warm": "#ff6b6b",
      "cool": "#4ecdc4",
      "gold": "#ffd93d",
      "rose": "#ff8fa3"
    },
    "text": {
      "primary": "#f5f5f7",
      "secondary": "#a0a0b0",
      "muted": "#6a6a7a",
      "inverse": "#0a0a0f"
    },
    "border": {
      "subtle": "rgba(255, 255, 255, 0.08)",
      "default": "rgba(255, 255, 255, 0.15)",
      "strong": "rgba(255, 255, 255, 0.25)"
    },
    "state": {
      "success": "#4ade80",
      "warning": "#fbbf24",
      "danger": "#f87171",
      "info": "#60a5fa"
    },
    "memory": {
      "photograph": "#7dd3fc",
      "letter": "#fcd34d",
      "audio": "#f472b6",
      "milestone": "#a78bfa",
      "video": "#fb7185"
    }
  }
}
```

### Usage Patterns

- **Background:** Deep, near-black with subtle blue undertone. Creates infinite depth feel.
- **Surfaces:** Slightly elevated tones for cards, panels, artifact bases
- **Primary (Violet):** Main brand color, represents the magical/sanctuary nature
- **Secondary (Amber):** Warmth, intimacy, candlelight moments
- **Accents:** Emotional indicators—warm for love/joy, cool for reflection/calm, gold for special moments, rose for intimacy
- **Memory Type Colors:** Each memory type has signature glow color for instant recognition

---

## Typography System

### Font Families

**json**

```json
{
  "typography": {
    "families": {
      "display": {
        "name": "Canela",
        "fallback": ["Playfair Display", "Georgia", "serif"],
        "weights": [300, 400],
        "usage": "Main titles, chapter headers, emotional moments"
      },
      "heading": {
        "name": "Söhne",
        "fallback": ["Inter", "system-ui", "sans-serif"],
        "weights": [400, 500, 600],
        "usage": "Section headings, memory titles"
      },
      "body": {
        "name": "Söhne",
        "fallback": ["Inter", "system-ui", "sans-serif"],
        "weights": [400, 500],
        "usage": "Body text, descriptions, UI elements"
      },
      "handwriting": {
        "name": "Signifier",
        "fallback": ["Caveat", "cursive"],
        "weights": [400],
        "usage": "Letters, personal notes, intimate text"
      },
      "mono": {
        "name": "SF Mono",
        "fallback": ["Monaco", "Consolas", "monospace"],
        "weights": [400, 500],
        "usage": "Dates, metadata, technical elements"
      }
    }
  }
}
```

### Type Scale

**json**

```json
{
  "typography": {
    "scale": {
      "hero": {
        "size": "clamp(3rem, 8vw, 6rem)",
        "weight": 300,
        "lineHeight": 1.1,
        "letterSpacing": "-0.02em",
        "font": "display"
      },
      "h1": {
        "size": "clamp(2rem, 5vw, 3.5rem)",
        "weight": 400,
        "lineHeight": 1.2,
        "letterSpacing": "-0.01em",
        "font": "display"
      },
      "h2": {
        "size": "clamp(1.5rem, 3vw, 2.5rem)",
        "weight": 500,
        "lineHeight": 1.3,
        "letterSpacing": "0",
        "font": "heading"
      },
      "h3": {
        "size": "clamp(1.25rem, 2vw, 1.75rem)",
        "weight": 500,
        "lineHeight": 1.4,
        "letterSpacing": "0",
        "font": "heading"
      },
      "body": {
        "size": "clamp(1rem, 1.5vw, 1.125rem)",
        "weight": 400,
        "lineHeight": 1.7,
        "letterSpacing": "0.01em",
        "font": "body"
      },
      "bodySmall": {
        "size": "clamp(0.875rem, 1.2vw, 1rem)",
        "weight": 400,
        "lineHeight": 1.6,
        "letterSpacing": "0.01em",
        "font": "body"
      },
      "caption": {
        "size": "0.75rem",
        "weight": 400,
        "lineHeight": 1.5,
        "letterSpacing": "0.02em",
        "font": "body",
        "textTransform": "uppercase"
      },
      "handwriting": {
        "size": "clamp(1.125rem, 2vw, 1.5rem)",
        "weight": 400,
        "lineHeight": 1.8,
        "letterSpacing": "0",
        "font": "handwriting"
      }
    }
  }
}
```

---

## Spacing System

**json**

```json
{
  "spacing": {
    "scale": {
      "0": "0",
      "1": "0.25rem",
      "2": "0.5rem",
      "3": "0.75rem",
      "4": "1rem",
      "5": "1.25rem",
      "6": "1.5rem",
      "8": "2rem",
      "10": "2.5rem",
      "12": "3rem",
      "16": "4rem",
      "20": "5rem",
      "24": "6rem",
      "32": "8rem",
      "40": "10rem",
      "48": "12rem"
    },
    "sectionPadding": {
      "mobile": "1.5rem",
      "tablet": "2rem",
      "desktop": "3rem",
      "wide": "4rem"
    }
  }
}
```

---

## Border Radius System

**json**

```json
{
  "radius": {
    "none": "0",
    "sm": "0.25rem",
    "md": "0.5rem",
    "lg": "0.75rem",
    "xl": "1rem",
    "2xl": "1.5rem",
    "full": "9999px",
    "artifact": "0.25rem",
    "panel": "1rem",
    "button": "0.5rem"
  }
}
```

---

## Shadow System

**json**

```json
{
  "shadows": {
    "subtle": "0 1px 2px rgba(0, 0, 0, 0.3)",
    "elevated": "0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.2)",
    "cinematic": "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)",
    "glow": {
      "subtle": "0 0 20px rgba(139, 92, 246, 0.3)",
      "medium": "0 0 40px rgba(139, 92, 246, 0.4)",
      "strong": "0 0 60px rgba(139, 92, 246, 0.5)"
    },
    "artifact": {
      "photograph": "0 0 30px rgba(125, 211, 252, 0.4)",
      "letter": "0 0 30px rgba(252, 211, 77, 0.4)",
      "audio": "0 0 30px rgba(244, 114, 182, 0.4)",
      "milestone": "0 0 40px rgba(167, 139, 250, 0.5)"
    }
  }
}
```

---

## Motion System

### Duration Tokens

**json**

```json
{
  "motion": {
    "duration": {
      "instant": "0ms",
      "fast": "150ms",
      "normal": "300ms",
      "slow": "500ms",
      "cinematic": "800ms",
      "ambient": "3000ms"
    }
  }
}
```

### Easing Tokens

**json**

```json
{
  "motion": {
    "easing": {
      "linear": "linear",
      "ease": "ease",
      "easeIn": "cubic-bezier(0.4, 0, 1, 1)",
      "easeOut": "cubic-bezier(0, 0, 0.2, 1)",
      "easeInOut": "cubic-bezier(0.4, 0, 0.2, 1)",
      "spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      "cinematic": "cubic-bezier(0.25, 0.1, 0.25, 1)",
      "dramatic": "cubic-bezier(0.87, 0, 0.13, 1)"
    }
  }
}
```

### Animation Patterns

**json**

```json
{
  "motion": {
    "patterns": {
      "fadeIn": {
        "duration": "500ms",
        "easing": "easeOut"
      },
      "slideUp": {
        "duration": "500ms",
        "easing": "cinematic"
      },
      "scaleIn": {
        "duration": "300ms",
        "easing": "spring"
      },
      "artifactGlow": {
        "duration": "2000ms",
        "easing": "easeInOut",
        "iteration": "infinite"
      },
      "cameraMove": {
        "duration": "800ms",
        "easing": "dramatic"
      },
      "pageTransition": {
        "duration": "600ms",
        "easing": "cinematic"
      }
    }
  }
}
```

### Reduced Motion Support

**css**

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

---

# 06 — 3D WORLD SPECIFICATION

## Three.js Architecture

### Scene Graph Structure

```
Scene (Root)
├── Environment
│   ├── Fog
│   ├── Ambient Light
│   ├── Hemisphere Light
│   └── Background (Gradient/Skybox)
│
├── Camera Rig
│   ├── Main Camera
│   ├── Camera Target
│   └── Camera Constraints
│
├── Lighting System
│   ├── Moon/Primary Light (Directional)
│   ├── Fill Light (Hemisphere)
│   ├── Accent Lights (Point lights near artifacts)
│   └── Memory Lights (Dynamic, attached to artifacts)
│
├── Particle Systems
│   ├── Ambient Dust
│   ├── Memory Sparkles
│   └── Transition Effects
│
├── Memory Layer (Upper Archive)
│   ├── Chapter Island 1
│   │   ├── Platform Geometry
│   │   ├── Artifacts Group
│   │   │   ├── Photograph Artifact 1
│   │   │   ├── Letter Artifact 1
│   │   │   └── Audio Artifact 1
│   │   └── Connection Lines
│   ├── Chapter Island 2
│   └── ...
│
├── Deep Memory View (Dynamic)
│   └── Focused Artifact (Scaled up, centered)
│
└── Post-Processing Stack
    ├── Render Target
    ├── Bloom (subtle)
    ├── Depth of Field (dynamic)
    ├── Tone Mapping
    └── Output
```

### Renderer Configuration

**javascript**

```javascript
const rendererConfig = {
  antialias: true,
  alpha: true,
  powerPreference: "high-performance",
  stencil: false,
  depth: true,
  
  // Output encoding
  outputColorSpace: THREE.SRGBColorSpace,
  
  // Tone mapping
  toneMapping: THREE.ACESFilmicToneMapping,
  toneMappingExposure: 1.2,
  
  // Shadows
  shadowMap: {
    enabled: true,
    type: THREE.PCFSoftShadowMap
  },
  
  // Pixel ratio (performance)
  pixelRatio: Math.min(window.devicePixelRatio, 2),
  
  // Clear color
  clearColor: 0x0a0a0f
};
```

### Camera System

**javascript**

```javascript
const cameraConfig = {
  // Initial position
  position: { x: 0, y: 1.6, z: 5 },
  
  // Field of view
  fov: 60,
  
  // Near/far planes
  near: 0.1,
  far: 100,
  
  // Movement constraints
  constraints: {
    minDistance: 2,
    maxDistance: 20,
    minPolarAngle: 0,
    maxPolarAngle: Math.PI / 2 - 0.1,
    minAzimuthAngle: -Infinity,
    maxAzimuthAngle: Infinity
  },
  
  // Smoothing
  damping: 0.05,
  
  // Focus mode (when viewing memory)
  focus: {
    distance: 3,
    offset: { x: 0, y: 0, z: 0 },
    transitionDuration: 0.8
  }
};
```

### Lighting Design

**Primary Light (Moonlight):**

- Type: Directional
- Color: #a5b4fc (soft blue-white)
- Intensity: 0.8
- Position: (-5, 10, -5)
- Casts shadows: true
- Shadow map size: 2048x2048

**Fill Light:**

- Type: Hemisphere
- Sky color: #c7d2fe
- Ground color: #1e1b4b
- Intensity: 0.4

**Ambient Light:**

- Type: Ambient
- Color: #312e81
- Intensity: 0.2

**Dynamic Memory Lights:**

- Type: Point lights
- Attached to active/focused artifacts
- Color: matches memory type
- Intensity: 0.5-1.5 (varies by proximity)
- Distance: 5
- Decay: 2

---

## Material System

### Artifact Materials

**Photograph Crystal:**

**javascript**

```javascript
{
  type: "MeshPhysicalMaterial",
  color: 0x7dd3fc,
  metalness: 0.1,
  roughness: 0.1,
  transmission: 0.6,
  thickness: 1.0,
  ior: 1.5,
  clearcoat: 1.0,
  clearcoatRoughness: 0.1,
  emissive: 0x7dd3fc,
  emissiveIntensity: 0.1
}
```

**Letter Parchment:**

**javascript**

```javascript
{
  type: "MeshStandardMaterial",
  color: 0xfef3c7,
  roughness: 0.8,
  metalness: 0.0,
  emissive: 0xfcd34d,
  emissiveIntensity: 0.05,
  side: THREE.DoubleSide
}
```

**Audio Orb:**

**javascript**

```javascript
{
  type: "MeshPhysicalMaterial",
  color: 0xf472b6,
  metalness: 0.3,
  roughness: 0.2,
  transmission: 0.4,
  emissive: 0xf472b6,
  emissiveIntensity: 0.2
}
```

### Environment Materials

**Platform Surface:**

**javascript**

```javascript
{
  type: "MeshStandardMaterial",
  color: 0x1e1e2e,
  roughness: 0.9,
  metalness: 0.1
}
```

---

## Post-Processing Stack

**javascript**

```javascript
const postProcessing = {
  // Subtle bloom for glow effects
  bloom: {
    threshold: 0.8,
    strength: 0.4,
    radius: 0.5
  },
  
  // Dynamic depth of field
  depthOfField: {
    focus: 5.0,
    aperture: 0.005,
    maxBlur: 0.01,
    enabled: true
  },
  
  // Tone mapping
  toneMapping: {
    type: "ACESFilmic",
    exposure: 1.0
  },
  
  // Color grading
  colorCorrection: {
    brightness: 0.0,
    contrast: 0.1,
    saturation: 0.1
  }
};
```

---

## Particle Systems

### Ambient Dust

**javascript**

```javascript
{
  count: 500,
  size: 0.02,
  color: 0xffffff,
  opacity: 0.3,
  blending: THREE.AdditiveBlending,
  movement: {
    speed: 0.001,
    drift: 0.0005
  }
}
```

### Memory Sparkles

**javascript**

```javascript
{
  count: 50,
  size: 0.05,
  color: 0xffd700,
  opacity: 0.6,
  spawn: "nearArtifacts",
  movement: {
    speed: 0.01,
    spiral: true
  }
}
```

---

## Level of Detail (LOD) System

**javascript**

```javascript
const lodConfig = {
  distances: {
    near: 0,
    medium: 10,
    far: 25
  },
  
  quality: {
    near: {
      geometry: "high",
      textures: "full",
      particles: "all",
      shadows: true
    },
    medium: {
      geometry: "medium",
      textures: "half",
      particles: "reduced",
      shadows: false
    },
    far: {
      geometry: "low",
      textures: "none",
      particles: "none",
      shadows: false
    }
  }
};
```

---

## Performance Tiers

### Tier 1: Ultra (Desktop High-End)

- Full resolution textures (2048px)
- All post-processing effects
- 1000+ particles
- Real-time shadows
- 60fps target

### Tier 2: High (Desktop Standard)

- High resolution textures (1024px)
- Bloom + DOF
- 500 particles
- Baked shadows
- 60fps target

### Tier 3: Medium (Laptop/Tablet)

- Medium textures (512px)
- Bloom only
- 200 particles
- No shadows
- 30fps target

### Tier 4: Low (Mobile/Entry)

- Low textures (256px)
- No post-processing
- 50 particles
- Simplified geometry
- 30fps target

### Tier 5: Accessibility

- No WebGL
- 2D fallback experience
- Static images
- Full accessibility support

---

---

# 07 — INTERACTION SYSTEM

## Input Modalities

### Desktop Input

| **ActionInputResult** |                        |                         |
| --------------------- | ---------------------- | ----------------------- |
| Look                  | Mouse move             | Camera orientation      |
| Move forward          | Scroll up / W          | Camera forward          |
| Move backward         | Scroll down / S        | Camera backward         |
| Pan                   | Right-click + drag     | Camera lateral movement |
| Select                | Left-click on artifact | Focus on memory         |
| Return                | Escape / Backspace     | Return to environment   |
| Timeline              | T key                  | Open timeline view      |
| Archive               | A key                  | Open archive view       |
| Letters               | L key                  | Open letters view       |
| Overview              | O key                  | Toggle 2D overview      |

### Touch Input (Mobile)

| **GestureResult**  |                              |
| ------------------ | ---------------------------- |
| Single finger drag | Look around                  |
| Pinch              | Zoom in/out                  |
| Double tap         | Select focused artifact      |
| Two finger drag    | Pan camera                   |
| Long press         | Context menu (if applicable) |
| Edge swipe         | Back navigation              |

### Keyboard Shortcuts

**javascript**

```javascript
const keyboardShortcuts = {
  // Navigation
  'ArrowUp': 'moveForward',
  'ArrowDown': 'moveBackward',
  'ArrowLeft': 'rotateLeft',
  'ArrowRight': 'rotateRight',
  'w': 'moveForward',
  's': 'moveBackward',
  'a': 'strafeLeft',
  'd': 'strafeRight',
  
  // Views
  't': 'openTimeline',
  'l': 'openLetters',
  'a': 'openArchive',
  'h': 'openHorizon',
  'o': 'toggleOverview',
  
  // Actions
  'Escape': 'goBack',
  'Enter': 'selectFocused',
  'Space': 'playPauseAudio',
  'f': 'toggleFullscreen',
  'm': 'toggleMute',
  
  // Accessibility
  'Tab': 'nextFocusable',
  'Shift+Tab': 'previousFocusable'
};
```

---

## Interaction States

### Artifact States

**javascript**

```javascript
const artifactStates = {
  DORMANT: {
    glow: 0.1,
    scale: 1.0,
    rotation: 'slowDrift',
    opacity: 0.8
  },
  
  PROXIMATE: {
    glow: 0.3,
    scale: 1.05,
    rotation: 'orientToCamera',
    opacity: 1.0
  },
  
  FOCUSED: {
    glow: 0.6,
    scale: 1.1,
    rotation: 'faceCamera',
    opacity: 1.0
  },
  
  ACTIVE: {
    glow: 1.0,
    scale: 1.0, // Handled by camera transition
    rotation: 'none',
    opacity: 1.0
  }
};
```

### State Transitions

| **FromToTriggerDurationEasing** |           |                              |       |           |
| ------------------------------- | --------- | ---------------------------- | ----- | --------- |
| DORMANT                         | PROXIMATE | Camera proximity < 5 units   | 300ms | easeOut   |
| PROXIMATE                       | FOCUSED   | Center of view / hover 500ms | 200ms | spring    |
| FOCUSED                         | ACTIVE    | Click / Enter key            | 800ms | cinematic |
| ACTIVE                          | DORMANT   | Escape / Back                | 500ms | easeInOut |

---

## Camera Behavior

### Free Exploration Mode

- Orbit controls with damping
- Smooth acceleration/deceleration
- Boundary constraints (invisible walls)
- Collision detection with artifacts (soft repulsion)

### Focus Mode

- Smooth transition to predefined viewpoint
- Depth of field adjusts to focus distance
- Other artifacts fade/dim
- UI elements appear

### Timeline Mode

- Camera moves to overhead/track position
- Linear path along timeline
- Memory artifacts align along path
- Smooth scroll-to-movement mapping

---

## Feedback System

### Visual Feedback

- Cursor changes on hoverable elements
- Focus rings for keyboard navigation
- Loading states for media (subtle pulse)
- Success confirmations (brief glow)

### Audio Feedback

- Subtle UI sounds (can be disabled)
- Spatial audio for artifacts (proximity-based volume)
- Ambient soundtrack (optional, default off)

### Haptic Feedback (Mobile)

- Light impact on selection
- Medium impact on major transitions

---

---

# 08 — TECH STACK DECISION (UPDATED)

## 8.1 Frontend

### Framework

**Next.js 16.x Active LTS, App Router**

Use the latest security-patched Active-LTS 16.x release available at build time and pin the exact version in the lockfile. Do not start on unsupported Next.js 14.x.

### Runtime

**Node.js 24.x LTS**

Use an LTS runtime in production and keep security patches current.

### Language

TypeScript strict mode.

### 3D

- Three.js
- React Three Fiber
- `@react-three/drei`
- `@react-three/postprocessing` only where justified

### UI / animation

- Tailwind CSS for layout/tokens
- CSS Modules for isolated complex styling
- Framer Motion for UI transitions where it materially helps
- GSAP only for complex cinematic/timeline orchestration where its capabilities are clearly useful

Do not add overlapping animation libraries without a documented reason.

### State

- Zustand for client experience state
- TanStack Query for server state
- Do not persist private content into long-lived browser storage

## 8.2 Backend

### Application

Next.js Route Handlers and server-only modules.

### Database

PostgreSQL.

Preferred managed option: Supabase Postgres or equivalent managed PostgreSQL with TLS, backups and row-level-security capability.

### Object storage

Cloudflare R2, private bucket.

### Authentication

Custom server-side passphrase authentication and database-backed opaque sessions.

JWTs are not stored in browser storage. A third-party auth library is optional; it must not weaken the session contract.

### Password verification

Argon2id on the server.

Do not client-hash the password and then treat the client-derived value as the password-equivalent credential.

### Media processing

- Sharp for image inspection/normalization/variants
- FFmpeg only when a suitable runtime is explicitly provisioned
- Audio/video may initially be validated and stored without transcoding
- Do not perform unbounded media processing inside a request

## 8.3 Infrastructure

- Vercel or equivalent Next.js-compatible host
- Cloudflare DNS
- Cloudflare R2 private bucket
- managed PostgreSQL
- production-ready distributed rate-limit store
- Sentry or equivalent error monitoring with sensitive-data scrubbing
- no analytics/tracking by default

---

# 09 — SYSTEM ARCHITECTURE

## 9.1 Logical Architecture

```text
                        ┌────────────────────────┐
                        │        Browser         │
                        │  3D / 2D / A11y        │
                        │  Keyboard / Touch      │
                        └───────────┬────────────┘
                                    │ HTTPS
                                    ▼
                        ┌────────────────────────┐
                        │ Edge / CDN / WAF       │
                        │ DDoS + request policy   │
                        └───────────┬────────────┘
                                    │
                                    ▼
                     ┌──────────────────────────────┐
                     │ Next.js Application           │
                     │                              │
                     │ auth / authorization         │
                     │ route handlers               │
                     │ server data access           │
                     │ admin                         │
                     │ 3D client boundary            │
                     └──────────┬─────────┬─────────┘
                                │         │
                      ┌─────────▼──┐   ┌──▼─────────────┐
                      │ PostgreSQL │   │ Cloudflare R2  │
                      │            │   │ private bucket  │
                      │ memories   │   │ media           │
                      │ users      │   │ variants        │
                      │ sessions   │   │ staging         │
                      │ audit      │   └─────────────────┘
                      └────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Isolated backup │
                       │ storage/account │
                       └─────────────────┘
```

## 9.2 Request Boundary

Every protected request follows:

```text
request
  ↓
transport security
  ↓
origin / method validation
  ↓
rate limit where applicable
  ↓
session authentication
  ↓
resource authorization
  ↓
validated business operation
  ↓
minimal response
```

## 9.3 Private Content

The browser never receives storage credentials.

A private asset is accessed as:

```text
authenticated client
       ↓
POST /api/media/access
       ↓
server authenticates + authorizes
       ↓
server generates short-lived R2 presigned GET
       ↓
browser fetches exact object
```

The presigned URL is a bearer token. It remains usable until expiry. The default read lifetime is 5 minutes.

## 9.4 Upload

```text
admin
  ↓
POST /api/admin/media/upload-url
  ↓
server authenticates admin
  ↓
server validates type/size/name
  ↓
server creates opaque asset in PENDING state
  ↓
server creates presigned R2 PUT
  ↓
browser PUTs file directly to R2
  ↓
POST /api/admin/media/{assetId}/complete
  ↓
server HEADs and validates object
  ↓
server processes asset or marks original READY
  ↓
asset becomes READY
```

Use presigned PUT. Do not use presigned HTML-form POST.

---

# 10 — SECURITY ARCHITECTURE

Security requirements are specified in `02_SECURITY_PRIVACY_CONTRACT.md`. No implementation may weaken that contract.

---

# 11 — DATA, API & MEDIA ARCHITECTURE

Data/API/storage contracts are specified in `03_DATA_API_MEDIA_CONTRACT.md`.

---

# 12 — EXPERIENCE STATE MODEL

## States

- BOOT
- AUTHENTICATION
- AUTHENTICATING
- ENTRY_TRANSITION
- SANCTUARY
- MEMORY_FOCUS
- TIMELINE
- LETTERS
- LETTER_READ
- ARCHIVE
- HORIZON
- ERROR

## Required state behavior

### SANCTUARY

- 3D world is primary
- 2D overview is always available
- audio begins only after explicit interaction and only if enabled
- session expiry returns to authentication
- no protected content before successful authorization

### MEMORY_FOCUS

- focus selected artifact
- dim unrelated environment
- load only the media required for that memory
- show title/date/context
- provide related-memory navigation
- preserve clear return path

### TIMELINE

- 3D time tunnel on capable devices
- 2D chronological view everywhere
- semantic accessible list equivalent
- future path remains visually distinguishable

### LETTERS / LETTER_READ

- warmer visual treatment
- readable text
- optional handwriting animation
- animation removed under reduced-motion
- text remains accessible/selectable

### ARCHIVE

- efficient search/filter/sort
- direct memory access
- lazy thumbnails
- pagination or safe infinite scroll

### HORIZON

- forward-looking
- future dates/promises/blank pages
- no forced finale
- clear path back to sanctuary

---

# 13 — RESPONSIVE & ACCESSIBILITY CONTRACT

## Desktop — 1200px+

- complete 3D experience
- mouse + keyboard
- optional spatial audio
- high visual quality

## Tablet — 768px–1199px

- simplified 3D
- touch controls
- reduced particles/shader complexity
- hybrid 3D/detail layouts

## Mobile — <768px

- 2D-first experience
- optional simplified 3D on capable devices
- native media controls
- touch navigation
- reduced motion respected

## Accessibility

The site must remain fully usable without WebGL.

Required:

- semantic HTML
- visible keyboard focus
- logical tab order
- screen-reader labels
- 2D memory list
- readable letter text
- photo alternatives where content provides them
- reduced-motion mode
- no information conveyed by color alone
- proper modal focus management
- Escape/back from every transient state

Target WCAG 2.2 AA for the 2D/accessibility layer.

---

# 14 — 3D WORLD CONTRACT

## Scene graph

```text
Scene
├── Environment
├── Camera Rig
├── Lighting
├── Particles
├── Memory Layer
│   ├── Chapter Islands
│   └── Artifacts
├── Focus Layer
└── Post Processing
```

## Baseline camera

- FOV: 60
- near: 0.1
- far: 100
- initial position: [0, 1.6, 5]
- damping enabled
- bounded movement
- focus distance: approximately 3

Exact values may be tuned through testing.

## Quality tiers

1. Ultra
2. High
3. Medium
4. Low
5. Accessibility

Automatic quality selection may be used, but the user must be able to select a lower tier.

## Resource lifecycle

Dispose all dynamically created:

- geometries
- materials
- textures
- render targets
- post-processing effects
- controls
- audio nodes

## LOD

Near:
- full geometry/textures
- selected shadows/effects

Medium:
- reduced texture size
- simplified geometry
- reduced particles
- shadows disabled where needed

Far:
- low-cost geometry/impostors
- no unnecessary textures
- no per-object heavy effects

---

# 15 — INTERACTION CONTRACT

## Desktop

- mouse: look
- W/S or arrows: forward/back
- A/D: strafe
- click/Enter: select
- Escape: back
- T: timeline
- L: letters
- H: horizon
- O: overview
- F: fullscreen
- M: mute

**Important:** `A` is not also the Archive shortcut. Use `V` or another non-conflicting shortcut for Vault/Archive.

## Touch

- drag: look
- pinch: zoom
- double-tap: select focused artifact
- two-finger drag: pan where supported
- edge swipe: back

## Artifact states

- DORMANT
- PROXIMATE
- FOCUSED
- ACTIVE

Each state must have an accessibility/reduced-motion equivalent.

---

# 16 — CONTENT MODEL SUMMARY

## Memory

- id
- userId
- chapterId
- kind
- title
- description
- body text for letters where applicable
- memory date
- location
- emotion
- favorite
- draft
- sort order
- created/updated timestamps
- soft-delete metadata
- linked assets

## Asset

- id
- memoryId
- type
- opaque storage key
- original filename
- verified MIME type
- byte size
- dimensions if relevant
- duration if relevant
- processing status
- variant manifest
- checksum where available
- created/updated timestamps

---

# 17 — REPOSITORY STRUCTURE

```text
aethelgard/
├── AGENTS.md
├── README.md
├── docs/
│   ├── 00_HANDOFF.md
│   ├── 01_AETHELGARD_MASTER_BUILD_SPEC.md
│   ├── 02_SECURITY_PRIVACY_CONTRACT.md
│   ├── 03_DATA_API_MEDIA_CONTRACT.md
│   ├── 04_ACCEPTANCE_RELEASE_GATE.md
│   └── adr/
├── app/
│   ├── (sanctuary)/
│   ├── auth/
│   ├── admin/
│   ├── api/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── three/
│   ├── ui/
│   └── auth/
├── hooks/
├── lib/
│   ├── auth/
│   ├── db/
│   ├── media/
│   ├── security/
│   ├── three/
│   └── validation/
├── types/
├── config/
├── public/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   ├── security/
│   └── accessibility/
├── scripts/
├── proxy.ts
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

# 18 — CONFIGURATION BASELINE

```ts
export const siteConfig = {
  name: "Aethelgard",
  tagline: "Where memories have weight, and love has geography.",
  experience: {
    defaultQuality: "auto",
    audioEnabledByDefault: false,
    reducedMotionAware: true,
    entryTransitionMs: 3500,
  },
  features: {
    timeline: true,
    letters: true,
    archive: true,
    horizon: true,
    audio: true,
    favorites: true,
    search: true,
  },
};
```

```ts
export const securityConfig = {
  session: {
    idleTimeoutSeconds: 30 * 60,
    absoluteLifetimeSeconds: 24 * 60 * 60,
  },
  media: {
    readUrlLifetimeSeconds: 5 * 60,
    uploadUrlLifetimeSeconds: 10 * 60,
  },
  auth: {
    maxAttemptsPerWindow: 5,
    windowSeconds: 15 * 60,
  },
  uploads: {
    maxImageBytes: 10 * 1024 * 1024,
    maxAudioBytes: 50 * 1024 * 1024,
    maxVideoBytes: 250 * 1024 * 1024,
  },
};
```

All limits must be server-enforced.

---

# 19 — IMPLEMENTATION ORDER

## Phase 0 — Foundation

- current supported toolchain
- strict TypeScript
- lint/format
- database connection/migrations
- security headers
- `proxy.ts` route protection skeleton
- CI baseline

## Phase 1 — Authentication

- passphrase UI
- server-side Argon2id
- opaque database session
- secure cookie
- idle + absolute expiry
- distributed auth rate limiting
- logout
- audit events
- integration tests

## Phase 2 — 2D Core First

Implement the accessible functional backbone first:

- authenticated sanctuary route
- archive
- memory list/detail
- letters
- timeline
- horizon

## Phase 3 — 3D Foundation

- R3F canvas
- camera
- environment
- artifact primitives
- proximity/focus
- chapter islands
- entry transition
- fallback handling

## Phase 4 — Media

- R2 private bucket
- presigned PUT
- upload completion endpoint
- object validation
- Sharp processing
- signed GET
- image viewer
- audio/video handling

## Phase 5 — Experience Completion

- cinematic timeline
- letters chamber
- archive search/filter
- horizon
- admin editor
- audio/haptic enhancements

## Phase 6 — Hardening

- security tests
- accessibility audit
- performance profiling
- memory leak checks
- browser matrix
- backup restore

## Phase 7 — Release

- production configuration
- domain/DNS
- migrations
- secret verification
- monitoring
- release gate
- rollback runbook

---

# 20 — CREATIVE NORTH STAR

The experience must remain:

- intimate
- mysterious
- peaceful
- intentional
- handcrafted
- emotionally honest
- forward-looking

Aethelgard fails creatively if technology becomes more noticeable than the memories.

The standard is:

> **Every technical choice should make the sanctuary feel more private, more effortless, or more meaningful.**
