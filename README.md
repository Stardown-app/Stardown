<h1 align="center"><img width="35" alt="Stardown's icon" src="src/images/stardown.svg"> Stardown</h1>

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
    to get updates early or <a href="./src/converters/README.md#implementation">customize Stardown's output more than its settings support</a>.
</p>

<p align="center"><img alt="demo gif" src="https://github.com/Stardown-app/assets/blob/main/Stardown.gif"></p>

* Press `Alt+C` to copy a selection or a page's link.
* Press `Alt+N` to open a notepad that copying with `Alt+C` automatically pastes into.
* Right-click part of a page to copy it as markdown. Select before right-clicking to copy multiple parts.
* Copy links for all tabs. Select tabs first to copy links for only those tabs.
* Customize these features including keyboard shortcuts in Stardown's settings.

<!--
Stardown is free except that if you get it from Apple's App Store, there is a small fee to help cover the $99 USD per year cost I'm paying to keep Stardown available in the App Store.
-->

## Privacy

Stardown will never sell any data to anyone, and does not collect nor send any of your personal data anywhere. Everything you copy or download using Stardown is stored locally.

## Permissions

For why Stardown requests the permissions that it does, see [./docs/permissions.md](./docs/permissions.md).

## Development

Contributions are welcome! Let me know (such as in [an issue](https://github.com/Stardown-app/Stardown/issues) or [a discussion](https://github.com/Stardown-app/Stardown/discussions)) what you have in mind ahead of time if you think there's a chance it won't be approved.

Also, please read [./docs/develop.md](docs/develop.md).

## Alternatives

You're welcome to [make a feature request](https://github.com/Stardown-app/Stardown/issues/new?assignees=&labels=enhancement&projects=&template=feature_request.md&title=), and there may already be other software that meets all of your needs. I am not affiliated with any of the alternatives below unless noted otherwise and have not tried all of them; use them at your own risk.

### Copy markdown links for pages without installing anything

You can use this [bookmarklet](https://en.wikipedia.org/wiki/Bookmarklet) I made:

`javascript: navigator.clipboard.writeText('[' + document.title + '](' + location.href + ')');`

### Integrate directly with an editor

* [Obsidian Clipper](https://github.com/obsidianmd/obsidian-clipper) is the official web clipper extension for Obsidian.
* [MarkDownload](https://github.com/deathau/markdownload) was developed by an Obsidian community moderator.
* [Omnivore](https://omnivore.app/) can save content in a variety of formats.
* [linkding](https://github.com/sissbruecker/linkding) is a self-hosted bookmarks manager.
* [Zotero](https://www.zotero.org/) is one of the best tools for saving and organizing research.
* [Joplin](https://github.com/laurent22/joplin) has an [official web clipper](https://github.com/laurent22/joplin/blob/dev/readme/apps/clipper.md) of its own.
* [Send To Logseq](https://chromewebstore.google.com/detail/send-to-logseq/mgdccnefjlmhnfbmlnhddoogimbpmilj) is a browser extension that saves web pages to [Logseq](https://github.com/logseq/logseq?tab=readme-ov-file).
* [github.com/webclipper/web-clipper](https://github.com/webclipper/web-clipper) can integrate directly with Obsidian, Notion, OneNote, Bear, Yuque, Joplin, and more.
* [Obsidian Web Clipper Bookmarklet](https://gist.github.com/kepano/90c05f162c37cf730abb8ff027987ca3) is a bookmarklet for saving web pages directly to Obsidian.
* [Slurp](https://github.com/inhumantsar/slurp) is an Obsidian community plugin and bookmarklet for saving web pages directly to Obsidian.
* [import-github-readme](https://github.com/chasebank87/import-github-readme) is an Obsidian plugin for downloading GitHub readme files directly into Obsidian.

### Scrape websites

* [Firecrawl](https://github.com/mendableai/firecrawl) is an API and SDKs for scraping websites and saving them as markdown or structured data.
* [Reader-LM](https://jina.ai/news/reader-lm-small-language-models-for-cleaning-and-converting-html-to-markdown/?nocache=1) is small language models that convert HTML to markdown.

### Paste structured data

* [obsidian-ReadItLater](https://github.com/DominikPieper/obsidian-ReadItLater) is an Obsidian plugin that creates notes with specific structures from clipboard content based on where it was copied from.
* [Advanced Paste](https://learn.microsoft.com/en-us/windows/powertoys/advanced-paste) is a Windows-only [PowerToys](https://learn.microsoft.com/en-us/windows/powertoys/install) feature made by Microsoft that converts clipboard content to other markup languages like markdown or JSON.

### Copy web page links in other markup languages besides markdown

* [url2clipboard](https://github.com/asamuzaK/url2clipboard) supports HTML, Markdown, BBCode, Textile, AsciiDoc, MediaWiki, Jira, reStructuredText, LaTeX, Org Mode, and text.
* [TabCopy](https://chromewebstore.google.com/detail/tabcopy/micdllihgoppmejpecmkilggmaagfdmb) might only be on the Chrome Web Store, but supports many markup languages including HTML, Markdown, BBCode, CSV, and JSON, and lets you create custom link formats.

### Copy just a URL with a text fragment

* [link-to-text-fragment](https://github.com/GoogleChromeLabs/link-to-text-fragment) was made by Google itself but is cross-browser.

## Why Stardown?

Stardown is:

* **Flexible**. Integrates well with many workflows. Select almost anything, copy and paste anywhere.
* **Instantly clip** into a note using Stardown's sidebar notepad to both copy and paste with `Alt+C`.
* **Better at converting**. Stardown's custom code for converting HTML to markdown can convert more formatting than alternatives.
* **Creates [text fragments](https://developer.mozilla.org/en-US/docs/Web/URI/Fragment/Text_fragments)** so you can link to specific parts of pages.
* **Extensible**. Stardown is designed to be extended for more markdown flavors and other markup languages.
