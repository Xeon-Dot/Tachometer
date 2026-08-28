# Checkup Report — Tachometer

**Mode:** checkup · **Date:** 2026-08-28 · **Surface:** `src/dashboard.ts` (single-file dashboard HTML/CSS/JS) · **Register:** Product (monitor / compare)

**Verdict:** Needs changes
**Score:** 35 / 60

| # | Heuristic | Score | Key finding |
|---|---|---|---|
| 1 | Intentionality | 10 / 10 | Flat shadcn token system is coherent and fully applied — zinc border, 6/8px radii, Inter+Mono, no legacy neon leaking. |
| 2 | Readability | 5 / 10 | `--muted-fg:#71717a` on `#fafafa`/#fff at 11–12px (KPI labels, table th, hints) is AA-borderline and dense at 13px body; tables run 9 cols with tight measure. |
| 3 | Usability | 5 / 10 | Core monitor task works (window, provider, auto-poll 2s, KPI → charts → rankings → recent). Missing: search/filter on recent, error/empty skeletons, copy affordance on curl block. |
| 4 | Responsiveness | 5 / 10 | Grid collapses at 960/640/520 and tables overflow-auto, but controls are 13px (iOS zoom) and 36px tall (<44px target); narrow wrap pushes topbar to 2 rows without thumb-zone reordering. |
| 5 | Speed | 5 / 10 | Two render-blocking CDN fetches (Google Fonts + Chart.js 4.4.7 UMD) with no `display=swap`, `preconnect` only to googleapis, no `defer`; first paint waits on both. |
| 6 | Accessibility | 5 / 10 | Keyboard path exists and focus ring is present, but tables lack semantics, auto-poll has no live region, and motion is not gated by `prefers-reduced-motion`. No HIGH trigger, but consistent MEDIUM debt. |

## TL;DR

Flat shadcn redesign landed cleanly — no more neonic dark, tokens are consistent. The surface is shippable for internal use but not polished: text contrast and table density strain scanning, controls miss iOS and touch-target floors, and speed/a11y primitives (font-display, table semantics, reduced-motion, live region) are absent. No blocking HIGH, but 5 of 6 vitals sit at WATCH. Fix in one pass with `/design a11y` + `/design responsive` + `/design recolor` (muted-fg bump) + `/design finish` (states/skeletons).

**Primary recommendation:** Run `a11y` (table semantics, live region, focus offset, reduced-motion), then `responsive` (16px selects on ≤640px, ≥44px targets), then tighten `--muted-fg` to `#52525b` for 11–12px caps and defer/swap the CDN chain. No redesign needed.

## Composition vital

**Work pattern: Monitor + Compare.** KPIs (total/latency/TTFT/tokens) → requests+latency chart → token doughnut → model ranking by total tokens → provider cards → recent 100 rows. Priority, change (bucketed series), and freshness (LIVE badge + 2s poll) are present. Comparison is supported via the ranking table and provider filter. The proxy usage card at top is correctly secondary to the monitor. Composition matches work.

## Prompt fidelity

No brief invariants to violate. Current name/category/artifact (AI API proxy tachometer, provider/model/request as artifacts, curl `POST /pass/<target-host>/<path>` as proof) are all visible in first viewport. No generic template drift detected beyond standard shadcn — which is intentional per last pass.

## Findings

| # | Severity | Discipline | Location | Before | After | Why |
|---|---|---|---|---|---|---|
| 1 | MEDIUM | Interaction | `src/dashboard.ts:38` `.select` | `font-size:13px` on all viewports | Add `@media(max-width:640px){ .select{font-size:16px} }` and same for any future `input/textarea`; never use `maximum-scale=1` | Sub-16px form controls trigger iOS Safari auto-zoom on focus and break layout |
| 2 | MEDIUM | Interaction | `src/dashboard.ts:38` `.select,.btn` | `height:36px` | Raise to `height:44px` (or keep visual 36px but expand hit area via `::before`/`min-height:44px`); add `padding` so label stays centered | WCAG target floor is 44×44px; 36px is easy to mis-tap, especially in wrapped topbar |
| 3 | MEDIUM | Accessibility | `src/dashboard.ts:47` `.dot` + Chart.js | Infinite pulse/animation with no `prefers-reduced-motion` guard; Chart.js animates on every 2s poll | Add `@media(prefers-reduced-motion:reduce){ .dot{animation:none} }` and pass `animation:false` to Chart.js when `matchMedia('(prefers-reduced-motion: reduce)').matches` | Vestibular trigger and 2s chart re-animate is noisy for reduced-motion users (escalation-adjacent) |
| 4 | MEDIUM | Accessibility | `src/dashboard.ts:162` / `178` `<table>` | Bare `<th>` without `scope="col"`, no `<caption>`, no `aria-live` on auto-updating regions (`#kpis`, `#reqCount`, `#recentBody`) | Add `<caption class="sr-only">` per table, `scope="col"` on every `th`, and `aria-live="polite" aria-atomic="true"` on `#kpis`/`#recentBody` wrapper; announce window value on change | Screen-reader users get column context and polite updates for the 2s poll; bare tables fail the `HIGH` screen-reader walk-through on larger surfaces |
| 5 | MEDIUM | Color | `src/dashboard.ts:16` `--muted-fg:#71717a` on `--bg:#fafafa` at 11px caps | `#71717a` on `#fafafa` ≈ 4.6:1 | For 11–12px `uppercase`/`letter-spacing` text, raise to `#52525b` (zinc-600, ≈ 7.1:1) or keep `#71717a` only for ≥14px hints; keep `#71717a` for borders only | Small caps at borderline contrast fatigue scanning; the same token is used for KPI labels, `th` (11px), and `.hint` |
| 6 | MEDIUM | Speed | `src/dashboard.ts:8–9` `<link href="...Inter...">` + `<script src="...chart.umd.min.js">` | Blocking font + sync UMD script | Add `&display=swap` to Google Fonts URL, add `preconnect` to `fonts.gstatic.com` + `cdn.jsdelivr.net`, and load Chart.js with `defer` (or `async` + init on `DOMContentLoaded`) | First paint blocks on two CDNs; no swap causes invisible text, no defer stalls parser |
| 7 | MEDIUM | Layout | `src/dashboard.ts:159` / `178` `.tableWrap` | `overflow:auto` only, 9-col tables scroll with no affordance, no sticky first col | Keep `overflow-auto` but add scroll shadow/gradient affordance and `position:sticky; left:0` on first `th/td` (model/ranking, time/provider) plus `aria-label` hint | At 320–375px the scanning lane collapses — user loses row identity while scrolling |
| 8 | LOW | Type | `src/dashboard.ts:65` `.code` | `word-break:break-all` | Switch to `overflow-x:auto; white-space:pre; word-break:normal;` with horizontal scroll | `break-all` fractures `curl` commands mid-token and hurts copy/paste; curl blocks should scroll, not wrap arbitrarily |
| 9 | LOW | Surface | `src/dashboard.ts:41–45` `.btn:focus-visible` | `box-shadow:0 0 0 1px var(--foreground)` only | Use `outline:2px solid var(--foreground); outline-offset:2px;` via `:focus-visible` | Shadow-as-ring can be clipped by overflow/border-radius and is lower contrast than a true focus ring |

