# TATTOOmap — An interactive spatial tattoo archive

TATTOOmap is a Three.js world built around Melisa Fortin's tattoo portfolio. Explore a forest, a botanical garden and a mystical twilight landscape. Select a motif to see its source photograph and verified catalogue information.

## Current prototype

Four identified tattoos are represented by animated, three-dimensional interpretations: a tiger with flowers, a red rose, a butterfly with flowers, and skulls with flames. These are artistic interpretations of the photographs, not automatic reconstructions. The catalogue and original files are preserved so the world can grow as more works are modelled.

The reviewed inventory contains 125 Wix media files uploaded in 2025–2026. Visual review identified 58 photographs showing tattoos and 67 other media files. These counts refer to files, not necessarily distinct works. Upload dates do not establish when a tattoo was made. See the [visual review](docs/examen-visuel-catalogue-wix.md) and its [CSV](docs/catalogue-wix-examen-visuel-2025-2026.csv) for the individual records and limitations.

## Open the application

Visit the [TATTOOmap website](https://ceomelyxja.github.io/TATTOOmap/). Internet access is required for Three.js and the photographs. A recent browser with WebGL is recommended. The interface remains in French.

To run locally on Windows, download the repository and double-click `LANCER_WINDOWS.bat`. Python 3 must be installed. The launcher starts a local server and opens the browser. Keep its console open while using the app and close it or press Ctrl+C to stop the server.

On macOS or Linux, run `python3 -m http.server 8765` in the repository root and open `http://127.0.0.1:8765/`.

## Controls

| Control | Action |
| --- | --- |
| W, A, S, D or arrow keys | Move |
| Mouse | Look around after entering the world |
| Shift | Run |
| E or click | Open the tattoo corresponding to a nearby motif |
| 1, 2, 3 | Travel between the landscapes |
| Escape | Release the pointer or close a dialog |
| Map or tattoo list | Choose a destination |

On touch devices, use the joystick and drag on the scene to look around. The photo list is also available if WebGL cannot be started.

## Catalogue and imports

The four modelled works use entries from `assets/tattoos.js`. `IMPORTER_TOUTES_IMAGES_WIX_2025_2026.json`, `assets/gallery.js` and `assets/wix_2025_2026.js` preserve the earlier catalogue data. Photos stay on their existing Wix URLs.

The import button stores a valid JSON catalogue locally in the current browser. Imported entries are preserved for future modelling and are not automatically displayed in the four-work prototype. The CSV converter in `outils/csv_vers_json.py` can create JSON from a CSV following `outils/gabarit_portfolio.csv`.

## Project files

- `index.html` is the application entry point for GitHub Pages.
- `02_peaufine/app.js` contains the world and interactions.
- `02_peaufine/motifs.js` and related modules create and animate the 3D motifs.
- `assets/tattoos.js` associates reviewed photographs, descriptions and motif types.
- `docs/prototype-transformation.md` records prototype evidence and remaining limitations.
- `01_prototype/` retains the earlier prototype.
- `LANCER_WINDOWS.bat` and `outils/lancer_windows.py` launch the local Windows server.

## Validation and limitations

The catalogue's four selected photographs and their interaction targets were checked in automated Chrome on Windows. Screenshot evidence and the current visual limitations are recorded in the prototype report. Browser performance depends on the device and graphics acceleration. Touch navigation remains experimental, and some details need further artistic modelling to match the original tattoos more closely.
