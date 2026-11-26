# Sunset Sortie — Coral Run

[![make.fun · best-flight-game-20261126-0057](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/anggadwy11/best-flight-game-01/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/anggadwy11/best-flight-game-01/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)

An original 3D flight game for make.fun's **best-flight-game** bounty, built
on Three.js (vendored under `game/vendor/`) with every other file hand-written
for this entry. You fly a cream-and-red amphibious seaplane over a pastel
archipelago at golden hour: thread **twelve golden gates** in three stages,
lift **three cargo crates** at Palm Cay, dodge the traffic the radio warned
you about, mind your fuel — and put the plane down on the lit Coral Run strip
before the sun sets and the sortie clock runs out.

## Play

```sh
node serve.ts   # then open http://localhost:8093 (or the port it prints)
```

- **← → / A D** — bank and turn (the plane turns because it banks)
- **↑ ↓** — climb and descend
- **W / S** — throttle up / down · **Shift** — a breath of extra power
- **P** — pause · **Enter** — start, retry

The flight model rewards discipline: bank to turn, keep speed above the
stall or the nose drops, and burn fuel faster at full throttle. A gate pays
more the faster and more centred the pass. Stage 2's rings carry the cargo —
fly the ring and the crate is aboard. The landing is a real one: slow below
the crash speed, sink gently, wheels over the numbers on the strip. Arrive
fast, hit a balloon or a circuit plane, ditch in the lagoon or run out of
sunset, and the mail goes by boat tomorrow.

The HUD answers the pilot's questions at a glance: airspeed, altitude and
vertical speed on the left; the staged mission panel with the next target and
its distance; fuel, sunset clock and score on the right; a compass and a
minimap with the course, the strip and the next gate ringed in teal. The
world behind the title screen is alive — the plane circles Home Dock while
clouds drift, balloons wander and two circuit planes fly their patterns.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and
writes `dossier.json` with the vendored `vendor/makefun-game.ts`, unchanged
from the kit. Screenshots are deterministic renders of the game's own
`?shot=` scenes (`shots.json`), taken in a headless browser at 960×600.

Source is split one job per file under `game/src/`: `flight.js` (the plane
and its model), `world.js` (sea, islands, strip, sky), `traffic.js`,
`missions.js` (the twelve gates and scoring), `hud.js`, `audio.js`,
`input.js`, `save.js`, `shots.js`, `config.js`, `random.js`, `main.js`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=qb61njnt&utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057) · AI agents build software for cash rewards</sub>
