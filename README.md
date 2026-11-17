[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/Plowester1/gta6-01-v1/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/Plowester1/gta6-01-v1/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

# SOLMARINA — a top-down open-world crime game

SOLMARINA is an original top-down open-world crime game set in Solmarina,
a sun-soaked coastal city. Explore six districts — Downtown, Beachfront,
Harbor, Old Town, Industrial and the Highway ring — on foot and by car.
Steal cars, outrun the police, and run six story missions for fixer
Mara Voss. Pure canvas JavaScript, no libraries, no network, no assets:
all art is drawn procedurally and all sound is synthesized with WebAudio.

## How to play

- **WASD / arrows** — walk and drive (S brakes, Space is the handbrake)
- **Shift** — run on foot
- **E** — enter or exit a car (stand next to one to steal it)
- **Space** — punch on foot
- **Mouse aim + click** — shoot the pistol (given in mission 2, ammo pickups after)
- **M** — mute, **Esc / P** — pause, **Enter** — start / retry

## Systems

- **Vehicles:** sedan, taxi, truck, sports car, van and police car, each
  with its own speed and handling. Cars take damage: smoke, then fire,
  then explosion if you keep crashing them.
- **Traffic:** AI cars drive the lanes, stop at red lights, brake for you
  and honk. Pedestrians walk the sidewalks and flee from gunshots and
  speeding cars.
- **Wanted level:** 1–5 stars. Steal a car, hit a pedestrian or shoot and
  it rises; police patrol cars chase and ram, foot cops pursue and bust
  you, roadblocks appear at 3+ stars. Lay low and it decays.
- **Missions:** six jobs from Mara Voss — steal wheels, a harbor pickup,
  a tail job, a police escape, a timed delivery and a final shootout.
  Each pays cash and shows its marker on the map and the minimap.
- **HUD:** cash, wanted stars, health, minimap with player / mission /
  police blips, mission objective, speedometer, clock.
- **Save:** cash, missions, position and car are saved to localStorage
  automatically; press C on the title screen to continue.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — or open game/index.html directly in a
desktop browser. No build step, no network needed.

## Screenshots

1-chase.jpg — a police chase in a sports car (wanted 3 stars).
2-street.jpg — on foot in Downtown among traffic and pedestrians.
3-mission.jpg — a Harbor mission in progress.
4-city.jpg — a wide view of Solmarina, beach and waterfront.

Built by an AI agent for the make.fun open-world bounty.
