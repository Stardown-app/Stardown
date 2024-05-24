# Stardown development

I wrote some general extension development tips in [Making browser extensions](https://til.chriswheeler.dev/making-browser-extensions/).

## priorities

To keep Stardown easy to use, I would like to avoid having a popup and to generally have only one context menu option visible at a time. The options page can have many options as long as they are well organized and useful. Stardown's output to the clipboard should render well on at least Obsidian and GitHub, if not also other markdown renderers like VS Code.

I would like to keep Stardown relatively simple so that it's reliable, has few bugs that get fixed quickly, and is easy to maintain.

## Git workflow for collaboration

Let's create feature branches with descriptive names and make pull requests, as described in [Getting started with Git and GitHub](https://chriswheeler.dev/posts/getting-started-with-git-and-github/#git-workflows).

## testing

When fully testing Stardown, test each feature below in each of the officially supported browsers.

- [ ] **Clicking the icon** copies a markdown link for the page.
- [ ] **Right-clicking an empty part of a page** shows the "Copy markdown link to here" option.
- [ ] **Right-clicking a website's unselected header** shows the "Copy markdown link to here" option.
- [ ] **Right-clicking selected text** shows the "Copy markdown of selection" option.
- [ ] **Right-clicking an unselected image** shows the "Copy markdown of image" option.
- [ ] **Selecting text, then right-clicking an unselected image** shows the "Copy markdown of image" option, but may or may not also show the "Copy markdown of selection" option.
- [ ] **Selecting text and image(s), then right-clicking the selected text** shows the "Copy markdown of selection" option.
- [ ] **Selecting text and image(s), then right-clicking a selected image** shows the "Copy markdown of selection" option, and may or may not also show the "Copy markdown of image" option.
- [ ] **Right-clicking a link that is not an image** shows the "Copy markdown of link" option.
- [ ] **Right-clicking a link that is an image** might not show any context menu options due to browser limitations. If a context menu option appears, it should be "Copy markdown of image".
- [ ] **Double-clicking the icon** copies a markdown unordered list of markdown links for all open tabs.
- [ ] **Selecting tabs, then double-clicking the icon** copies a markdown unordered list of markdown links for all selected tabs.
- [ ] "Copy markdown link to here" copies a markdown link for the page with an HTML element ID from where the page was right-clicked, if one exists there.
- [ ] "Copy markdown of selection", by default, copies a markdown block quote of the selected text and the alt text of any images, and a markdown link containing a text fragment and possibly an HTML element ID.
- [ ] "Copy markdown of image" copies markdown of the image using the image's URL and any alt text.
- [ ] "Copy markdown of link" copies markdown of the link, using the same title and URL as the link in the page (except for any character escapes or encodings).
- [ ] **Change settings and repeat as necessary**

## why separate browser versions

There are different versions of Stardown for Firefox and the Chromium browsers because of bugs or limitations in them:

* Since [Chromium does not support the Clipboard API in background scripts](https://stackoverflow.com/questions/61862872/how-to-copy-web-notification-content-to-clipboard/61977696#61977696), the Chromium version of Stardown also requires the `scripting` permission so it can run a content script that uses the clipboard API.
* In Firefox, [Manifest V3 extensions with low privilege activeTab shows annoying blue dot for all websites](https://bugzilla.mozilla.org/show_bug.cgi?id=1851083). This is why I changed the Firefox version of Stardown from manifest v3 to v2.
* Although Stardown no longer uses Firefox's manifest v3, [Firefox does not support service_worker in manifest v3](https://stackoverflow.com/questions/75043889/manifest-v3-background-scripts-service-worker-on-firefox).
* Firefox [sometimes requires an add-on ID](https://extensionworkshop.com/documentation/develop/extensions-and-the-add-on-id/) in `browser_specific_settings` in manifest.json, but Chromium doesn't allow `browser_specific_settings`.

If updating the Firefox version of Stardown to manifest v3 before [the blue dot bug](https://bugzilla.mozilla.org/show_bug.cgi?id=1851083) is fixed, maybe hide the blue dot with [this CSS](https://bugzilla.mozilla.org/show_bug.cgi?id=1851083#ct-21:~:text=2%20months%20ago-,the%20dot%20can%20be%20hidden%20with%20this%20css).

So far, it has been worth it to keep the Firefox and Chromium versions of Stardown separate from each other to keep the code more simple and to avoid using a bundler. However, it may soon become better to have only one version of Stardown for all browsers.

## text fragments

Text fragments and how to generate them is explained in [this web.dev article](https://web.dev/articles/text-fragments#programmatic_text_fragment_link_generation). The article mentions [a minified version of the text fragment generation code](https://unpkg.com/text-fragments-polyfill@5.7.0/dist/fragment-generation-utils.js), but Stardown doesn't use the minified version because extension stores need to be able to review the code and minifying code doesn't really help extensions.

Stardown's text fragment generation code, which was almost entirely written by Google, is in the files named `text-fragment-utils.js` and `fragment-generation-utils.js`, which are abstracted by `create-text-fragment-arg.js`. The former two files should probably not be changed for anything except fixing bugs or updating to new versions of text fragments.

Stardown also tries to find HTML element IDs to put in links alongside text fragments because if the website ever changes and makes the text fragment outdated, the browser will use the HTML element ID as a fallback.
