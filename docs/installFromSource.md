# Install from source

Follow these steps to install Stardown using the source code. If you also want to change Stardown's code, instead follow the directions in [Installing Stardown from source for development](./devInstallFromSource.md).

## Chrome and Edge

1. in a terminal, run `git clone https://github.com/Stardown-app/Stardown.git && cd Stardown`
2. then run `npm run build-chrome`
3. in your browser, open `chrome://extensions/`
4. turn on developer mode
5. click "Load unpacked"
6. select Stardown's `chrome` folder

To get updates:

1. run `npm run update-chrome`
2. in your browser, open `chrome://extensions/`
3. click Stardown's reload button

## Firefox

1. in a terminal, run `git clone https://github.com/Stardown-app/Stardown.git && cd Stardown`
2. then `npm run build-firefox`
3. in Firefox, open `about:debugging#/runtime/this-firefox`
4. click "Load Temporary Add-on..."
5. select Stardown's `firefox/manifest.json` file

To get updates:

1. run `npm run update-firefox`
2. in Firefox, open `about:debugging#/runtime/this-firefox`
3. click Stardown's reload button
