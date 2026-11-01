---
name: "Quentin Guignard — Gateway"
description: "Selected portfolio identity; local review on design/gateway, not deployed."
colors:
  bg: "#191e28"
  fg: "#ececf2"
  muted: "#b9becd"
  accent: "#eeb9a2"
  second: "#a9c6ef"
  third: "#d6b9e8"
  panel: "#262e3c"
  line: "#455166"
typography:
  display: {fontFamily: "JetBrains, monospace", fontSize: "clamp(64px, 10vw, 148px)", fontWeight: 500, lineHeight: "1.07", letterSpacing: "-.04em"}
  headline: {fontFamily: "JetBrains, monospace", fontSize: "clamp(27px, 3vw, 39px)", fontWeight: 500, lineHeight: "1.18", letterSpacing: "-.04em"}
  body: {fontFamily: "Manrope, sans-serif", fontSize: "14px", lineHeight: "1.6"}
rounded:
  card: "0"
  arrow: "50%"
spacing:
  project-grid: "25px"
  project-body: "19px"
  about-columns: "clamp(36px, 5vw, 72px)"
components:
  motion-control: {width: "36px", height: "36px", textColor: "{colors.muted}"}
  cv-link: {height: "42px", padding: "0 10px 0 16px"}
---

# Design System: Gateway

## Overview
**Creative North Star: “The introduction, then freedom.”** Gateway is the selected identity: centered, software engineering as the first work category, restrained interaction and readable static content. This record describes the repository implementation.

## Colors
Blue graphite supports pale text and fine borders. Peach marks actions; blue and lavender join it in particles and portrait code. Keep accents subordinate to identity and work.

## Typography
Local `assets/fonts/JetBrains.woff2` supplies the name and headings; `Manrope.woff2` supplies prose. Both use swap loading. A finite left-to-right scan reveals the name (1250ms per line, 150ms stagger), without blinking. Independent solid letter faces remain readable; chromatic edges appear only near the pointer and disappear at rest.

## Layout
A fixed header frames a 100svh title screen. The current local experiment follows with About, Projects, Art, compact Experience, Games and a contact-only ending. The container caps at 1340px; project grids move from three columns to two below 900px and one below 600px. About places its heading and background left, portrait and biography right, then the toolkit and project link below. Its desktop minimum height is the viewport minus 96px; mobile expands naturally, placing portrait and biography before background. The portrait is 290px wide with a 245px image height, changing to 245px wide and 235px high on mobile. A direct Projects link remains available, using a compact header link at 900px and below. Small pause/replay controls sit bottom-right.

## Elevation & Depth
Cards remain flat, without shadows. Tonal hover surfaces, modest image zoom and local lettering displacement provide depth. Larger, brighter connected particles travel in opposing directions, with endpoint-colored links that reform as they pass. Six code streams surround the portrait; softer role and paragraph response keeps text stable.

## Shapes
Square cards, consistent 16/10 previews and thin rules define the page. Circular arrows distinguish introduction and contact actions. Preserve existing project sheets and media dialogs.

## Components
The title ↔ About ↔ projects boundaries repeat in both directions through wheel, navigation keys or completed vertical swipes. Scrolling inside a tall About and throughout the work remains native. Pause and reduced motion disable guided transitions and the name scan, restoring visible static content. Canvas work pauses offscreen and in hidden tabs; entrances reverse with scrolling and headings finish after cards.

Content is generated as semantic HTML from Markdown, card JSON and templates. No browser compilation is needed. Preserve ordinary anchors, visible focus, dates beside titles and contact/CV hover feedback.

## Do's and Don'ts
Do maintain this identity and modular content. Don’t restore tunnels or thumbnail selectors. The user-approved finite scan is limited to the name; do not add scans to project cards. Replace the demonstration stock cutout before production; the published CV is unchanged. Current automated and browser checks are recorded in `docs/gateway-intro-validation.md`; the finish reviewer reported SHIP for local review with no material UI findings. Physical-phone behavior, comfort and performance remain unverified. Nothing is deployed.

