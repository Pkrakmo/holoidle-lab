# Holoidle Lab

An experimental, community made browser tool for exploring Holoidle collab card layouts and reviewing assets from a local save file. It is not affiliated with, endorsed by, or sponsored by Holoidle or its creators.

## Published site

[Open Holoidle Lab](https://pkrakmo.github.io/holoidle-lab/).

## Features

- Arrange up to eight collab cards on a 2 × 4 board and inspect directional effects.
- Search cards by name, group, effect, or affected asset. Asset names are translated to the dashboard's canonical names.
- Simulate foil cards and filter the collection by ownership after importing a save.
- Apply imported Holoscope group, direction, and Add bonuses to card effects.
- Review Holoscope power, saved star ranks, and effective ranks in a dedicated view.
- Import a `save.holo` file or plaintext JSON to view equipped cards, ownership, and the Assets dashboard. The file is read in the browser and is not uploaded or modified; you can optionally remember the parsed save in this browser.
- Keep the current board and foil selections in this browser's local storage.
- Load saved card layouts from an imported `save.holo` file, alongside named presets saved in this browser.
- Copy and load versioned text codes that share board placements and foil selections.
- Optionally restore an imported save from this browser's local storage, or forget its saved copy.
- Search owned cards for a high-scoring, loop-free board layout using estimated added IpS, including asset and card Holoscope bonuses.
- View completed Encores and Steam-linked achievement progress recorded in the imported save.
- Search and filter all 74 achievements, with current-versus-goal counts derived from save fields and goal text from the game definitions.
- Manage save imports, on-device storage, and save-file location details from the dedicated Save page.

## Run locally

Requires Node.js and npm.

```sh
npm install
npm run dev
```

Open the local address printed by Vite. To create and preview a static build:

```sh
npm run build
npm run preview
```

For a GitHub Pages project site, set the URL prefix when building:

```sh
VITE_BASE_PATH=/repository-name/ npm run build
```

## Limitations

This project is experimental and a work in progress. Its calculations are estimates and may not cover every game rule or save format. For example, player unlock restrictions are not checked, Holoscope card bonuses require an imported save, and the Assets dashboard excludes collab-card asset bonuses, daily-mission multipliers, and Overdrive.

## AI disclaimer

AI tools may have been used to help write or edit parts of this project and its documentation. AI-assisted content and calculations can contain mistakes or omissions. Verify important results against Holoidle itself; this tool is an unofficial aid, not an authoritative source.
