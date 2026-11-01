# Product

## Platform
Static web portfolio deployed by GitHub Pages from generated HTML.

## Purpose
Present Quentin Guignard as a software engineer in Switzerland, with Applied AI and R&D work. The current user-approved experiment introduces the person after the title screen: portrait, biography, background and toolkit. Software projects remain the first work category, followed by Art, compact OZWE experience, personal games and a contact-only ending. Preserve existing project/article URLs and interactive sheets.

## Selected direction
Gateway from the local portfolio exploration, refined in docs/gateway-brief.md. Large centered identity, dark graphite palette, local code-oriented type, subtle warm/cool accents. Connected particles travel in opposing directions, the name appears through a single horizontal scan, and pointer-local chromatic lettering and portrait code remain. Repeatable guided title ↔ About ↔ projects transitions; natural scrolling in a tall About and throughout the work. A direct Projects link stays accessible on desktop and mobile.

## Content and architecture
Node build script generates static files. Article Markdown in pages/*/article.md, homepage prose in content/home.md, card metadata/order in cards/*.json, presentation in templates and assets. No browser-side content compilation. Fonts and homepage previews are local. New content must be addable without editing animation code.

## Working constraints
Current work is local on design/gateway. No commit, push or deployment is authorized yet. npm run dev rebuilds and live-reloads on the local network for phone review. Existing images, descriptions and qualifications remain factual. Stock cutout is a demonstration, not Quentin; replace before production. Existing CV is not newly updated.

## Accessibility and discovery
Semantic HTML, keyboard-operable links and controls, visible content without JavaScript, reduced-motion/pause support, bounded offscreen rendering. Canonicals, sitemap, robots and descriptive metadata preserve crawlability. Structured data must match visible facts. Search visibility and citations are not guaranteed.
