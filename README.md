<h1 align="center"><img width="35" alt="Stardown's icon" src="src/images/icon.svg"> Stardown</h1>

<p align="center">Copy the web as markdown</p>

<p align="center">
    <a href="https://addons.mozilla.org/en-US/firefox/addon/stardown/"><img alt="Firefox badge" src="https://img.shields.io/badge/Firefox-black.svg?logo=firefoxbrowser&style=for-the-badge"></a>
    <a href="https://chrome.google.com/webstore/detail/clicknohlhfdlfjfkaeongkbdgbmkbhb"><img alt="Chrome badge" src="https://img.shields.io/badge/Chrome-black.svg?logo=googlechrome&style=for-the-badge&logoColor=238d41"></a>
    <a href="https://microsoftedge.microsoft.com/addons/detail/stardown/apolhpopcbbillkbfkmdibedlgjffckf"><img alt="Edge badge" src="https://img.shields.io/badge/Edge-black.svg?logo=microsoftedge&style=for-the-badge&logoColor=33b9ab"></a>
    <!-- <a><img alt="Safari badge" src="https://img.shields.io/badge/Safari-black.svg?logo=safari&style=for-the-badge&logoColor=188ff3"></a> -->
</p>
<p align="center">
    You can also
    <a href="#install-from-source">
        install from the source code</a>
    to get updates early.
</p>

<p align="center"><img alt="demo gif" src="https://github.com/wheelercj/assets/blob/main/Stardown.gif"></p>

