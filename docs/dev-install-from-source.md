# Installing Stardown from source for development

## Chrome, Edge, Arc, Brave, Vivaldi, Opera

1. in a terminal, run `git clone https://github.com/Stardown-app/Stardown.git && cd Stardown`
2. then run `npm install && npm run dev-chrome`
3. in your browser, open `chrome://extensions/`
4. turn on developer mode
5. click "Load unpacked"
6. select Stardown's `chrome` folder

In the `chrome` folder, don't make any changes unless they're to `browserSpecific.js` or `manifest.json` because the other files get overwritten or deleted each time `npm run dev-chrome` runs.

To update Stardown after you make changes or you `git pull` changes:

1. in Stardown's folder, run `npm run dev-chrome`
2. in your browser, open `chrome://extensions/`
3. click Stardown's reload button

## Firefox

1. in a terminal, run `git clone https://github.com/Stardown-app/Stardown.git && cd Stardown`
2. then run `npm install && npm run dev-firefox`
3. in Firefox, open `about:debugging#/runtime/this-firefox`
4. click "Load Temporary Add-on..."
5. select Stardown's `firefox/manifest.json` file

In the `firefox` folder, don't make any changes unless they're to `browserSpecific.js` or `manifest.json` because the other files get overwritten or deleted each time `npm run dev-firefox` runs.

To update Stardown after you make changes or you `git pull` changes:

1. in Stardown's folder, run `npm run dev-firefox`
2. in Firefox, open `about:debugging#/runtime/this-firefox`
3. click Stardown's reload button