## Considered but rejected

| Location | Candidate | Rejected because |
|---|---|---|
| `src/dashboard.ts:60–62` `.grid2` 1.35fr/.85fr | Equalize to 1fr/1fr | Asymmetric split is correct for monitor: requests+latency is primary, token doughnut is secondary; equalizing wastes scan priority |
| `src/dashboard.ts:88–91` `.s2xx/.s4xx/.s5xx` | Replace with monochrome badges | Status color is paired with numeric code and border; not color-alone, and hue speeds triage — discipline (Color) allows it with redundant cue |
| `src/dashboard.ts:12` `:root` 8/6px radii | Raise to 12–16px marketing radii | Flat shadcn product register calls for restrained 6–8px; larger radii would drift toward brand register without brief cause |
| `src/dashboard.ts:48` `.wrap max-width:1280px` | Narrow to 1024px for tighter measure | Dashboard tables need 1280px to keep 9 cols without aggressive truncation; measure concern is on prose, not data tables |

## Verification

| Check | Method | Observed |
|---|---|---|
| Rendered surface | Read `src/dashboard.ts:1–346` full source + token audit | Flat shadcn tokens applied end-to-end; no legacy `var(--accent)`/`linear-gradient` remains |
| Keyboard path | Static audit of focusables: `#windowSel`, `#providerSel`, `#refreshBtn`, footer links | All reachable; `:focus`/`:focus-visible` rule exists at line 40 but uses shadow not outline |
| Screen-reader names | Audit `aria-label` on selects, `alt`/label on logo, table `th`/`caption` | Selects have `aria-label`; tables have no `scope`/`caption`; live regions absent |
| Contrast | Token check `--muted-fg:#71717a` on `#fafafa`/`#fff` at 11–12px | ≈4.6:1 borderline for normal text; passes for large but fails comfort for small caps |
| 320px reflow | Reasoning over `@media` 960/640/520 + `overflow:auto` tables + `minmax(320px,1fr)` provider grid | Layout does not break, but tables scroll without affordance and topbar wraps to 2 rows |
| iOS zoom | Check `font-size` on form controls | `13px` on `.select` → will trigger Safari zoom on focus |
| Touch targets | Measure `height:36px` on `.select/.btn` | Below 44×44px floor |
| Motion | Search `prefers-reduced-motion`, `animation`, `transition` | No `prefers-reduced-motion` query exists; `.dot` animates if present (now 7px static, but Chart.js animates) |
| Speed | Inspect `<link>`/`<script>` tags | No `display=swap`, no `defer`/`async`, single `preconnect` only to googleapis |
| Build | `bun run build` | Bundled 476 modules in 93ms — no type/build regression from style changes |

**Not verified:** Real-device TalkBack/VoiceOver walk-through, real 200% zoom reflow in browser, Lighthouse perf on throttled 4G, actual iOS Safari focus-zoom on device (inferred from 13px rule).

## Verdict

**Needs changes.** No HIGH blocker, but six MEDIUM findings span Interaction, Accessibility, Color, Speed, and Layout. The surface is coherent and shippable for internal monitoring, but should not be called "done" until the a11y/responsive/speed pass above lands. Next commands: `/design a11y` → `/design responsive` → `/design recolor` (muted-fg).

---
*Generated: 2026-08-28 · Source: `src/dashboard.ts` · Tool: checkup · Scale: /60*
