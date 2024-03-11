# Stardown

A browser extension that copies to the clipboard a markdown link to the current page.

![demo](https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMDJwYWdiZnF2MTQ4eGRib2J3c3RhaXF1cHJhc3RzeG80cjNuZDJzcyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L8eCYjgv1nzCCjq6v1/giphy.gif)

* [Add to Firefox](https://addons.mozilla.org/en-US/firefox/addon/stardown/)
* [Add to Chrome](https://chrome.google.com/webstore/detail/clicknohlhfdlfjfkaeongkbdgbmkbhb)

After installing, you can copy a markdown link by:

* clicking the extension's icon
* pressing `Ctrl/Cmd+Shift+U` (this can be customized in your browser's settings)
* right-clicking the page and choosing "Copy markdown link to here"
* selecting text, right-clicking it, and choosing the same option ("Copy markdown link to here")

In Chrome, selecting text before right-clicking it gives the benefit of adding a [text fragment](https://web.dev/articles/text-fragments) to the markdown link.

In all browsers, Stardown's right-click copy option will attempt to make a link that directs to the part of the page you right-clicked (it works if the HTML element you right-clicked has an `id` attribute).

## development

There are different versions of Stardown for Firefox and Chrome because of several bugs in the two browsers:

* Since [Chrome does not support the Clipboard API in background scripts](https://stackoverflow.com/questions/61862872/how-to-copy-web-notification-content-to-clipboard/61977696#61977696), the Chrome version of Stardown also requires the `scripting` permission so it can run a script that puts text in the clipboard.
* In Firefox, [Manifest V3 extensions with low privilege activeTab shows annoying blue dot for all websites](https://bugzilla.mozilla.org/show_bug.cgi?id=1851083). This is why I changed the Firefox version of Stardown from manifest v3 to v2.
* Although Stardown no longer uses Firefox's manifest v3, [Firefox does not support service_worker in manifest v3](https://stackoverflow.com/questions/75043889/manifest-v3-background-scripts-service-worker-on-firefox).
