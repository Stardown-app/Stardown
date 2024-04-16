<h1 align="center"><img width="35" alt="Stardown's icon" src="firefox/images/icon.svg"> Stardown</h1>

<p align="center">A browser extension that copies a markdown link for the current page.</p>

<p align="center">
    <a href="https://addons.mozilla.org/en-US/firefox/addon/stardown/"><img alt="Firefox badge" src="https://img.shields.io/badge/Firefox-black.svg?logo=firefoxbrowser&style=for-the-badge"></a>
    <a href="https://chrome.google.com/webstore/detail/clicknohlhfdlfjfkaeongkbdgbmkbhb"><img alt="Chrome badge" src="https://img.shields.io/badge/Chrome-black.svg?logo=googlechrome&style=for-the-badge&logoColor=238d41"></a>
    <a href="https://microsoftedge.microsoft.com/addons/detail/stardown/apolhpopcbbillkbfkmdibedlgjffckf"><img alt="Edge badge" src="https://img.shields.io/badge/Edge-black.svg?logo=microsoftedge&style=for-the-badge&logoColor=33b9ab"></a>
    <!-- <a><img alt="Safari badge" src="https://img.shields.io/badge/Safari-black.svg?logo=safari&style=for-the-badge&logoColor=188ff3"></a> -->
</p>

<p align="center"><img alt="demo gif" src="https://github.com/wheelercj/assets/blob/main/Stardown.gif"></p>

After installing, there are multiple ways you can copy markdown links:

* click the extension's icon
* press `Ctrl+Shift+U` (Mac: `Cmd+Shift+U`), or whichever keyboard shortcut you prefer in your browser's settings
* double-click the extension's icon to copy links for all tabs, or press `Ctrl+Shift+UU` (Mac: `Cmd+Shift+UU`)
* select tabs before double-clicking the icon to copy links for only those tabs
* right-click where you want to link to and choose "Copy markdown link to here"
* select text before using the right-click option to create a link with a [text fragment](https://web.dev/articles/text-fragments)

Stardown's right-click option only adds a text fragment if you have selected text, but always tries to find an `id` attribute in the HTML elements you right-clicked so you can still link to specific parts of pages without text fragments. [Firefox does not support text fragments yet](https://bugzilla.mozilla.org/show_bug.cgi?id=1753933), but the Firefox version of Stardown allows you to create links with text fragments.

## privacy

Stardown will never sell any data to anyone, and does not collect nor send any of your data anywhere besides putting markdown text into your clipboard.

In Chrome and Edge, if you use Stardown's feature that copies links for multiple tabs simultaneously, the first time you do, Stardown will request to "read your browsing history" because that's the only way for Chrome and Edge extensions to see the titles and URLs of all tabs ([source](https://developer.chrome.com/docs/extensions/reference/permissions-list#gc-wrapper:~:text=Warning%20displayed%3A-,read%20your%20browsing%20history.,-%22topSites%22)). Granting this permission does NOT give access to existing browsing history; the request message only sounds like it does because malicious extensions that can see the titles and URLs of all tabs could start manually gathering your browsing activity. The permission can be revoked at any time. The Firefox version of Stardown requests the exact same permission but has a less misleading request message. Other Chrome and Edge browser extensions that request immediate and complete access to browsing history, unlike Stardown, use the request message "read and change your browsing history on all signed-in devices".

## settings

To open Stardown's options page, right-click the extension's icon and choose:

* Firefox: "Manange extension" and then "Options"
* Chrome: "Options"
* Edge: "Extension options"

### How to change the keyboard shortcut

* [Firefox](https://support.mozilla.org/en-US/kb/manage-extension-shortcuts-firefox)
* Chrome: `chrome://extensions/shortcuts`
* Edge: `edge://extensions/shortcuts`

## troubleshooting

### The right-click option doesn't always create links for specific parts of pages

Stardown looks for an HTML element ID where you right-clicked, but some parts of websites don't have any IDs. If there is no HTML element ID where you right-click and you don't select text before right-clicking, the link Stardown creates will be for the entire page, not for the part of the page where you right-clicked. Most websites assign an ID to each section title.

### The right-click option disappeared

This is an occasionally reoccuring bug in browsers. Reinstalling Stardown should fix it.

### Stardown displayed a red X and didn't do anything

This may happen if the current website is not focused, such as if you just clicked the bookmarks sidebar. In this case, click the page and try again.

Another possibility is that some websites limit what extensions can do and may prevent Stardown from working. A few examples are the Chrome Web Store and Chrome pages that start with `chrome://`. Fortunately, very few websites do this and it doesn't prevent Stardown from copying links for multiple tabs simultaneously if the current tab is not one of those limiting websites.

### Something else is wrong

If reinstalling Stardown doesn't fix it and [the issues page](https://github.com/wheelercj/Stardown/issues) doesn't have an issue for it yet, please make a new issue.

## feature requests

You're welcome to [make a feature request](https://github.com/wheelercj/Stardown/issues), and there may already be another browser extension that meets all your needs. I am not affiliated with any of the below extensions and have not tried all of them. Use them at your own risk.

### Copy links in other formats besides markdown

* [url2clipboard](https://github.com/asamuzaK/url2clipboard) supports HTML, Markdown, BBCode, Textile, AsciiDoc, MediaWiki, Jira, reStructuredText, LaTeX, Org Mode, and text.
* [TabCopy](https://chromewebstore.google.com/detail/tabcopy/micdllihgoppmejpecmkilggmaagfdmb) might only be on the Chrome Web Store, but supports many formats including HTML, Markdown, BBCode, CSV, and JSON, and lets you create custom link formats.

### Copy just the titles or just the URLs for all tabs

* [copy-as-markdown](https://github.com/yorkxin/copy-as-markdown)

### Copy a website's content as markdown

* [MarkDownload](https://github.com/deathau/markdownload) was developed by an Obsidian community moderator.
* [copy-selection-as-markdown](https://github.com/0x6b/copy-selection-as-markdown) is only available for Firefox but may work manually installed in Chromium browsers.

### Copy just a URL with a text fragment

* [link-to-text-fragment](https://github.com/GoogleChromeLabs/link-to-text-fragment) was made by Google itself but is cross-browser.

### Save a page for research

* [Zotero](https://www.zotero.org/)

### Why use Stardown?

Unlike the extensions linked above, Stardown:

* can create markdown links for specific parts of pages (using [text fragments](https://web.dev/articles/text-fragments) and/or HTML element IDs)
* requires only one click to create a markdown link for the current page
* is focused on just the most important features so it's more likely to be maintained and bug-free

## development

There are different versions of Stardown for Firefox and the Chromium browsers because of bugs or limitations in them:

* Since [Chromium does not support the Clipboard API in background scripts](https://stackoverflow.com/questions/61862872/how-to-copy-web-notification-content-to-clipboard/61977696#61977696), the Chromium version of Stardown also requires the `scripting` permission so it can run a script that puts text in the clipboard.
* In Firefox, [Manifest V3 extensions with low privilege activeTab shows annoying blue dot for all websites](https://bugzilla.mozilla.org/show_bug.cgi?id=1851083). This is why I changed the Firefox version of Stardown from manifest v3 to v2.
* Although Stardown no longer uses Firefox's manifest v3, [Firefox does not support service_worker in manifest v3](https://stackoverflow.com/questions/75043889/manifest-v3-background-scripts-service-worker-on-firefox).
* Firefox [sometimes requires an add-on ID](https://extensionworkshop.com/documentation/develop/extensions-and-the-add-on-id/) in `browser_specific_settings` in manifest.json, but Chromium doesn't allow `browser_specific_settings`.

### text fragments

Text fragments and how to generate them is explained in [this web.dev article](https://web.dev/articles/text-fragments#programmatic_text_fragment_link_generation). The article mentions [a minified version of the text fragment generation code](https://unpkg.com/text-fragments-polyfill@5.7.0/dist/fragment-generation-utils.js), but Stardown doesn't use the minified version because extension stores need to be able to review the code and minifying code doesn't really help extensions.
