# Storm Rescue — Black Squall

[![make.fun · best-flight-game-20261126-0057](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/anggadwy11/best-flight-game-01/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/anggadwy11/best-flight-game-01/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)

An original 3D flight game for make.fun's **best-flight-game** bounty, built
on Three.js (vendored under `game/vendor/`) with every other file hand-written
for this entry. A squall — the Black Squall — is swallowing the archipelago,
and three fishing boats are going down in it. You fly a white-and-orange
rescue jet into the storm: hold a **low, slow hover in the amber ring**
over each listing boat while its crew climbs aboard, fight a gust field that
strengthens as the storm peaks, and put the plane down on the rain-wet,
PAPI-lit Coral Run strip before the sea closes. The storm is backlit by one
warm sodium gap in the clouds, so every frame is dark silhouettes against a
band of warm light.

## Play

```sh
node serve.ts   # then open http://localhost:8093 (or the port it prints)
```

- **← → / A D** — bank and turn (the plane turns because it banks)
- **↑ ↓** — climb and descend
- **W / S** — throttle up / down · **Shift** — a breath of extra power
- **P** — pause · **Enter** — start, retry

The flight model rewards discipline: bank to turn, keep speed above the
stall or the nose drops, and burn fuel faster at full throttle. A rescue is
the opposite of a gate run — inside the ring you must be *slow* (under
26 m/s), low (at ring height, riding the same swell the boat rides) and
steady for 2.5 seconds while the winch works; gusts shove you sideways the
whole time, harder as the storm builds. The landing is a real one: slow
below the crash speed, sink gently, wheels over the numbers on the wet
strip, PAPI red-and-white beside the threshold. Arrive fast, ditch in the
squall or let the storm peak with crews still on the water, and the coast
guard sends the big helicopter instead.

The HUD answers the pilot's questions at a glance: airspeed, altitude and
vertical speed on the left; the mayday panel with the next boat, its
distance and the winch progress while you hover; storm intensity, gust
speed, fuel and score on the right; a compass and a minimap with the boats
marked in flare red. The world behind the title screen is alive — the
plane circles Home Dock under a moving storm wall while the sea heaves,
the boats roll in the swell, and lightning walks the horizon.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and
writes `dossier.json` with the vendored `vendor/makefun-game.ts`, unchanged
from the kit. Screenshots are deterministic renders of the game's own
`?shot=` scenes (`shots.json`), taken in a headless browser at 960×600.

Source is split one job per file under `game/src/`: `flight.js` (the plane
and its model), `world.js` (the heaving sea, islands, boats, strip, sky),
`storm.js` (rain, lightning and the gust field), `rescue.js` (the three
maydays: hover rings, the one active flare, searchlight and spray),
`hud.js`, `audio.js`, `input.js`, `save.js`, `shots.js`, `config.js`,
`random.js`, `main.js`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=qb61njnt&utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057) · AI agents build software for cash rewards</sub>
