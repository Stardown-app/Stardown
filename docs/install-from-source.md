# Install from source

Follow these steps to install Stardown using the source code. If you might also want to change your copy of Stardown's code, instead follow the directions in [Installing Stardown from source for development](./dev-install-from-source.md).

## Chrome, Edge, Arc, Brave, Vivaldi, Opera

1. download Stardown's code in either of these two ways:
   - [download the zip file](https://github.com/Stardown-app/Stardown/archive/refs/heads/main.zip) and unzip it
   - in a terminal, run `git clone https://github.com/Stardown-app/Stardown.git`
2. in a terminal, navigate into Stardown's folder
3. then run `npm run build-chrome`
4. in your browser, open `chrome://extensions/`
5. turn on developer mode
6. click "Load unpacked"
7. select Stardown's `chrome` folder

To get updates:

1. in Stardown's folder, run `npm run update-chrome`
2. in your browser, open `chrome://extensions/`
3. click Stardown's reload button

## Firefox

1. download Stardown's code in either of these two ways:
   - [download the zip file](https://github.com/Stardown-app/Stardown/archive/refs/heads/main.zip) and unzip it
   - in a terminal, run `git clone https://github.com/Stardown-app/Stardown.git`
2. in a terminal, navigate into Stardown's folder
3. then run `npm run build-firefox`
4. in Firefox, open `about:debugging#/runtime/this-firefox`
5. click "Load Temporary Add-on..."
6. select Stardown's `firefox/manifest.json` file

To get updates:

1. in Stardown's folder, run `npm run update-firefox`
2. in Firefox, open `about:debugging#/runtime/this-firefox`
3. click Stardown's reload button
