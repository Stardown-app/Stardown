<h1 align="center"><img width="35" alt="Stardown's icon" src="firefox/images/icon.svg"> Stardown</h1>

<p align="center">A browser extension that copies a markdown link for the current page.</p>

<p align="center">
    <a href="https://addons.mozilla.org/en-US/firefox/addon/stardown/"><img alt="Firefox badge" src="https://img.shields.io/badge/Firefox-black.svg?logo=firefoxbrowser&style=for-the-badge"></a>
    <a href="https://chrome.google.com/webstore/detail/clicknohlhfdlfjfkaeongkbdgbmkbhb"><img alt="Chrome badge" src="https://img.shields.io/badge/Chrome-black.svg?logo=googlechrome&style=for-the-badge&logoColor=238d41"></a>
    <a href="https://microsoftedge.microsoft.com/addons/detail/stardown/apolhpopcbbillkbfkmdibedlgjffckf"><img alt="Edge badge" src="https://img.shields.io/badge/Edge-black.svg?logo=microsoftedge&style=for-the-badge&logoColor=33b9ab"></a>
    <!-- <a><img alt="Safari badge" src="https://img.shields.io/badge/Safari-black.svg?logo=safari&style=for-the-badge&logoColor=188ff3"></a> -->
</p>

<p align="center"><img alt="demo gif" src="https://github.com/wheelercj/assets/blob/main/Stardown.gif"></p>

After installing, there are multiple ways you can copy markdown:

* **click the extension's icon** to copy a link for the current page, or press `Ctrl+Shift+U` (Mac: `Cmd+Shift+U`) or whichever keyboard shortcut you prefer in your browser's settings
* **double-click the extension's icon** to copy links for all tabs, or press `Ctrl+Shift+UU` (Mac: `Cmd+Shift+UU`)
* **select tabs before double-clicking the icon** to copy links for only those tabs
* **right-click part of a page and choose Stardown's copy option** that changes depending on what you right-clicked
* **select text before right-clicking** to create a link with a [text fragment](https://web.dev/articles/text-fragments)

Stardown's "Copy markdown link to here" right-click option tries to find an `id` attribute in the HTML elements you right-clicked so you can still link to specific parts of pages even without text fragments. [Firefox does not support text fragments yet](https://bugzilla.mozilla.org/show_bug.cgi?id=1753933), but the Firefox version of Stardown allows you to create links with text fragments.

[How I use Stardown](https://chriswheeler.dev/posts/stardown-v1/)

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

You're welcome to [make a feature request](https://github.com/wheelercj/Stardown/issues/new?assignees=&labels=enhancement&projects=&template=feature_request.md&title=), and there may already be another browser extension that meets all your needs. I am not affiliated with any of the below extensions and have not tried all of them. Use them at your own risk.

### Copy links in other formats besides markdown

* [url2clipboard](https://github.com/asamuzaK/url2clipboard) supports HTML, Markdown, BBCode, Textile, AsciiDoc, MediaWiki, Jira, reStructuredText, LaTeX, Org Mode, and text.
* [TabCopy](https://chromewebstore.google.com/detail/tabcopy/micdllihgoppmejpecmkilggmaagfdmb) might only be on the Chrome Web Store, but supports many formats including HTML, Markdown, BBCode, CSV, and JSON, and lets you create custom link formats.

### Copy just the titles or just the URLs of all tabs

* [copy-as-markdown](https://github.com/yorkxin/copy-as-markdown)

### Copy markdown of an entire page

* [MarkDownload](https://github.com/deathau/markdownload) was developed by an Obsidian community moderator.
* [Obsidian Web Clipper Bookmarklet](https://gist.github.com/kepano/90c05f162c37cf730abb8ff027987ca3) is a bookmarklet for saving articles and pages from the web to Obsidian.

### Copy just a URL with a text fragment

* [link-to-text-fragment](https://github.com/GoogleChromeLabs/link-to-text-fragment) was made by Google itself but is cross-browser.

### Save a page for research

* [Zotero](https://www.zotero.org/)

### Why use Stardown?

Unlike the extensions linked above, Stardown:

* can create markdown links for specific parts of pages (using [text fragments](https://web.dev/articles/text-fragments) and/or HTML element IDs)
* requires only one click to create a markdown link for the current page
* is focused on just the most important features so it's more likely to be maintained and bug-free

## Development

Contributions are welcome! Let me know (such as in [an issue](https://github.com/wheelercj/Stardown/issues) or [a discussion](https://github.com/wheelercj/Stardown/discussions)) what you have in mind ahead of time if you think there's a chance it won't be approved.

Also, please read [docs/develop.md](docs/develop.md).
