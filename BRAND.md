# Documently — Brand & Design System

Style direction: calm sky, ink and electric lime. The structure and visual language are inspired by a clean consulting-template look; all content, illustrations and the logo are original to Documently.

**Speed is the top rule.** Every visual is CSS or inline SVG. The only web font is Inter (self-hosted via next/font, one preloaded 48 KB Latin file). There are no hero images, no animation libraries and no icon fonts. A design change that adds a network request needs a good reason.

## Colour (tokens in `app/globals.css`)
| Token | Hex | Use |
|---|---|---|
| `ink` / `brand-600` | `#0f1112` | Text, primary pill buttons, footer, step numbers |
| `brand-700` | `#2b2f31` | Body copy, button hover, links |
| `lime` | `#d4f54a` | Accent: secondary pills, icon tiles, chips, highlights |
| `brand-500` | `#c6ec3f` | Lime hover, small dots, admin bars |
| `brand-50` / `brand-100` | `#f4fbd8` / `#e8f7ad` | Result card, source box, soft tints |
| `sky-deep` → `sky-pale` | `#1f6fd0` → `#cfe6fb` | Hero gradient (`.sky`), tool-page top band |
| `paper` | `#f5f6f3` | Page background |
| `card` / `line` | `#fff` / `#e7e9e6` | Cards and hairlines |
| `muted` | `#5d6366` | Secondary text (passes AA on paper and white) |

Contrast rules:
- **Lime:** never put text on lime that isn't ink, and never use lime text on white.
- **Lime on blue:** only for big headings on the deep part of the sky.
- **White on blue:** only on `sky-deep`, or on the top 40% of `.sky`.

## Type
- **System stack only:** SF Pro on Apple and Roboto on Android. Headings are semibold with tight tracking (−0.025 to −0.035em).
- **Labels:** `.eyebrow` and pill text are Inter semibold, sentence case, normal tracking. No mono or all-caps labels: they read as technical.
- **Sizes:**

| Element | Phone | Desktop |
|---|---|---|
| H1 | 2.3rem | 3.75rem |
| Section H2 | 1.9rem | 3rem |
| Body | 16–17px | 16–17px |

## Shape & depth
- **Corners:**
  - cards: 22px (`--radius-card`)
  - section frames: 28px
  - inner tiles: 20px
  - buttons and chips: fully round
- **`.card`:** white with a 1px `line` border and a very soft two-layer shadow. No heavy shadows.
- **Framing:** section grids sit inside a white 28px frame, with 3px padding and a hairline border, holding bordered tiles.

## Components (`components/Brand.tsx`)
- **`Logo`:** an ink tile containing a white page, a lime fold and an ink tick. `scripts/generate-icons.mjs` must mirror the same geometry; rerun it after any change.
- **`PillLink`:** the signature CTA, a sentence-case pill with a round arrow badge.

| Tone | Pill | Badge |
|---|---|---|
| `ink` | ink | lime |
| `lime` | lime | ink |
| `white` | white | ink |

- **Section pattern:** eyebrow, then a big centred H2, then a muted one-line sub, then a framed grid.
- **Tool pages:** sky-pale top band (breadcrumb, eyebrow, H1, answer, trust chips, tool). Below it come white cards: spec, Key facts (lime label), how-to steps (ink circles, lime numbers), FAQ (lime "+" that turns ink when open).

## Voice
- **Plain and exact.** Use real numbers only: official specs with their source, or our own measurements written as "in our tests".
- **No invented proof:** no testimonials, user counts or star ratings until they are real.
- **Trust line everywhere:** Free · No signup · Files never leave your device.
