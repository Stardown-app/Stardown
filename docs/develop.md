# Stardown development

I wrote some general extension development tips in [Making browser extensions](https://chriswheeler.dev/posts/making-browser-extensions/). For more context about markdown itself, see [CommonMark: A Formal Specification For Markdown — Smashing Magazine](https://www.smashingmagazine.com/2020/12/commonmark-formal-specification-markdown/).

## Goals

Stardown's main goal is to be so simple, fast, reliable, and flexible that people think of it as "it's like Ctrl+C but it keeps formatting". It should generally have only one keyboard shortcut, no popup, and usually show only one context menu option at a time. The options page can have many options as long as they are well organized and useful. Stardown's output should render well on at least Obsidian and GitHub, if not also other markdown renderers like [Google Docs](https://workspaceupdates.googleblog.com/2024/07/import-and-export-markdown-in-google-docs.html), [VS Code](https://code.visualstudio.com/docs/languages/markdown#_markdown-preview), Discourse, GitLab, Stack Overflow, Joplin, Reddit, and Discord.

I would also like to keep Stardown's code relatively simple so that it's reliable, has few bugs that get fixed quickly, and is easy to maintain.

## Installing Stardown from source for development

See [./dev-install-from-source.md](./dev-install-from-source.md)

## Tests

Run the tests with `npm run test`.

If a certain test fails, its error message will tell you to run `npm run md-diff` (requires [nodemon](https://www.npmjs.com/package/nodemon); `npm install -g nodemon`) and open a file named `md.diff.html` that displays the differences between the markdown converter's actual output and its expected output. Any text with a green background is missing from the actual output, and any text with a red background is unexpected. Any incorrect newline character is visualized as a downward right arrow (⤵). You may want to use VS Code's [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension to automatically reload `md.diff.html` when nodemon changes it. Note that VS Code sometimes makes automatic changes to markdown files while they're being edited that could mess up `expected.md`, such as changing table column widths or ordered list numbers. If you edit `expected.md` in VS Code, please fix any changes VS Code automatically makes before committing.

## Git workflow for collaboration

Let's create feature branches with descriptive names and make pull requests as described in [Getting started with Git and GitHub](https://chriswheeler.dev/posts/getting-started-with-git-and-github/#git-workflows).

## How Stardown works

In Stardown, every user interaction (except on the options page) sends a request from the background to the content, which returns a response to the background. You can think of it like client-server architecture where the background is the client and the content is the server. Every request must have a `category` property and may optionally have other properties. Every response is an object with the properties `status`, `notifTitle`, and `notifBody`.

- `status`: the number of markdown items successfully created and written to the clipboard. Zero means failure, and one or above means success.
- `notifTitle`: the title of the notification to show to the user.
- `notifBody`: the body of the notification to show to the user.

Here are the steps Stardown goes through with each user interaction (except on the options page):

1. The user interacts with the extension by clicking the icon, choosing a context menu option, or using the keyboard shortcut. This interaction is received in the background script.
2. The background script gets some data about the interaction, may process the data a little, and then sends it to the content script.
3. The content script does most or all of the data processing needed, writes markdown to the clipboard, and sends the background script some info about whether it succeeded and what to tell the user.
4. The background script tells the user whether all of this succeeded by showing a green check (✓) for success or a red X (✗) for failure on the extension's icon, and possibly a system notification. (Any error notifications are always shown. Warning and/or success notifications are shown if the user chose that in settings.)

[Message passing](https://developer.chrome.com/docs/extensions/develop/concepts/messaging) allows the background and content scripts to communicate with each other. Most of Stardown's message passing is done between the `browser.contextMenus.onClicked` listener in `background.js` and the `browser.runtime.onMessage` listener in `content.js`.

The "background script" in Chromium is not exactly a background script, but a service worker, unlike in Firefox. This affects how the file name must be declared in the manifest and what variables and functions are available in certain places. For example, [Chromium's service workers don't allow access to the clipboard API](https://stackoverflow.com/questions/61862872/how-to-copy-web-notification-content-to-clipboard/61977696#61977696) unlike Firefox's background scripts. Stardown uses the clipboard API only in content scripts so that it can use the same code for both Chromium and Firefox. Safari supports both background scripts and service workers.

The browser's context menu cannot be updated while it is visible, so Stardown's dynamic context menu options depend on information from events such as `mouseover` and `selectionchange`. These events are received from the browser in the content script and sent to the background script to update the context menu.

Stardown converts HTML to other formats using custom code explained in [../src/converters/README.md](../src/converters/README.md).

## What Stardown does

When fully manually testing Stardown, use the descriptions in this section in each of the officially supported browsers to search for bugs.

### Context types

- **selection**: anything that the user has selected by clicking and dragging with their mouse or using selection keyboard shortcuts.
- **link**: any clickable link on a page. However, for a link that is also an image, Stardown should show only the image copy option.
- **image**: types supported include png, jpg, svg, webp, gif, and base64-encoded. Types not supported include background images, `canvas` HTML elements, inline `svg` HTML elements, and sometimes images within `a` HTML elements for some reason.
- **video**: a video rendered with the `video` HTML element, such as YouTube videos and mp4 files hosted by GitHub ([example on this page](https://github.com/wheelercj/zq)). This option doesn't appear for some video sites like [Vimeo](https://player.vimeo.com/video/55073825) probably because their `video` HTML element is buried under many other things, and [Asciinema](https://asciinema.org/) because they don't use the `video` HTML element.
  - Markdown of YouTube videos is expected to render well in Obsidian and Discord, but not GitHub or VS Code by default.
  - Markdown of GitHub mp4s is expected to render well only in GitHub.
  - If the user changes the setting "Optimize markdown of YouTube videos for __" to "GitHub", then the output should render well in at least GitHub, Obsidian, and VS Code.
- **audio**: an audio player rendered with the `audio` HTML element. Some good examples are the first two audio players on [New Audio HTML Element: Master It Out Now With Our Code Example »](https://html.com/tags/audio/).
- **table**: a table of data rendered with the `table` HTML element. Browsers do not offer a built-in context type for this, so Stardown has its own table detection code. Here are some examples of tables:
  - [Tables for visually impaired users](https://developer.mozilla.org/en-US/docs/Learn/HTML/Tables/Advanced#tables_for_visually_impaired_users)
  - [Extended Syntax | Markdown Guide](https://www.markdownguide.org/extended-syntax/#tables)
  - [English modal auxiliary verbs - Wikipedia](https://en.wikipedia.org/wiki/English_modal_auxiliary_verbs#Modal_auxiliary_verbs_distinguished_grammatically)

### Features

- [ ] **Clicking the icon or pressing Alt+C** copies a markdown link for the page, unless part of the page is selected in which case markdown of the selection is copied instead.
- [ ] **Double-clicking the icon or pressing Alt+CC** copies a markdown unordered list of markdown links for all open tabs.
- [ ] **Selecting tabs, then double-clicking the icon or pressing Alt+CC** copies a markdown unordered list of markdown links for all selected tabs.
- [ ] **Right-clicking an empty part of a page** shows the "Copy markdown link to here" option.
- [ ] **Right-clicking a website's unselected header** shows the "Copy markdown link to here" option.
- [ ] **Right-clicking selected text** shows the "Copy markdown of selection" option.
- [ ] **Right-clicking an unselected image** shows the "Copy markdown of image" option.
- [ ] **Selecting text, then right-clicking an unselected image**, due to browser limitations, shows no context menu option in Chromium and shows "Copy markdown of selection" in Firefox.
- [ ] **Selecting text and image(s), then right-clicking the selected text** shows the "Copy markdown of selection" option.
- [ ] **Selecting text and image(s), then right-clicking a selected image** shows the "Copy markdown of selection" option.
- [ ] **Selecting text and link(s), then right-clicking a selected link** shows the "Copy markdown of selection" option.
- [ ] **Right-clicking a link that is not an image** shows the "Copy markdown of link" option.
- [ ] **Right-clicking a link that is an image** might not show any context menu options due to browser limitations. If a context menu option appears, it should be "Copy markdown of image".
- [ ] **Right-clicking a video** shows the "Copy markdown of video" option, but may require a second right-click for the correct context menu to appear because some videos (e.g. YouTube videos) have a special context menu.
- [ ] **Right-clicking an audio player** shows the "Copy markdown of audio" option.
- [ ] **Selecting the contents of a table and right-clicking the selection** shows several options: "Copy markdown of table", "Copy TSV of table", "Copy CSV of table", "Copy JSON of table", and "Copy HTML of table". Each option should result in a table with everything aligned correctly, leaving some cells empty and others duplicated as necessary.
- [ ] "Copy markdown link to here" copies a markdown link for the page with an HTML element ID from where the page was right-clicked, if one exists there.
- [ ] "Copy markdown of selection", by default, copies markdown of the selected text (including all of the page's formatting that markdown supports), and a markdown link containing a text fragment and possibly an HTML element ID.
- [ ] "Copy markdown of image" copies markdown of the image using the image's URL and any alt text.
- [ ] "Copy markdown of link" copies markdown of the link, using the same title and URL as the link in the page (except for any character escapes or encodings).
- [ ] "Copy markdown of video" copies markdown of the video using the video source's URL.
- [ ] "Copy markdown of audio" copies a markdown link to either an audio file or a site that plays the audio.
- [ ] **Change settings and repeat as necessary**

### Errors and warnings

When something goes wrong, Stardown should still respond well.

#### Text fragment timeout

1. Turn on the "Show warning notifications" setting
2. Go to https://markdownguide.offshoot.io/basic-syntax/#blockquotes-1
3. Select the text "rendered output" (this phrase appears 32 times on this somewhat long page)
4. Right-click the selection and choose "Copy markdown of selection"
5. After several seconds:
  - Stardown's icon should display a green check (✓) to indicate success.
  - A system notification should appear that says "Warning" and explains that the fragment generator timed out.
  - The clipboard should now have a markdown link without a text fragment.

## Some differences between Chromium and Firefox

- [Chromium does not allow use of the clipboard API in the background](https://stackoverflow.com/questions/61862872/how-to-copy-web-notification-content-to-clipboard/61977696#61977696).
- In Firefox, [Manifest V3 extensions with low privilege activeTab shows annoying blue dot for all websites](https://bugzilla.mozilla.org/show_bug.cgi?id=1851083). This is why I changed the Firefox version of Stardown from manifest v3 to v2. This bug is fixed in Firefox v129+, but I'm waiting a bit before switching back to manifest v3 in case many people don't update Firefox right away.
- Although Stardown no longer uses Firefox's manifest v3, [Firefox does not support service_worker in manifest v3](https://stackoverflow.com/questions/75043889/manifest-v3-background-scripts-service-worker-on-firefox).
- Firefox [sometimes requires an add-on ID](https://extensionworkshop.com/documentation/develop/extensions-and-the-add-on-id/) in `browser_specific_settings` in manifest.json, but Chromium doesn't allow `browser_specific_settings`.
- Based on testing I took notes on in [#11](https://github.com/Stardown-app/Stardown/issues/11), it appears Firefox manifest v2 does not allow use of the `import` and `export` keywords, and Chrome manifest v3 does not allow their use in content scripts. That's why Stardown requires using a bundler.
- Further differences are described in comments throughout Stardown's code.

## Text fragments

Text fragments and how to generate them is explained in [this web.dev article](https://web.dev/articles/text-fragments#programmatic_text_fragment_link_generation). The article mentions [a minified version of the text fragment generation code](https://unpkg.com/text-fragments-polyfill@5.7.0/dist/fragment-generation-utils.js), but Stardown doesn't use the minified version because extension stores need to be able to review the code and minifying code doesn't really help extensions.

Stardown's text fragment generation code, which was almost entirely written by Google, is in the files named `text-fragment-utils.js` and `fragment-generation-utils.js`. They probably should not be changed for anything except fixing bugs or updating to new versions of text fragments.

Stardown also tries to find HTML element IDs to put in links alongside text fragments because if the website ever changes and makes the text fragment outdated, the browser will use the HTML element ID as a fallback.

## Tables

HTML tables have more features than markdown and other plaintext tables, but Stardown's custom code for converting tables from HTML to markdown or another plaintext format should still always create valid tables that are as similar to the HTML as possible.

Some HTML tables have cells that span multiple rows and/or columns, such as [this one](https://developer.mozilla.org/en-US/docs/Learn/HTML/Tables/Advanced#tables_for_visually_impaired_users). Markdown and other plaintext formats don't allow that, so they must have extra cells to match the spans.

From my experience so far, markdown renderers tend to require every markdown table to have one header row followed by one table divider, then zero or more body rows. The number of cells in the header row must be equal to that of the table divider and to that of whichever row has the most cells. Body rows may have varying numbers of cells.

Sample markdown tables for testing markdown renderers can be found in [./sample-tables.md](./sample-tables.md).
