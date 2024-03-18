<h1 align="center"><img width="35" alt="Stardown's icon" src="firefox/images/icon.svg"> Stardown</h1>

<p align="center">A browser extension that copies a markdown link for the current page.</p>

<p align="center">
    <a href="https://addons.mozilla.org/en-US/firefox/addon/stardown/"><img alt="Firefox badge" src="https://img.shields.io/badge/Firefox-black.svg?logo=firefoxbrowser&style=for-the-badge"></a>
    <a href="https://chrome.google.com/webstore/detail/clicknohlhfdlfjfkaeongkbdgbmkbhb"><img alt="Chrome badge" src="https://img.shields.io/badge/Chrome-black.svg?logo=googlechrome&style=for-the-badge&logoColor=238d41"></a>
    <a><img alt="Edge badge" src="https://img.shields.io/badge/Edge%20(coming%20soon)-black.svg?logo=microsoftedge&style=for-the-badge&logoColor=33b9ab"></a>
    <!-- <a><img alt="Safari badge" src="https://img.shields.io/badge/Safari-black.svg?logo=safari&style=for-the-badge&logoColor=188ff3"></a> -->
</p>

<p align="center"><img alt="demo" src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcnB5d2kwOXh6cDFnMnpudzFiem00Y3NsZjVxbXZhMWgwcWpvcG5yaSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/37MMWMqQyKSeKvDfk1/giphy.gif"></p>

After installing, there are multiple ways you can copy a markdown link:

* click the extension's icon
* press `Ctrl+Shift+U` (Mac: `Cmd+Shift+U`), or whichever keyboard shortcut you prefer in your browser's settings
* right-click where you want to link to and choose "Copy markdown link to here"
* select text before using the right-click option to create a link with a [text fragment](https://web.dev/articles/text-fragments)

Stardown's right-click option only adds a text fragment if you have selected text, but always tries to find an `id` attribute in the HTML elements you right-clicked so you can still link to specific parts of pages without text fragments. Firefox does not support text fragments yet, but the Firefox version of Stardown allows you to create links with text fragments.

## privacy

Stardown will never sell any data to anyone, and does not collect nor send any data anywhere besides putting links into your clipboard.

## feature requests

Although you're welcome to [make a feature request](https://github.com/wheelercj/Stardown/issues), there may already be another browser extension that meets all your needs. I am not affiliated with any of the below extensions and have not tried all of them. Use them at your own risk.

**Copy links in other formats besides markdown**

* [url2clipboard](https://github.com/asamuzaK/url2clipboard) supports HTML, Markdown, BBCode, Textile, AsciiDoc, MediaWiki, Jira, reStructuredText, LaTeX, Org Mode, and text.
* [TabCopy](https://chromewebstore.google.com/detail/tabcopy/micdllihgoppmejpecmkilggmaagfdmb) might only be on the Chrome Web Store, but supports many formats including HTML, Markdown, BBCode, CSV, and JSON, and lets you create custom link formats.

**Copy links for all tabs**

* [copy-as-markdown](https://github.com/yorkxin/copy-as-markdown)

**Copy a website's content as markdown**

* [MarkDownload](https://github.com/deathau/markdownload) was developed by an Obsidian community moderator.
* [copy-selection-as-markdown](https://github.com/0x6b/copy-selection-as-markdown) is only available for Firefox but may work manually installed in Chromium browsers.

**Copy a URL with a text fragment**

* [link-to-text-fragment](https://github.com/GoogleChromeLabs/link-to-text-fragment) was made by Google itself but is cross-browser.

**Save a page for research**

* [Zotero](https://www.zotero.org/)

**Why use Stardown?**

Unlike the extensions linked above, Stardown:

* can create markdown links for specific parts of pages (using text fragments and/or HTML element IDs)
* requires only one click to create a markdown link for the current page
* is focused on just the most important features so it's more likely to be maintained

## development

There are different versions of Stardown for Firefox and the Chromium browsers because of bugs or limitations in them:

* [Firefox does not yet support text fragments](https://bugzilla.mozilla.org/show_bug.cgi?id=1753933).
* Since [Chromium does not support the Clipboard API in background scripts](https://stackoverflow.com/questions/61862872/how-to-copy-web-notification-content-to-clipboard/61977696#61977696), the Chromium version of Stardown also requires the `scripting` permission so it can run a script that puts text in the clipboard.
* In Firefox, [Manifest V3 extensions with low privilege activeTab shows annoying blue dot for all websites](https://bugzilla.mozilla.org/show_bug.cgi?id=1851083). This is why I changed the Firefox version of Stardown from manifest v3 to v2.
* Although Stardown no longer uses Firefox's manifest v3, [Firefox does not support service_worker in manifest v3](https://stackoverflow.com/questions/75043889/manifest-v3-background-scripts-service-worker-on-firefox).
