# Stardown development

I wrote some general extension development tips in [Making browser extensions](https://til.chriswheeler.dev/making-browser-extensions/).

## Priorities

To keep Stardown easy to use, I would like to avoid having a popup and to generally have only one context menu option visible at a time. The options page can have many options as long as they are well organized and useful. Stardown's output to the clipboard should render well on at least Obsidian and GitHub, if not also other markdown renderers like VS Code and Discord.

I would like to keep Stardown relatively simple so that it's reliable, has few bugs that get fixed quickly, and is easy to maintain.

## Installing Stardown from source for development

### Chrome and Edge

1. in a terminal, run `git clone https://github.com/wheelercj/Stardown.git && cd Stardown`
2. then run `npm install && npm run dev-chrome`
3. in your browser, open `chrome://extensions/`
4. turn on developer mode
5. click "Load unpacked"
6. select Stardown's `chrome` folder

In the `chrome` folder, don't make any changes unless they're to `config.js` or `manifest.json` because the other files get overwritten or deleted each time `npm run dev-chrome` runs.

To update Stardown after you make changes or you `git pull` changes:

1. run `npm run dev-chrome`
2. in your browser, open `chrome://extensions/`
3. click Stardown's reload button

### Firefox

1. in a terminal, run `git clone https://github.com/wheelercj/Stardown.git && cd Stardown`
2. then run `npm install && npm run dev-firefox`
3. in Firefox, open `about:debugging#/runtime/this-firefox`
4. click "Load Temporary Add-on..."
5. select Stardown's `firefox/manifest.json` file

In the `firefox` folder, don't make any changes unless they're to `config.js` or `manifest.json` because the other files get overwritten or deleted each time `npm run dev-firefox` runs.

To update Stardown after you make changes or you `git pull` changes:

1. run `npm run dev-firefox`
2. in Firefox, open `about:debugging#/runtime/this-firefox`
3. click Stardown's reload button

## Git workflow for collaboration

Let's create feature branches with descriptive names and make pull requests as described in [Getting started with Git and GitHub](https://chriswheeler.dev/posts/getting-started-with-git-and-github/#git-workflows).

## How Stardown works

1. The user interacts with the extension by clicking the icon or choosing a context menu option. This interaction is received in the background script.
2. The background script gets some data about the interaction, may process the data a little, and then sends it to the content script.
3. The content script does most or all of the data processing needed, writes markdown to the clipboard, and sends the background script some info about whether it succeeded and what to tell the user.
4. The background script tells the user whether all of this succeeded by showing a green check (✓) for success or a red X (✗) for failure on the extension's icon, and possibly a system notification. (Any error and warning notifications are always shown, and success notifications are shown if the user chose that in settings.)

The "background script" in Chromium is not exactly a background script, but a service worker, unlike in Firefox. This affects how the file name must be declared in the manifest and what variables and functions are available in certain places. For example, [Chromium's service workers don't allow access to the clipboard API](https://stackoverflow.com/questions/61862872/how-to-copy-web-notification-content-to-clipboard/61977696#61977696) unlike Firefox's background scripts. Stardown uses the clipboard API only in content scripts so that it can use the same code for both Chromium and Firefox. Safari supports both background scripts and service workers.

### Message passing

[Message passing](https://developer.chrome.com/docs/extensions/develop/concepts/messaging) allows the background and content scripts to communicate with each other. Most of Stardown's message passing is done between the `browser.contextMenus.onClicked` listener in `background.js` and the `browser.runtime.onMessage` listener in `content.js`.

In Stardown, every user interaction (except on the options page) sends a request from the background to the content, which returns a response to the background. You can think of it like client-server architecture where Stardown is the client and the website is the server. Every request must have a `category` property and may optionally have other properties. Every response is an object with the properties `status`, `notifTitle`, and `notifBody`.

- `status`: the number of markdown items successfully created and written to the clipboard. Zero means failure, and one or above means success.
- `notifTitle`: the title of the notification to show to the user.
- `notifBody`: the body of the notification to show to the user.

## What Stardown does

When fully testing Stardown, use the descriptions in this section in each of the officially supported browsers to search for bugs.

### Context types

- **selection**: anything that the user has selected by clicking and dragging with their mouse.
- **link**: any clickable link on a page. However, for a link that is also an image, Stardown should show only the image copy option.
- **image**: types supported include png, jpg, svg, webp, gif, and base64-encoded. Types not supported include background images, `canvas` HTML elements, inline `svg` HTML elements, and sometimes images within `a` HTML elements for some reason.
- **video**: a video rendered with the `video` HTML element, such as YouTube videos and mp4 files hosted by GitHub ([example on this page](https://github.com/wheelercj/zq)). This option doesn't appear for some video sites like [Vimeo](https://player.vimeo.com/video/55073825) probably because their `video` HTML element is buried under many other things, and [Asciinema](https://asciinema.org/) because they don't use the `video` HTML element.
  - Markdown of YouTube videos is expected to render well in Obsidian and Discord, but not GitHub or VS Code.
  - Markdown of GitHub mp4s is expected to render well only in GitHub.
- **audio**: an audio player rendered with the `audio` HTML element. Some good examples are the first two audio players on [New Audio HTML Element: Master It Out Now With Our Code Example »](https://html.com/tags/audio/).

### Features

- [ ] **Clicking the icon** copies a markdown link for the page.
- [ ] **Double-clicking the icon** copies a markdown unordered list of markdown links for all open tabs.
- [ ] **Selecting tabs, then double-clicking the icon** copies a markdown unordered list of markdown links for all selected tabs.
- [ ] **Right-clicking an empty part of a page** shows the "Copy markdown link to here" option.
- [ ] **Right-clicking a website's unselected header** shows the "Copy markdown link to here" option.
- [ ] **Right-clicking selected text** shows the "Copy markdown of selection" option.
- [ ] **Right-clicking an unselected image** shows the "Copy markdown of image" option.
- [ ] **Selecting text, then right-clicking an unselected image** shows the "Copy markdown of image" option, but may or may not also show the "Copy markdown of selection" option.
- [ ] **Selecting text and image(s), then right-clicking the selected text** shows the "Copy markdown of selection" option.
- [ ] **Selecting text and image(s), then right-clicking a selected image** shows the "Copy markdown of selection" option, and may or may not also show the "Copy markdown of image" option.
- [ ] **Right-clicking a link that is not an image** shows the "Copy markdown of link" option.
- [ ] **Right-clicking a link that is an image** might not show any context menu options due to browser limitations. If a context menu option appears, it should be "Copy markdown of image".
- [ ] **Right-clicking a video** shows the "Copy markdown of video" option, but may require a second right-click for the correct context menu to appear because some videos (e.g. YouTube videos) have a special context menu.
- [ ] **Right-clicking an audio player** shows the "Copy markdown of audio" option.
- [ ] "Copy markdown link to here" copies a markdown link for the page with an HTML element ID from where the page was right-clicked, if one exists there.
- [ ] "Copy markdown of selection", by default, copies a markdown block quote of the selected text and a markdown link containing a text fragment and possibly an HTML element ID. The quote may or may not include the alt text of the selected images.
- [ ] "Copy markdown of image" copies markdown of the image using the image's URL and any alt text.
- [ ] "Copy markdown of link" copies markdown of the link, using the same title and URL as the link in the page (except for any character escapes or encodings).
- [ ] "Copy markdown of video" copies markdown of the video using the video source's URL.
- [ ] "Copy markdown of audio" copies a markdown link to either an audio file or a site that plays the audio.
- [ ] **Change settings and repeat as necessary**

### Errors and warnings

When something goes wrong, Stardown should still respond well.

#### Text fragment timeout

1. Go to https://markdownguide.offshoot.io/basic-syntax/#blockquotes-1
2. Select the text "rendered output" (this phrase appears 32 times on this somewhat long page)
3. Right-click the selection and choose "Copy markdown of selection"
4. After several seconds:
  - Stardown's icon should display a green check (✓) to indicate success.
  - A system notification should appear that says "Warning" and explains that the fragment generator timed out.
  - The clipboard should now have a markdown link without a text fragment.

## Some differences between Chromium and Firefox

- [Chromium does not allow use of the clipboard API in the background](https://stackoverflow.com/questions/61862872/how-to-copy-web-notification-content-to-clipboard/61977696#61977696).
- In Firefox, [Manifest V3 extensions with low privilege activeTab shows annoying blue dot for all websites](https://bugzilla.mozilla.org/show_bug.cgi?id=1851083). This is why I changed the Firefox version of Stardown from manifest v3 to v2.
- Although Stardown no longer uses Firefox's manifest v3, [Firefox does not support service_worker in manifest v3](https://stackoverflow.com/questions/75043889/manifest-v3-background-scripts-service-worker-on-firefox).
- Firefox [sometimes requires an add-on ID](https://extensionworkshop.com/documentation/develop/extensions-and-the-add-on-id/) in `browser_specific_settings` in manifest.json, but Chromium doesn't allow `browser_specific_settings`.
- Based on testing I took notes on in [#11](https://github.com/wheelercj/Stardown/issues/11), it appears Firefox manifest v2 does not allow use of the `import` and `export` keywords, and Chrome manifest v3 does not allow their use in content scripts. That's why Stardown requires using a bundler.

## Text fragments

Text fragments and how to generate them is explained in [this web.dev article](https://web.dev/articles/text-fragments#programmatic_text_fragment_link_generation). The article mentions [a minified version of the text fragment generation code](https://unpkg.com/text-fragments-polyfill@5.7.0/dist/fragment-generation-utils.js), but Stardown doesn't use the minified version because extension stores need to be able to review the code and minifying code doesn't really help extensions.

Stardown's text fragment generation code, which was almost entirely written by Google, is in the files named `text-fragment-utils.js` and `fragment-generation-utils.js`. They probably should not be changed for anything except fixing bugs or updating to new versions of text fragments.

Stardown also tries to find HTML element IDs to put in links alongside text fragments because if the website ever changes and makes the text fragment outdated, the browser will use the HTML element ID as a fallback.
