# Website unification — audit + proposal

You said the two sites feel like "everything is thrown around." Here's the audit, what
I already unified (safe, done), and the bigger calls that are yours to make.

## The two sites (they ARE distinct products — that's fine)
- **novalabs.app** (`dash1101/NovaLabs`) — the org/brand. Pages: Home, Projects,
  **Nova D1** (`d1.html`), **Simulator** (`d1-sim.html`), Contact, Privacy. Design:
  gradient-orb + glass-card, cyan/blue.
- **rpc.novalabs.app** (`dash1101/RPCortex-site`) — the OS product. Pages: Docs,
  Packages, Roadmap, Install, Update, Release, PackageDev, Privacy. Design: RPCortex
  emblem + speed-stripes.

They already cross-link reciprocally (NovaLabs → RPCortex↗, RPCortex → Nova D1↗), and
Nova D1 *runs* RPCortex, so the split is sensible: **NovaLabs = the device/brand,
RPCortex = the OS.** I'd keep them as two brands, not merge into one.

## The real problem (now fixed): orphaned docs
`NovaLabs/docs/*.md` (roadmap, wiring, Flipper map, dev-plan, full spec, the new pcap
+ BLE-GATT specs) were **linked from no page** — rich content nobody could find. That's
most of the "thrown around" feeling.
- ✅ **Fixed:** `d1.html` now has a **"Docs, specs & tools"** section surfacing them all
  (+ the simulator), and clearer hero buttons (Try the simulator / See the UI / Build
  progress).

## Safe wins done
- Simulator restyled to the NovaLabs design + linked from the D1 hero and Resources.
- Real UI renders on the D1 page.
- D1 docs/specs/roadmap surfaced from `d1.html`.

## Your calls (bigger IA — I left these for you)
1. **Docs format.** The D1 docs are Markdown viewed on GitHub. Fine for now. If they
   should be first-class site pages (styled, searchable), convert the key ones
   (roadmap, wiring, Flipper map) to HTML under `novalabs.app/d1/...`. *Recommend: keep
   Markdown until a doc is genuinely user-facing; convert per-doc, not all at once.*
2. **A shared "family" footer** on every page of BOTH sites: NovaLabs · RPCortex ·
   Nova D1 · Simulator · Discord · GitHub. Cheap consistency; makes the two sites feel
   like one family without merging designs. *Recommend: yes — I can do this in one pass.*
3. **RPCortex site should show off the simulator + D1 more.** Today RPCortex only has a
   "Nova D1↗" nav link. A small "Runs on RPCortex: try the Nova D1" card on the RPCortex
   home (linking the sim) would tie them together. *Recommend: yes.*
4. **Two Privacy pages** (one per site) — fine to keep separate (different domains), or
   point both at one. Low priority.
5. **Design system.** The two sites use different components. Unifying into one CSS/
   component set is a big job for little user benefit (they're different brands). *Recommend:
   don't — just keep the shared family footer + cross-links.*

## Suggested next pass (once you approve)
- The shared family footer across both sites (#2).
- The "try Nova D1 / simulator" card on the RPCortex home (#3).
- Convert `novad1-roadmap.md` → a styled `d1/roadmap` HTML page if you want it
  first-class (it duplicates the live `d1.html` progress section, so maybe not needed).
