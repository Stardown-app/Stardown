# Feature requests

You're welcome to [make a feature request](https://github.com/Stardown-app/Stardown/issues/new?assignees=&labels=enhancement&projects=&template=feature_request.md&title=), and there may already be another browser extension that meets all of your needs. I am not affiliated with any of the below extensions and have not tried all of them; use them at your own risk.

## Download an entire web page

* [MarkDownload](https://github.com/deathau/markdownload) was developed by an Obsidian community moderator. While Stardown is great for copying *parts* of web pages as markdown, MarkDownload is better for entire pages, especially if you want to download directly into Obsidian. I use both Stardown and MarkDownload.
* [Obsidian Web Clipper Bookmarklet](https://gist.github.com/kepano/90c05f162c37cf730abb8ff027987ca3) is a bookmarklet for saving web pages directly to Obsidian.
* [Slurp](https://github.com/inhumantsar/slurp) is an Obsidian community plugin and bookmarklet for saving web pages directly to Obsidian.
* [Omnivore](https://omnivore.app/) doesn't save pages as markdown but can export them as markdown.
* [Zotero](https://www.zotero.org/) doesn't save pages as markdown (at least by default), but is one of the best tools for research.

## Scrape websites

* [Firecrawl](https://github.com/mendableai/firecrawl) is an API and SDKs for scraping websites and saving them as markdown or structured data.

## Paste structured data

* [obsidian-ReadItLater](https://github.com/DominikPieper/obsidian-ReadItLater) is an Obsidian plugin that creates notes with specific structures from clipboard content based on where it was copied from.
* [Advanced Paste](https://learn.microsoft.com/en-us/windows/powertoys/advanced-paste) is a Windows-only [PowerToys](https://learn.microsoft.com/en-us/windows/powertoys/install) feature made by Microsoft that converts clipboard content to other formats like markdown or JSON.

## Copy links in other formats besides markdown

* [url2clipboard](https://github.com/asamuzaK/url2clipboard) supports HTML, Markdown, BBCode, Textile, AsciiDoc, MediaWiki, Jira, reStructuredText, LaTeX, Org Mode, and text.
* [TabCopy](https://chromewebstore.google.com/detail/tabcopy/micdllihgoppmejpecmkilggmaagfdmb) might only be on the Chrome Web Store, but supports many formats including HTML, Markdown, BBCode, CSV, and JSON, and lets you create custom link formats.

## Copy just the titles or just the URLs of all tabs

* [Copy as Markdown](https://github.com/yorkxin/copy-as-markdown) is similar to Stardown but has a popup menu with different options, and different priorities in what markdown it generates.

## Copy just a URL with a text fragment

* [link-to-text-fragment](https://github.com/GoogleChromeLabs/link-to-text-fragment) was made by Google itself but is cross-browser.

## Why use Stardown?

Unlike the applications linked above, Stardown is:

* **Simple.** Less clicking, less typing, no setup.
* **Keeps almost all formatting**. Even most complex tables can be converted to markdown or other markup languages.
* **Creates [text fragments](https://web.dev/articles/text-fragments)** so you can link to specific parts of pages.
* **Infinitely customizable**. Any software developer can [install from source](./dev-install-from-source.md) and [edit or create a markup converter](../src/converters/README.md) such as [the HTML to markdown converter](../src/converters/md.js). For all but the most simple customization, Stardown's converters are easier to customize and extend than all other widely used markup converters.
