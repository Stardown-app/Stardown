# Alternatives to Stardown

I am not affiliated with any of the alternatives below unless otherwise noted and have not tried all of them; use them at your own risk.

## Copy markdown links for pages without installing anything

You can use this [bookmarklet](https://en.wikipedia.org/wiki/Bookmarklet) I made:

`javascript: navigator.clipboard.writeText('[' + document.title + '](' + location.href + ')');`

## Integrate directly with an editor

- Some editors like Obsidian try to convert pasted HTML, but the result often has formatting errors and important parts missing. Stardown's output is often significantly better because it can see more than just what's in the clipboard, and because its HTML converter is not a low-priority side feature. Many popular markdown editors including GitHub don't convert to markdown at all.
- [Obsidian Clipper](https://github.com/obsidianmd/obsidian-clipper)
- [Notion Web Clipper](https://www.notion.so/web-clipper)
- [Evernote Web Clipper](https://evernote.com/features/webclipper)
- [Joplin web clipper](https://github.com/laurent22/joplin/blob/dev/readme/apps/clipper.md)
- [SiYuan web clipper](https://github.com/siyuan-note/siyuan-chrome)
- [Roam Highlighter](https://chromewebstore.google.com/detail/roam-highlighter/hponfflfgcjikmehlcdcnpapicnljkkc?pli=1)
- [wallabag](https://wallabag.org/) (maybe with [Frigoligo](https://github.com/casimir/frigoligo))
- [Hoarder](https://github.com/hoarder-app/hoarder)
- [MarkDownload](https://github.com/deathau/markdownload) was developed by an Obsidian community moderator.
- [Omnivore](https://github.com/omnivore-app/omnivore) can save content in a variety of formats.
- [Readwise](https://readwise.io/) can sync highlights from websites, Kindles, iBooks, and more.
- [Chrome's page downloader](https://support.google.com/chrome/answer/7343019)
- [Zotero](https://www.zotero.org/) is one of the best tools for saving and organizing research articles and citations.
- [mymind](https://mymind.com/browser-extensions)
- [Slash](https://github.com/yourselfhosted/slash)
- [HTML to React & Figma by Magic Patterns](https://chromewebstore.google.com/detail/html-to-react-figma-by-ma/chgehghmhgihgmpmdjpolhkcnhkokdfp)
- [Send To Logseq](https://chromewebstore.google.com/detail/send-to-logseq/mgdccnefjlmhnfbmlnhddoogimbpmilj) is a browser extension that saves web pages to [Logseq](https://github.com/logseq/logseq?tab=readme-ov-file).
- [github.com/jsartelle/vscode-web-clipper](https://github.com/jsartelle/vscode-web-clipper) is a VS Code extension.
- [github.com/webclipper/web-clipper](https://github.com/webclipper/web-clipper) can integrate directly with Obsidian, Notion, OneNote, Bear, Yuque, Joplin, and more.

### Obsidian plugins

- [Slurp](https://github.com/inhumantsar/slurp) saves webpages directly to Obsidian.
- [Obsidian-NetClip](https://github.com/Elhary/Obsidian-NetClip) lets you browse the web from within Obsidian, and save webpages as markdown files from there.
- [obsidian-markitdown](https://github.com/ethanolivertroy/obsidian-markitdown) uses [MarkItDown](https://news.ycombinator.com/item?id=42410803) to convert files of many types to markdown.
- [obsidian-paper-clipper](https://github.com/ras0q/obsidian-paper-clipper) captures and manages academic papers.
- [import-github-readme](https://github.com/chasebank87/import-github-readme) downloads GitHub readme files directly into Obsidian.
- [obsidian-epub-importer](https://github.com/aoout/obsidian-epub-importer) imports EPUB files as markdown.

### Bookmarks managers

- [Pocket](https://getpocket.com/home)
- [Raindrop.io](https://raindrop.io/)
- [linkding](https://github.com/sissbruecker/linkding)
- [Linkwarden](https://github.com/linkwarden/linkwarden)
- [Shiori](https://github.com/go-shiori/shiori?tab=readme-ov-file)
- [Shaarli](https://github.com/shaarli/Shaarli)
- [LinkAce](https://www.linkace.org/)

## Mobile-only

- [obsidian-markdownr](https://github.com/IAmStoxe/obsidian-markdownr) is an Android app that converts a URL to markdown to share into your favorite notes app.

## Convert between markup languages

- [TableConvert.com](https://tableconvert.com/) converts tables between many formats, file types, and encodings.
- [Pandoc](https://pandoc.org/) offers a command line tool and a Haskell library that can convert between almost any two markup languages.
- [Nushell](https://www.nushell.sh/commands/docs/to_md.html) is another command line tool that can convert between many markup languages.
- [MarkItDown](https://news.ycombinator.com/item?id=42410803) is a Python tool for converting files and office documents to Markdown.
- [obsidian-markitdown](https://github.com/ethanolivertroy/obsidian-markitdown) uses MarkItDown to convert files of many types to markdown.
- [Docling](https://github.com/DS4SD/docling) is another Python tool that can convert many file types to markdown.
- [Marker](https://github.com/vikparuchuri/marker) converts PDF to markdown, optionally using OCRmyPDF.
- [MinerU](https://github.com/opendatalab/MinerU) converts PDF to markdown or JSON, optionally using PaddleOCR.
- [pdf-to-markdown](https://github.com/jzillmann/pdf-to-markdown) has online and downloadable versions.

## Scrape websites

- [Cobalt](https://github.com/imputnet/cobalt) makes it easy to download photos, gifs, videos, and audio.
- [Firecrawl](https://github.com/mendableai/firecrawl) has an API, SDKs (for Python, Node, Go, and Rust), and various integrations.
- [Crawl4AI](https://github.com/unclecode/crawl4ai) is a Python library.
- [HTML-to-Markdown](https://news.ycombinator.com/item?id=42093511) a REST API, command line tool, and Go library.
- [UrlToMarkdown.com](https://urltomarkdown.com/)
- [RedditToMarkdown](https://farnots.github.io/RedditToMarkdown/) export Reddit posts to markdown.
- [reddit-markdown](https://github.com/chauduyphanvu/reddit-markdown) is another tool for exporting Reddit posts to markdown.
- [Mealie](https://github.com/mealie-recipes/mealie) is a self hosted recipe manager and meal planner.
- [you-get](https://github.com/soimort/you-get) is a tiny command line utility to download media contents (videos, audios, images) from the Web.
- [Reader-LM](https://jina.ai/news/reader-lm-small-language-models-for-cleaning-and-converting-html-to-markdown/?nocache=1) is small language models that convert HTML to markdown.
- [Epublifier](https://github.com/maoserr/epublifier) converts some webnovels to epub format.
- [FanFicFare](https://github.com/JimmXinu/FanFicFare) is a tool for making eBooks from stories on fanfiction and other websites.

## Paste structured data

- [obsidian-ReadItLater](https://github.com/DominikPieper/obsidian-ReadItLater) is an Obsidian plugin that creates notes with specific structures from clipboard content based on where it was copied from.
- [Advanced Paste](https://learn.microsoft.com/en-us/windows/powertoys/advanced-paste) is a Windows-only [PowerToys](https://learn.microsoft.com/en-us/windows/powertoys/install) feature made by Microsoft that converts clipboard content to other markup languages like markdown or JSON.

## Copy web page links in other markup languages besides markdown

- [url2clipboard](https://github.com/asamuzaK/url2clipboard) supports HTML, Markdown, BBCode, Textile, AsciiDoc, MediaWiki, Jira, reStructuredText, LaTeX, Org Mode, and text.
- [TabCopy](https://chromewebstore.google.com/detail/tabcopy/micdllihgoppmejpecmkilggmaagfdmb) might only be on the Chrome Web Store, but supports many markup languages including HTML, Markdown, BBCode, CSV, and JSON, and lets you create custom link formats.
