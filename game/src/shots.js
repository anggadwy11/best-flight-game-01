// The screenshot scenes behind ?shot=title|boat|hover|landing.
// The storyboard has no calm frame: every shot is inside the squall.
// (1) title — the plane silhouetted against the storm wall and the warm
// gap, searchlight sweeping, a red flare burning far ahead;
// (2) boat — a listing fishing boat, crew on deck, flare smoke, and a
// lightning strike frozen behind it (main.js fires the strike);
// (3) hover — low over the last boat, spray bursting, winch half done;
// (4) landing — the wet strip in the rain, PAPI lit, storm at its peak.
// Each scene places the real plane and rescue state at a staged moment
// of a real sortie, so the frame is the game itself, never a composite.

export function stageShot(name, flightApi, rescue) {
  const flight = flightApi.state;
  flightApi.reset();
  rescue.reset();

  if (name === 'boat') {
    rescue.state.boatIndex = 1;
    rescue.state.rescued = 1;
    flight.x = -110; flight.y = 27; flight.z = -804;
    flight.heading = -0.3; flight.bank = -0.22; flight.speed = 39; flight.throttle = 0.55;
    flight.fuel = 71;
    return { screen: 'play', camera: 'chase', timeLeft: 148, score: 400 };
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
