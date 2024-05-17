# Stardown development

I wrote some general extension development tips in [Making browser extensions](https://til.chriswheeler.dev/making-browser-extensions/).

## priorities

To keep Stardown easy to use, I would like it to never have a popup and to only ever have one context menu option, at least by default. The options page can have many options as long as they are well organized and useful. Stardown's output to the clipboard should render well on at least Obsidian and GitHub, if not also other markdown renderers like VS Code.

I would like to keep Stardown relatively simple so that it's reliable, has few bugs that get fixed quickly, and is easy to maintain.

## Git workflow for collaboration

Let's create feature branches with descriptive names and make pull requests, such as described in [Getting started with Git and GitHub](https://chriswheeler.dev/posts/getting-started-with-git-and-github/#git-workflows).

## testing

When fully testing Stardown, test each feature below in each of the officially supported browsers.

- [ ] **Clicking the icon** copies a markdown link for the page.
- [ ] **Right-clicking a website's header** shows the context menu option "Copy markdown link to here", which copies a markdown link for the page with an HTML element ID from the header if it has one.
- [ ] **Selecting text, then right-clicking the text** shows the context menu option "Copy markdown quote", which, by default, copies a markdown block quote of the selected text, and a markdown link containing a text fragment and possibly an HTML element ID.
- [ ] **Right-clicking an unselected image** (and **selecting text, then right-clicking an unselected image**) shows the context menu option "Copy markdown of image", which copies markdown of the image using the image's URL and any alt text.
<!-- - [ ] **Selecting an image, then right-clicking the image** -->
<!-- - [ ] **Selecting multiple images, then right-clicking one of them** -->
- [ ] **Selecting text and image(s), then right-clicking the selected text** shows the context menu option "Copy markdown quote", which copies a markdown block quote of the selected text and image(s), and a markdown link containing a text fragment and possibly an HTML element ID.
<!-- - [ ] **Selecting text and image(s), then right-clicking a selected image** -->
- [ ] **Double-clicking the icon** copies a markdown unordered list of markdown links for all open pages.
- [ ] **Selecting tabs, then double-clicking the icon** copies a markdown unordered list of markdown links for all open selected pages.
- [ ] **Change settings and repeat as necessary**

## why separate browser versions

There are different versions of Stardown for Firefox and the Chromium browsers because of bugs or limitations in them:

* Since [Chromium does not support the Clipboard API in background scripts](https://stackoverflow.com/questions/61862872/how-to-copy-web-notification-content-to-clipboard/61977696#61977696), the Chromium version of Stardown also requires the `scripting` permission so it can run a content script that uses the clipboard API.
* In Firefox, [Manifest V3 extensions with low privilege activeTab shows annoying blue dot for all websites](https://bugzilla.mozilla.org/show_bug.cgi?id=1851083). This is why I changed the Firefox version of Stardown from manifest v3 to v2.
* Although Stardown no longer uses Firefox's manifest v3, [Firefox does not support service_worker in manifest v3](https://stackoverflow.com/questions/75043889/manifest-v3-background-scripts-service-worker-on-firefox).
* Firefox [sometimes requires an add-on ID](https://extensionworkshop.com/documentation/develop/extensions-and-the-add-on-id/) in `browser_specific_settings` in manifest.json, but Chromium doesn't allow `browser_specific_settings`.

If updating the Firefox version of Stardown to manifest v3 before [the blue dot bug](https://bugzilla.mozilla.org/show_bug.cgi?id=1851083) is fixed, maybe hide the blue dot with [this CSS](https://bugzilla.mozilla.org/show_bug.cgi?id=1851083#ct-21:~:text=2%20months%20ago-,the%20dot%20can%20be%20hidden%20with%20this%20css).

So far, it has been worth it to keep the Firefox and Chromium versions of Stardown separate from each other to keep the code more simple and to avoid using a build/bundle tool like Vite. However, it may eventually become better to have only one version of Stardown for all browsers. I'm not sure if or when that will happen and am interested in hearing people's thoughts on this.

## text fragments

Text fragments and how to generate them is explained in [this web.dev article](https://web.dev/articles/text-fragments#programmatic_text_fragment_link_generation). The article mentions [a minified version of the text fragment generation code](https://unpkg.com/text-fragments-polyfill@5.7.0/dist/fragment-generation-utils.js), but Stardown doesn't use the minified version because extension stores need to be able to review the code and minifying code doesn't really help extensions.

Stardown's text fragment generation code, which was almost entirely written by Google, is in the files named `text-fragment-utils.js` and `fragment-generation-utils.js`, which are abstracted by `create-text-fragment-arg.js`. The former two files should probably not be changed for anything except fixing bugs or updating to new versions of text fragments.
