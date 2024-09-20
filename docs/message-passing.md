# Stardown's message passing

[Message passing](https://developer.chrome.com/docs/extensions/develop/concepts/messaging) allows the different parts of a browser extension to communicate with each other. Extensions can have different components such as:

- content scripts
- background scripts (or service workers)
- options page
- popup
- sidebar (a.k.a. side panel)

Background scripts run for a while but may pause when the user hasn't interacted with the extension for a while. Content scripts are injected into each web page visited (for sites the extension's manifest specifies). The options page, popup, and sidebar are each an HTML file that may or may not use JavaScript and are loaded when the user opens them. Each of these components generally doesn't have direct access to data in the others and must use message passing to communicate.

Most of Stardown's user interactions are received in the background, which then sends a request to the content and receives a response. You can think of it like client-server architecture where the background is the client and the content is the server.

Every ***request*** from the background to the content must have `category` and `id` properties and may optionally have other properties.

- `category`: a string describing what is being requested.
- `id`: a unique, pseudorandom number for detecting [duplicate requests](https://github.com/Stardown-app/Stardown/issues/98).

Every ***response*** from the content to the background is either null or an object with the properties `status`, `notifTitle`, and `notifBody`.

- `status`: the number of markdown items successfully created and written to the clipboard. Zero means failure, and one or above means success.
- `notifTitle`: the title of the notification to show to the user.
- `notifBody`: the body of the notification to show to the user.

Here are the steps Stardown goes through with most user interactions:

1. The user presses Stardown's copy shortcut or chooses a context menu option. This interaction is received in the background script.
2. The background script gets some data about the interaction, may process the data a little, and then sends it to the content script.
3. The content script does most or all of the data processing needed, writes markdown to the clipboard, and sends the background script some info about whether it succeeded and what to tell the user.
4. The background script tells the user whether all of this succeeded by showing a green check (✓) for success or a red X (✗) for failure on the extension's icon, and possibly a system notification. (Any error notifications are always shown. Warning and/or success notifications are shown if the user chose that in settings.)

The "background script" in Chromium is not exactly a background script, but a service worker, unlike in Firefox. This affects how the file name must be declared in the manifest and what variables and functions are available in certain places. For example, [Chromium's service workers don't allow access to the clipboard API](https://stackoverflow.com/questions/61862872/how-to-copy-web-notification-content-to-clipboard/61977696#61977696) unlike Firefox's background scripts. Stardown uses the clipboard API only in content scripts so that it can use the same code for both Chromium and Firefox. Safari supports both background scripts and service workers.

The browser's context menu cannot be updated while it is visible, so Stardown's dynamic context menu options depend on information from events such as `mouseover` and `selectionchange`. These events are received from the browser in the content script and sent to the background script to update the context menu.