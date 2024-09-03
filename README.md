<h1 align="center"><img width="35" alt="Stardown's icon" src="src/images/icon.svg"> Stardown</h1>

<p align="center">Copy the web as markdown</p>

<p align="center">
    <a href="https://addons.mozilla.org/en-US/firefox/addon/stardown/"><img alt="Firefox badge" src="https://img.shields.io/badge/Firefox-black.svg?logo=firefoxbrowser&style=for-the-badge"></a>
    <a href="https://chrome.google.com/webstore/detail/clicknohlhfdlfjfkaeongkbdgbmkbhb"><img alt="Chrome badge" src="https://img.shields.io/badge/Chrome-black.svg?logo=googlechrome&style=for-the-badge&logoColor=238d41"></a>
    <a href="https://microsoftedge.microsoft.com/addons/detail/stardown/apolhpopcbbillkbfkmdibedlgjffckf"><img alt="Edge badge" src="https://img.shields.io/badge/Edge-black.svg?logo=microsoftedge&style=for-the-badge&logoColor=33b9ab"></a>
    <!-- <a><img alt="Safari badge" src="https://img.shields.io/badge/Safari-black.svg?logo=safari&style=for-the-badge&logoColor=188ff3"></a> -->
    <a href="https://chrome.google.com/webstore/detail/clicknohlhfdlfjfkaeongkbdgbmkbhb"><img alt="Arc badge" src="https://img.shields.io/badge/Arc-black.svg?logo=arc&style=for-the-badge"></a>
    <a href="https://chrome.google.com/webstore/detail/clicknohlhfdlfjfkaeongkbdgbmkbhb"><img alt="Brave badge" src="https://img.shields.io/badge/Brave-black.svg?logo=brave&style=for-the-badge"></a>
    <a href="https://chrome.google.com/webstore/detail/clicknohlhfdlfjfkaeongkbdgbmkbhb"><img alt="Vivaldi badge" src="https://img.shields.io/badge/Vivaldi-black.svg?logo=vivaldi&style=for-the-badge"></a>
    <a href="https://chrome.google.com/webstore/detail/clicknohlhfdlfjfkaeongkbdgbmkbhb"><img alt="Opera badge" src="https://img.shields.io/badge/Opera-black.svg?logo=opera&style=for-the-badge"></a>
</p>
<p align="center">
    You can also
    <a href="./docs/install-from-source.md">
        install from the source code</a>
    to get updates early or customize Stardown's output more than its settings support.
</p>

<p align="center"><img alt="demo gif" src="https://github.com/Stardown-app/assets/blob/main/Stardown.gif"></p>

