# Stardown development

I wrote some general extension development tips in [Making browser extensions](https://chriswheeler.dev/posts/making-browser-extensions/). For more context about markdown itself, see [CommonMark: A Formal Specification For Markdown — Smashing Magazine](https://www.smashingmagazine.com/2020/12/commonmark-formal-specification-markdown/).

## Goals

Stardown's main goal is to be so simple, fast, reliable, and flexible that people think of it as "it's like Ctrl+C but it keeps formatting". The settings page can have many settings as long as they are well organized, useful, and not so important that many users will be constantly changing them. Stardown's output should render well in at least Obsidian and GitHub, if not also other markdown renderers and converters like [Pandoc](https://boisgera.github.io/pandoc/markdown/), [Google Docs](https://workspaceupdates.googleblog.com/2024/07/import-and-export-markdown-in-google-docs.html), [VS Code](https://code.visualstudio.com/docs/languages/markdown#_markdown-preview), [Overleaf](https://www.overleaf.com/learn/how-to/Writing_Markdown_in_LaTeX_Documents), [Mattermost](https://docs.mattermost.com/collaborate/format-messages.html), Discourse, GitLab, Stack Overflow, Joplin, Reddit, Discord, etc.

## Installing Stardown from source for development

See [./dev-install-from-source.md](./dev-install-from-source.md)

## Tests

Run the tests with `npm run test`.

If a certain test fails, its error message will tell you to run `npm run md-diff` (requires [nodemon](https://www.npmjs.com/package/nodemon); `npm install -g nodemon`) and open a file named `md.diff.html` that displays the differences between the markdown converter's actual output and its expected output. Any text with a green background is missing from the actual output, and any text with a red background is unexpected. You may want to use VS Code's [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension to automatically reload `md.diff.html` when nodemon changes it. Note that VS Code sometimes makes automatic changes to markdown files while they're being edited that could mess up `expected.md`, such as changing table column widths or ordered list numbers. If you edit `expected.md` in VS Code, please fix any changes VS Code automatically makes before committing. The line endings in `expected.md` should be LF, not CRLF.

## Git workflow

Let's create feature branches with descriptive names and make pull requests as described in [Getting started with Git and GitHub](https://chriswheeler.dev/posts/getting-started-with-git-and-github/#git-workflows).

## Writing documentation

This project uses [JSDoc](https://en.wikipedia.org/wiki/JSDoc) to annotate types. In VS Code you can type `/**` above a function and press enter to auto-generate part of its JSDoc comment (this might require the [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) extension).

## How Stardown works

If you want to read a broad overview of how the most important parts of Stardown works, see [./how-it-works.md](./how-it-works.md).

Stardown converts HTML to other formats using custom code explained in [../src/converters/README.md](../src/converters/README.md).

## What Stardown does

When fully manually testing Stardown, use the descriptions in this section in each of the officially supported browsers to search for bugs.

### Sample web pages

Here are a bunch of web pages with interesting features for testing.

- [tiny table](https://www.markdownguide.org/extended-syntax/#tables)
- [small table](https://developer.mozilla.org/en-US/docs/Learn/HTML/Tables/Advanced#tables_for_visually_impaired_users)
- [complex table](https://en.wikipedia.org/wiki/English_modal_auxiliary_verbs#Modal_auxiliary_verbs_distinguished_grammatically)
- [table with link images](https://en.wikipedia.org/wiki/1926_World_Table_Tennis_Championships)
- [tables with spanned images](https://en.wikipedia.org/wiki/Toshimi_Kitazawa)
- [massive table](https://www.worldometers.info/world-population/population-by-country/)
- [tables used for presentation without the presentation role](https://news.ycombinator.com/)
- [Wikipedia references](https://en.wikipedia.org/wiki/Shanti_Kumar_Morarjee)
- [Wikipedia location map](https://en.wikipedia.org/wiki/Bush_Kill_%28Pepacton_Reservoir_tributary%29) cannot render well because two images have to overlap
- [code blocks that use `<pre>` but not `<code>`](https://www.cnblogs.com/unity2018/p/8492463.html)
- [code blocks with inline element headers](https://developer.mozilla.org/en-US/docs/Learn/HTML/Tables/Advanced#the_scope_attribute)
- [MS doc code blocks](https://devblogs.microsoft.com/dotnet/csharp-13-explore-preview-features/)
- [block quote](https://markdownguide.offshoot.io/basic-syntax/#blockquotes-1)
- [image with an absolute src](https://betterexplained.com/articles/math-empathy/#post-6251:~:text=Math%20Empathy%20Checklist,different%20mental%20checklist.)
- [images with relative srcs](https://textbundle.org/)
- [iframe](https://www.w3schools.com/html/html_iframe.asp)
- [YouTube video](https://www.youtube.com/watch?v=jfKfPfyJRdk)
- [PDFs](https://haslab.github.io/SAFER/scp21.pdf) should make Stardown show an error message like "Stardown cannot run on PDFs"

### Context types

When the user right-clicks part of a web page, their browser detects the type of the content they right-clicked and makes that info available to installed browser extensions.

- **selection**: anything that the user has selected by clicking and dragging with their mouse or using selection shortcuts.
- **link**: any clickable link on a page. However, for a link that is also an image, Stardown should show only the image copy option.
- **image**: types supported include png, jpg, svg, webp, gif, and base64-encoded. Types not supported include background images, `canvas` HTML elements, inline `svg` HTML elements, and sometimes images within `a` HTML elements for some reason.
- **video**: a video rendered with the `video` HTML element, such as YouTube videos and mp4 files hosted by GitHub ([example on this page](https://github.com/wheelercj/zq)). This option doesn't appear for some video sites like [Vimeo](https://player.vimeo.com/video/55073825) probably because their `video` HTML element is buried under many other things, and [Asciinema](https://asciinema.org/) because they don't use the `video` HTML element.
  - Markdown of YouTube videos is expected to render well in Obsidian and Discord, but not in GitHub by default.
  - Markdown of GitHub mp4s is expected to render well only in GitHub.
  - If the user changes the setting "Optimize markdown of YouTube videos for __" to "GitHub", then the output should render well in at least GitHub, Obsidian, and VS Code.
- **audio**: an audio player rendered with the `audio` HTML element. Some good examples are the first two audio players on [New Audio HTML Element: Master It Out Now With Our Code Example »](https://html.com/tags/audio/).
- **table**: a table of data rendered with the `table` HTML element. Browsers do not offer a built-in context type for this, so Stardown has its own table detection code that runs each time the user makes a selection.

### Features

- [ ] **Pressing Alt+C** copies a markdown link for the page, unless part of the page is selected in which case markdown of the selection is copied instead.
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
- Firefox has [sidebars](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/sidebarAction) and Chromium has [side panels](https://developer.chrome.com/docs/extensions/reference/api/sidePanel), which are mostly the same but have different APIs.
- [Firefox does not support text fragments yet](https://bugzilla.mozilla.org/show_bug.cgi?id=1753933).
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

**HTML table definition**

> In this order: optionally a caption element, followed by zero or more colgroup elements, followed optionally by a thead element, followed by either zero or more tbody elements or one or more tr elements, followed optionally by a tfoot element, optionally intermixed with one or more script-supporting elements.
> 
> — [the HTML Standard](https://html.spec.whatwg.org/multipage/tables.html)
