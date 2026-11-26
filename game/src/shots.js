// The screenshot scenes behind ?shot=title|gates|cargo|landing.
// Each one places the real plane, traffic and mission state at a staged
// moment of a real sortie, so the frame is the game itself — never a
// composite — and the same name always gives the same frame.

export function stageShot(name, flightApi, mission) {
  const flight = flightApi.state;
  flightApi.reset();
  mission.reset();

  if (name === 'gates') {
    mission.state.gateIndex = 2;
    mission.state.gatesPassed = 2;
    flight.x = 8; flight.y = 88; flight.z = -32;
    flight.heading = 0.1; flight.bank = 0.24; flight.speed = 52; flight.throttle = 0.78;
    flight.fuel = 84;
    return { screen: 'play', camera: 'chase', timeLeft: 208, score: 470 };
  }
  if (name === 'cargo') {
    mission.state.gateIndex = 7;
    mission.state.gatesPassed = 7;
    mission.state.cargo = 1;
    if (mission.crates && mission.crates[0]) mission.crates[0].visible = false;
    flight.x = -52; flight.y = 74; flight.z = -742;
    flight.heading = -0.16; flight.bank = -0.3; flight.speed = 47; flight.throttle = 0.66;
    flight.fuel = 63;
    return { screen: 'play', camera: 'chase', timeLeft: 141, score: 1180 };
  }
  if (name === 'landing') {
    mission.state.gateIndex = 12;
    mission.state.gatesPassed = 12;
    mission.state.cargo = 3;
    mission.state.finished = true;
    flight.x = 176; flight.y = 30; flight.z = -1305;
    flight.heading = 0.02; flight.bank = 0; flight.speed = 30; flight.throttle = 0.3;
    flight.vy = -3.2; flight.fuel = 31;
    return { screen: 'play', camera: 'chase', timeLeft: 58, score: 2410 };
  }
  // title: the plane banks toward the first gates in the last light,
  // big in the lower frame under the poster type, world ahead of it.
  flight.x = -40; flight.y = 76; flight.z = 380;
  flight.heading = 0.35; flight.bank = 0.3; flight.speed = 40; flight.throttle = 0.58;
  flight.fuel = 96;
  return { screen: 'title', camera: 'orbit', timeLeft: 240, score: 0 };
}