* Click the extension's icon to copy a link for the current page.
* Right-click part of a page to copy it as markdown. Select before right-clicking to copy multiple parts.
* Double-click the extension's icon to copy links for all tabs.
* Select tabs before double-clicking the icon to copy links for only those tabs.
* Press `Ctrl+Shift+U` (Mac: `Cmd+Shift+U`) to copy a page's link or selection.
* Use [the options page](#settings) to customize these features.

By default, the markdown created from a selection includes a link that navigates to the part of the page you selected, when possible. This is accomplished with [text fragments](https://web.dev/articles/text-fragments) and/or HTML element IDs. [Firefox does not support text fragments yet](https://bugzilla.mozilla.org/show_bug.cgi?id=1753933), but the Firefox version of Stardown allows you to create links with text fragments.

<!--
Stardown is free except that if you get it from Apple's App Store, there is a small fee to help cover the $99 USD per year cost I'm paying to keep Stardown available in the App Store.
-->

Want to just copy markdown links for pages without installing an extension? You can use this [bookmarklet](https://en.wikipedia.org/wiki/Bookmarklet) instead: `javascript: navigator.clipboard.writeText('[' + document.title + '](' + location.href + ')');`

## Privacy

Stardown will never sell any data to anyone, and does not collect nor send any of your data anywhere besides putting markdown text into your clipboard.

Stardown requires permission to display notifications so it can show you important error messages.

In Chrome and Edge, if you use Stardown's feature that copies links for multiple tabs simultaneously, the first time you do, Stardown will request to "read your browsing history" because that's the only way for Chrome and Edge extensions to see the titles and URLs of all tabs ([source](https://developer.chrome.com/docs/extensions/reference/permissions-list#gc-wrapper:~:text=Warning%20displayed%3A-,read%20your%20browsing%20history.,-%22topSites%22)). Granting this permission does NOT give access to existing browsing history; the request message only sounds like it does because malicious extensions that can see the titles and URLs of all tabs could start manually gathering your browsing activity. The permission can be revoked at any time. The Firefox version of Stardown requests the exact same permission but has a less misleading request message. Other Chrome and Edge browser extensions that request immediate and complete access to browsing history, unlike Stardown, use the request message "read and change your browsing history on all signed-in devices".

## Settings

To open Stardown's options page, right-click the extension's icon and choose:

* Firefox: "Manange extension" and then "Options"
* Chrome: "Options"
* Edge: "Extension options"

### How to change the keyboard shortcut

* [Firefox](https://support.mozilla.org/en-US/kb/manage-extension-shortcuts-firefox)
* Chrome: `chrome://extensions/shortcuts`
* Edge: `edge://extensions/shortcuts`

## Troubleshooting

### The right-click option copied a link for the entire page, not a specific part

Stardown looks for an HTML element ID where you right-clicked, but some parts of websites don't have any IDs. If there is no HTML element ID where you right-click and you don't select text before right-clicking, the link Stardown creates will be for the entire page, not for the part of the page where you right-clicked. Most websites assign an ID to each section title.

It's also not possible to link to text within [HTML iframes](https://www.w3schools.com/html/html_iframe.asp) because text fragments don't support iframes.

Lastly, a small number of sites allow creating text fragment links but don't allow using them.

### The right-click options disappeared

Due to browser limitations, Stardown's context menu options cannot appear for certain kinds of links, images, and videos. Specifically, they cannot appear for canvases, background images, inline SVGs, HTML anchors that contain both text and image(s), videos that don't have a `<video>` HTML element, and videos with a `<video>` HTML element that's covered by other elements.

Besides those possibilities, browsers have an occasionally reoccuring bug that makes the context menu options disappear. Reinstalling Stardown should fix this.

### Something else is wrong

If reinstalling Stardown doesn't fix it and [the issues page](https://github.com/wheelercj/Stardown/issues?q=is%3Aissue) doesn't have an issue for it yet, please make a new issue.

## Feature requests

You're welcome to [make a feature request](https://github.com/wheelercj/Stardown/issues/new?assignees=&labels=enhancement&projects=&template=feature_request.md&title=), and there may already be another browser extension that meets all of your needs. I am not affiliated with any of the below extensions and have not tried all of them; use them at your own risk.

### Download an entire page

Although Stardown can be used to copy an entire page's content as markdown all at once, other tools that specialize in that sometimes give better results.

* [MarkDownload](https://github.com/deathau/markdownload) was developed by an Obsidian community moderator.
* [Obsidian Web Clipper Bookmarklet](https://gist.github.com/kepano/90c05f162c37cf730abb8ff027987ca3) is a bookmarklet for saving web pages directly to Obsidian.
* [Omnivore](https://omnivore.app/) doesn't save pages as markdown but can export them as markdown.
* [Zotero](https://www.zotero.org/) doesn't save pages as markdown (at least by default), but is one of the best tools for research.

### Copy links in other formats besides markdown

* [url2clipboard](https://github.com/asamuzaK/url2clipboard) supports HTML, Markdown, BBCode, Textile, AsciiDoc, MediaWiki, Jira, reStructuredText, LaTeX, Org Mode, and text.
* [TabCopy](https://chromewebstore.google.com/detail/tabcopy/micdllihgoppmejpecmkilggmaagfdmb) might only be on the Chrome Web Store, but supports many formats including HTML, Markdown, BBCode, CSV, and JSON, and lets you create custom link formats.

### Copy just the titles or just the URLs of all tabs

* [Copy as Markdown](https://github.com/yorkxin/copy-as-markdown) is similar to Stardown but has a popup menu with different options, and different priorities in what markdown it generates.

### Copy just a URL with a text fragment

* [link-to-text-fragment](https://github.com/GoogleChromeLabs/link-to-text-fragment) was made by Google itself but is cross-browser.

### Why use Stardown?

Unlike the extensions linked above, Stardown:

* requires only one click to create a markdown link for the current page
* is good at creating markdown of tables
* can create markdown links for specific parts of pages (using [text fragments](https://web.dev/articles/text-fragments) and/or HTML element IDs)
* keeps almost all formatting when copying specific parts of pages
* can create markdown of YouTube videos that renders well in GitHub
* is focused on the most important features so it's more likely to be maintained and bug-free

## Install from source

Follow these steps to install Stardown using the source code. If you also want to change Stardown's code, instead follow the directions in [Installing Stardown from source for development](./docs/develop.md#installing-stardown-from-source-for-development).

### Chrome and Edge

1. in a terminal, run `git clone https://github.com/wheelercj/Stardown.git && cd Stardown`
2. then run `npm run build-chrome`
3. in your browser, open `chrome://extensions/`
4. turn on developer mode
5. click "Load unpacked"
6. select Stardown's `chrome` folder

To get updates:

1. run `npm run update-chrome`
2. in your browser, open `chrome://extensions/`
3. click Stardown's reload button

### Firefox

1. in a terminal, run `git clone https://github.com/wheelercj/Stardown.git && cd Stardown`
2. then `npm run build-firefox`
3. in Firefox, open `about:debugging#/runtime/this-firefox`
4. click "Load Temporary Add-on..."
5. select Stardown's `firefox/manifest.json` file

To get updates:

1. run `npm run update-firefox`
2. in Firefox, open `about:debugging#/runtime/this-firefox`
3. click Stardown's reload button

## Development

Contributions are welcome! Let me know (such as in [an issue](https://github.com/wheelercj/Stardown/issues) or [a discussion](https://github.com/wheelercj/Stardown/discussions)) what you have in mind ahead of time if you think there's a chance it won't be approved.

Also, please read [docs/develop.md](docs/develop.md).
