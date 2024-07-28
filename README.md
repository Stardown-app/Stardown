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
    <a href="./docs/install-from-source.md">
        install from the source code</a>
    to get updates early.
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
* Chrome: "Options"
* Edge: "Extension options"

### How to change the keyboard shortcut

* [Firefox](https://support.mozilla.org/en-US/kb/manage-extension-shortcuts-firefox)
* Chrome: `chrome://extensions/shortcuts`
* Edge: `edge://extensions/shortcuts`

## Troubleshooting

See [./docs/troubleshooting.md](./docs/troubleshooting.md)

## Feature requests

See [./docs/feature-requests.md](./docs/feature-requests.md)

## Install from source

See [./docs/install-from-source.md](./docs/install-from-source.md)

## Development

Contributions are welcome! Let me know (such as in [an issue](https://github.com/Stardown-app/Stardown/issues) or [a discussion](https://github.com/Stardown-app/Stardown/discussions)) what you have in mind ahead of time if you think there's a chance it won't be approved.

Also, please read [./docs/develop.md](docs/develop.md)
