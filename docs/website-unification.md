# Website unification — audit + open decisions

Notes on why novalabs.app and rpc.novalabs.app are two sites, what got tidied, and the
IA calls still open.

## Two sites, two products — and that's fine

- **novalabs.app** (`dash1101/NovaLabs`) — the org/brand. Pages: Home, Projects,
  **Nova D1** (`d1.html`), **Simulator** (`d1-sim.html`), Contact, Privacy. Design:
  gradient-orb + glass-card, cyan/blue.
- **rpc.novalabs.app** (`dash1101/RPCortex-site`) — the OS product. Pages: Docs,
  Packages, Roadmap, Install, Update, Release, PackageDev, Privacy. Design: RPCortex
  emblem + speed-stripes.

They cross-link reciprocally (NovaLabs → RPCortex↗, RPCortex → Nova D1↗), and the Nova
D1 *runs* RPCortex, so the split holds up: **NovaLabs = the device/brand, RPCortex = the
OS.** Keep them as two brands rather than merging.

## The real problem, now fixed: orphaned docs

`NovaLabs/docs/*.md` (roadmap, wiring, Flipper map, dev-plan, full spec, the pcap and
BLE-GATT specs) were linked from no page — rich content nobody could find. That was most
of the "everything is thrown around" feeling.

- **Fixed:** `d1.html` has a **"Docs, specs & tools"** section surfacing them all (plus
  the simulator), and clearer hero buttons (Try the simulator / See the UI / Build
  progress).

## Done

- Simulator restyled to the NovaLabs design, linked from the D1 hero and Resources.
- Real UI renders on the D1 page.
- D1 docs/specs/roadmap surfaced from `d1.html`.

## Open decisions

1. **Docs format.** The D1 docs are Markdown viewed on GitHub — fine for now. If they
   should become first-class site pages (styled, searchable), convert the key ones
   (roadmap, wiring, Flipper map) to HTML under `novalabs.app/d1/...`. *Leaning: keep
   Markdown until a doc is genuinely user-facing, then convert per-doc, not all at once.*
2. **A shared "family" footer** on every page of both sites: NovaLabs · RPCortex · Nova
   D1 · Simulator · Discord · GitHub. Cheap consistency, makes the two sites feel like
   one family without merging designs. *Leaning: do it.*
3. **RPCortex site should show off the simulator and the D1 more.** Today RPCortex only
   has a "Nova D1↗" nav link. A small "Runs on RPCortex: try the Nova D1" card on the
   RPCortex home, linking the sim, would tie them together. *Leaning: do it.*
4. **Two Privacy pages**, one per site — fine to keep separate (different domains), or
   point both at one. Low priority.
5. **Design system.** The two sites use different components. Unifying into one CSS/
   component set is a big job for little user benefit, since they're different brands.
   *Leaning: don't — the shared family footer plus cross-links is enough.*

## Suggested next pass

- The shared family footer across both sites (#2).
- The "try Nova D1 / simulator" card on the RPCortex home (#3).
- Convert `novad1-roadmap.md` to a styled `d1/roadmap` page only if it should be
  first-class — it duplicates the live `d1.html` progress section, so probably not needed.
