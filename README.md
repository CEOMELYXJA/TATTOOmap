# TATTOOmap — An interactive spatial tattoo archive

TATTOOmap is a Three.js world built around Melisa Fortin's tattoo portfolio. Explore a forest, a botanical garden and a mystical twilight landscape. Select a motif to see its source photograph and verified catalogue information.

## Current world

The world features 27 photographs identified as tattoos in the media uploaded in 2026, 31 uploaded in 2025 and the first 15 uploaded in 2024. Each is associated with an animated, three-dimensional interpretation and its source photograph. These are stylized artistic interpretations, not automatic reconstructions. Dates in the inventory refer to uploads and do not establish when the tattoos were made. The catalogue and original files are preserved so the world can grow as more works are modelled.

The reviewed inventory includes 125 Wix media files uploaded in 2025–2026 and 47 uploaded in 2024. Among the 2024 media, 44 photographs were identified as showing tattoos. Visual review identified 58 photographs showing tattoos and 67 other media files. These counts refer to files, not necessarily distinct works. Upload dates do not establish when a tattoo was made. See the [visual review](docs/examen-visuel-catalogue-wix.md) and its [CSV](docs/catalogue-wix-examen-visuel-2025-2026.csv) for the individual records and limitations.

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
| Escape | Release the pointer or close a dialog |
| Map or tattoo list | Choose a destination |

On touch devices, use the joystick and drag on the scene to look around. The photo list is also available if WebGL cannot be started.

## Catalogue

The 73 works use entries from `assets/tattoos.js`. The [modelling inventory](docs/suivi-modelisation.csv) connects each of the 102 reviewed tattoo photographs with its identifier, source image, motifs and current status. `IMPORTER_TOUTES_IMAGES_WIX_2025_2026.json`, `assets/gallery.js` and `assets/wix_2025_2026.js` preserve the earlier catalogue data. Photos stay on their existing Wix URLs.

The CSV converter in `outils/csv_vers_json.py` can create JSON from a CSV following `outils/gabarit_portfolio.csv` for future catalogue work.

## Project files

- `index.html` is the application entry point for GitHub Pages.
- `02_peaufine/app.js` contains the world and interactions.
- `02_peaufine/motifs.js` and related modules create and animate the 3D motifs.
- `assets/tattoos.js` associates reviewed photographs, descriptions and motif types.
- `docs/prototype-transformation.md` records prototype evidence and remaining limitations.
- `01_prototype/` retains the earlier prototype.
- `LANCER_WINDOWS.bat` and `outils/lancer_windows.py` launch the local Windows server.

## Validation and limitations

The earlier four-work prototype was checked in automated Chrome on Windows. The 2026 expansion was not tested, as requested. Earlier screenshot evidence and visual limitations are recorded in the prototype report. Browser performance depends on the device and graphics acceleration. Touch navigation remains experimental, and the stylized models can be refined to match the original tattoos more closely.
