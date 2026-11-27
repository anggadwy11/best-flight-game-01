// The screenshot scenes behind ?shot=title|boat|hover|landing.
// The storyboard has no calm frame: every shot is inside the squall.
// (1) title — the plane silhouetted against the storm wall and the warm
// gap, searchlight sweeping, a red flare burning far ahead;
// (2) boat — the cockpit frame: first mayday in the reticle, live dash
// instruments below, storm wall and warm gap beyond the canopy;
// (3) hover — low over the last boat, spray bursting, winch half done;
// (4) landing — the wet strip in the rain, PAPI lit, storm at its peak.
// Each scene places the real plane and rescue state at a staged moment
// of a real sortie, so the frame is the game itself, never a composite.

export function stageShot(name, flightApi, rescue) {
  const flight = flightApi.state;
  flightApi.reset();
  rescue.reset();

  if (name === 'boat') {
    // The cockpit frame: first mayday dead ahead in the reticle, the
    // amber ring and flare over FV Kestrel, storm wall behind it, and
    // every dash screen reading the real flight state.
    rescue.state.boatIndex = 0;
    rescue.state.rescued = 0;
    flight.x = 30; flight.y = 30; flight.z = -292;
    flight.heading = 0.22; flight.bank = -0.16; flight.speed = 39; flight.throttle = 0.55;
    flight.vy = -3.4; flight.pitch = -0.09;
    flight.fuel = 84;
    return { screen: 'play', camera: 'cockpit', timeLeft: 176, score: 0 };
  }
  if (name === 'hover') {
    rescue.state.boatIndex = 2;
    rescue.state.rescued = 2;
    rescue.state.dwell = 1.4;
    flight.x = 98; flight.y = 20; flight.z = -1171;
    flight.heading = 0.22; flight.bank = 0.06; flight.speed = 17; flight.throttle = 0.34;
    flight.fuel = 48;
    return { screen: 'play', camera: 'chase', timeLeft: 92, score: 800 };
  }
  if (name === 'landing') {
    rescue.state.boatIndex = 3;
    rescue.state.rescued = 3;
    rescue.state.finished = true;
    flight.x = 177; flight.y = 24; flight.z = -1352;
    flight.heading = 0.02; flight.bank = 0; flight.speed = 30; flight.throttle = 0.3;
    flight.vy = -3.2; flight.fuel = 29;
    return { screen: 'play', camera: 'chase', timeLeft: 41, score: 1200 };
  }
  // title: big in the lower frame under the poster type, storm wall and
  // warm gap ahead, the first flare a red point on the horizon.
  flight.x = -58; flight.y = 66; flight.z = 215;
  flight.heading = 0.34; flight.bank = 0.3; flight.speed = 40; flight.throttle = 0.58;
  flight.fuel = 96;
  return { screen: 'title', camera: 'orbit', timeLeft: 205, score: 0 };
}
