# Stardown development

I wrote some general extension development tips in [Making browser extensions](https://chriswheeler.dev/posts/making-browser-extensions/). For more context about markdown itself, see [CommonMark: A Formal Specification For Markdown — Smashing Magazine](https://www.smashingmagazine.com/2020/12/commonmark-formal-specification-markdown/).

## Goals

Stardown's main goal is to be so simple, fast, reliable, and flexible that people think of it as "it's like Ctrl+C but it keeps formatting". The settings page can have many settings as long as they are well organized, useful, and not so important that many users will be constantly changing them. Stardown's output should render well in at least Obsidian and GitHub, if not also other [markdown renderers and converters](./md-renderers.md).

## Tests

Run the tests with `npm run test`.

If a certain test fails, its error message will tell you to run `npm run md-diff`. See [../src/converters/README.md#testing](../src/converters/README.md#testing) for more details.

Manual testing is often helpful too. When testing manually, see [./manual-testing.md](./manual-testing.md).

## Git workflow

Let's create feature branches with descriptive names and make pull requests as described in [Getting started with Git and GitHub](https://chriswheeler.dev/posts/getting-started-with-git-and-github/#git-workflows).

## Writing import statements

Stardown uses several different execution contexts as described in [./execution-contexts.md](./execution-contexts.md), and development of Stardown uses the [Rollup](https://rollupjs.org/) bundler to combine the files for each context. Rollup copies an entire file's content (and the content of all files that file imports) into another file even if the import statement only asks for specific things. For this reason, try to avoid putting functions and imports for one execution context in a file that is only for a different execution context, or else the resulting bundled code will have a lot of duplicate unused code that might go unnoticed except by extension reviewers.

## Writing documentation

This project uses [JSDoc](https://en.wikipedia.org/wiki/JSDoc) to annotate types. In VS Code you can type `/**` above a function and press enter to auto-generate part of its JSDoc comment.

## Improving Stardown's output

If changes to improve the output can apply to:

- **all/many sites**:
    - **converting HTML to another language**: the changes should probably be made in a converter (see [../src/converters/README.md](../src/converters/README.md))
    - **what HTML to include in selections**: the changes should probably be made somewhere in [../src/htmlSelection.js](../src/htmlSelection.js)
- **specific sites**:
    - **both selections and entire pages**: the changes should probably be made in the `improveConvertibility` function
    - **only entire pages**: the changes should probably be made in [../src/extractMainContent.js](../src/extractMainContent.js)

## How Stardown works

If you want to read a broad overview of Stardown's components and how they communicate with each other, see [./execution-contexts.md](./execution-contexts.md).

Stardown converts HTML to other formats using custom code explained in [../src/converters/README.md](../src/converters/README.md).

## Some differences between Chromium and Firefox

- [Chromium does not allow use of the clipboard API in the background](https://stackoverflow.com/questions/61862872/how-to-copy-web-notification-content-to-clipboard/61977696#61977696).
- In Firefox, [Manifest V3 extensions with low privilege activeTab shows annoying blue dot for all websites](https://bugzilla.mozilla.org/show_bug.cgi?id=1851083). This is why I changed the Firefox version of Stardown from manifest v3 to v2. This bug is fixed in Firefox v129+, but I'm waiting a bit before switching back to manifest v3 in case many people don't update Firefox right away.
- Although Stardown no longer uses Firefox's manifest v3, [Firefox does not support service_worker in manifest v3](https://stackoverflow.com/questions/75043889/manifest-v3-background-scripts-service-worker-on-firefox).
- Firefox [sometimes requires an add-on ID](https://extensionworkshop.com/documentation/develop/extensions-and-the-add-on-id/) in `browser_specific_settings` in manifest.json, but Chromium doesn't allow `browser_specific_settings`.
- Based on testing I took notes on in [#11](https://github.com/Stardown-app/Stardown/issues/11), it appears Firefox manifest v2 does not allow use of the `import` and `export` keywords, and Chrome manifest v3 does not allow their use in content scripts. That's why Stardown requires using a bundler.
- Firefox has [sidebars](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/sidebarAction) and Chromium has [side panels](https://developer.chrome.com/docs/extensions/reference/api/sidePanel), which are mostly the same but have different APIs.
- Further differences are described in comments throughout Stardown's code.

## Performance

Stardown currently does not cause any noticeable performance problems, but the articles linked below might be helpful in the future. Stardown's main performance impact is probably from injecting content scripts; the code is injected eagerly and none of it is minified. Also, only the primary browser thread is used (no worker threads).

- [Impact of Extensions on Browser Performance: An Empirical Study on Google Chrome](https://arxiv.org/pdf/2404.06827v1#S3)
- [How do we analyze the browser extensions’ impact on web performance? \| by 偏偏 \| Medium](https://joannechen1223.medium.com/how-do-we-analyze-the-browser-extensions-impact-on-web-performance-886f0b099f35)
- [Measuring The Performance Impact Of Chrome Extensions \| DebugBear](https://www.debugbear.com/blog/measuring-the-performance-impact-of-chrome-extensions)
- [How Do Chrome Extensions Impact Website Performance In 2024? \| DebugBear](https://www.debugbear.com/blog/chrome-extensions-website-performance)
- [How to measure performance of browser extension on websites (> 100) - Stack Overflow](https://stackoverflow.com/questions/72134457/how-to-measure-performance-of-browser-extension-on-websites-100)
- [treosh/exthouse: Analyze the impact of a browser extension on web performance.](https://github.com/treosh/exthouse)

## Text fragments

Text fragments and how to generate them is explained in [Text fragments \| MDN](https://developer.mozilla.org/en-US/docs/Web/URI/Fragment/Text_fragments) and in [Boldly link where no one has linked before: Text Fragments \| web.dev](https://web.dev/articles/text-fragments#programmatic_text_fragment_link_generation). The second article mentions [a minified version of the text fragment generation code](https://unpkg.com/text-fragments-polyfill@5.7.0/dist/fragment-generation-utils.js), but Stardown doesn't use the minified version because extension stores need to be able to review the code and minifying code doesn't really help extensions.

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