* Click the extension's icon to copy a link for the current page.
* Press `Alt+C` to copy a selection or a page's link.
* Right-click part of a page to copy it as markdown. Select before right-clicking to copy multiple parts.
* Double-click the extension's icon or press `Alt+CC` to copy links for all tabs.
* Select tabs before double-clicking the icon to copy links for only those tabs.
* Use [the options page](#settings) to customize these features.

By default, the markdown created from a selection includes a link that navigates to the part of the page you selected, when possible. This is accomplished with [text fragments](https://web.dev/articles/text-fragments) and/or HTML element IDs. [Firefox does not support text fragments yet](https://bugzilla.mozilla.org/show_bug.cgi?id=1753933), but the Firefox version of Stardown allows you to create links with text fragments.

<!--
Stardown is free except that if you get it from Apple's App Store, there is a small fee to help cover the $99 USD per year cost I'm paying to keep Stardown available in the App Store.
-->

Want to just copy markdown links for pages without installing an extension? You can use this [bookmarklet](https://en.wikipedia.org/wiki/Bookmarklet) instead: `javascript: navigator.clipboard.writeText('[' + document.title + '](' + location.href + ')');`

## Privacy

Stardown will never sell any data to anyone, and does not collect nor send any of your personal data anywhere besides putting markdown text into your clipboard.

## Permissions

For why Stardown requests the permissions that it does, see [./docs/permissions.md](./docs/permissions.md).

## Settings

To open Stardown's options page, right-click the extension's icon and choose:

* Firefox: "Manange extension" and then "Options"
* Chrome, Edge, Arc, Brave, Vivaldi, or Opera: "Options" or "Extension options"

### How to change the keyboard shortcut

* [Firefox](https://support.mozilla.org/en-US/kb/manage-extension-shortcuts-firefox)
* Chrome, Edge, Arc, Brave, Vivaldi, or Opera: `chrome://extensions/shortcuts`

## Troubleshooting and reporting bugs

See [./docs/troubleshooting.md](./docs/troubleshooting.md)

## Install from source

See [./docs/install-from-source.md](./docs/install-from-source.md)

## Development

Contributions are welcome! Let me know (such as in [an issue](https://github.com/Stardown-app/Stardown/issues) or [a discussion](https://github.com/Stardown-app/Stardown/discussions)) what you have in mind ahead of time if you think there's a chance it won't be approved.

Also, please read [./docs/develop.md](docs/develop.md)

## Feature requests and alternatives

You're welcome to [make a feature request](https://github.com/Stardown-app/Stardown/issues/new?assignees=&labels=enhancement&projects=&template=feature_request.md&title=), and there may already be other software that meets all of your needs. I am not affiliated with any of the alternatives below and have not tried all of them; use them at your own risk.

### Download an entire web page

* [MarkDownload](https://github.com/deathau/markdownload) was developed by an Obsidian community moderator. While Stardown is great for copying *parts* of web pages as markdown, MarkDownload is better for downloading entire pages, especially if you want to download directly into Obsidian. I use both Stardown and MarkDownload.
* [Obsidian Web Clipper Bookmarklet](https://gist.github.com/kepano/90c05f162c37cf730abb8ff027987ca3) is a bookmarklet for saving web pages directly to Obsidian.
* [Slurp](https://github.com/inhumantsar/slurp) is an Obsidian community plugin and bookmarklet for saving web pages directly to Obsidian.
* [Omnivore](https://omnivore.app/) doesn't save pages as markdown but can export them as markdown.
* [Zotero](https://www.zotero.org/) doesn't save pages as markdown (at least by default), but is one of the best tools for research.

### Scrape websites

* [Firecrawl](https://github.com/mendableai/firecrawl) is an API and SDKs for scraping websites and saving them as markdown or structured data.

### Paste structured data

* [obsidian-ReadItLater](https://github.com/DominikPieper/obsidian-ReadItLater) is an Obsidian plugin that creates notes with specific structures from clipboard content based on where it was copied from.
* [Advanced Paste](https://learn.microsoft.com/en-us/windows/powertoys/advanced-paste) is a Windows-only [PowerToys](https://learn.microsoft.com/en-us/windows/powertoys/install) feature made by Microsoft that converts clipboard content to other formats like markdown or JSON.

### Copy links in other formats besides markdown

* [url2clipboard](https://github.com/asamuzaK/url2clipboard) supports HTML, Markdown, BBCode, Textile, AsciiDoc, MediaWiki, Jira, reStructuredText, LaTeX, Org Mode, and text.
* [TabCopy](https://chromewebstore.google.com/detail/tabcopy/micdllihgoppmejpecmkilggmaagfdmb) might only be on the Chrome Web Store, but supports many formats including HTML, Markdown, BBCode, CSV, and JSON, and lets you create custom link formats.

### Copy just the titles or just the URLs of all tabs

* [Copy as Markdown](https://github.com/yorkxin/copy-as-markdown) is similar to Stardown but has a popup menu with different options, and different priorities in what markdown it generates.

### Copy just a URL with a text fragment

* [link-to-text-fragment](https://github.com/GoogleChromeLabs/link-to-text-fragment) was made by Google itself but is cross-browser.

### Why use Stardown?

Unlike the alternatives listed above, Stardown is:

* **Flexible**. Integrates well with many workflows. Just copy part of a web page and paste anywhere.
* **Converts more formatting**. Stardown can convert almost any table to markdown or another markup language, and can create markdown of videos that renders well in GitHub.
* **Creates [text fragments](https://web.dev/articles/text-fragments)** so you can link to specific parts of pages.
* **Extensible**. Stardown's custom code for converting between markup languages is designed to be extended for more markdown flavors and other markup languages.
