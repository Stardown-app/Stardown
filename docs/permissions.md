# Permissions

Below are descriptions of why Stardown requests the permissions that it does. Related: [Stardown's privacy statement](../README.md#privacy).

## Required permissions

### Host ("Access your data for all websites")

Users may want to copy markdown of nearly any website, so Stardown requests the ability to run content scripts at all URLs. Content scripts are needed for nearly everything Stardown does including getting the HTML of selections, creating text fragments, and putting text into the clipboard.

### `clipboardWrite` ("Modify data you copy and paste" or "Input data to the clipboard")

Stardown puts markdown into the clipboard for you to paste anywhere.

### `notifications` ("Display notifications")

Notifications are needed to show important error messages. We have [a plan to eventually make this permission optional](https://github.com/Stardown-app/Stardown/issues/157).

### `activeTab`

This permission gives temporary access to the current tab which Stardown uses for getting the tab's title, URL, HTML, etc. depending on the feature used.

### `contextMenus`

Stardown shows options in the right-click menu so you can choose what to copy by right-clicking it.

### `storage`

Settings are stored for customizing Stardown's features.

### `sidePanel`

Stardown has a side panel (a.k.a. a sidebar) with a simple notepad that can optionally be used to reduce how much you have to switch windows and paste. Using Stardown's copy shortcut while the side panel is open automatically pastes into the notepad. The sidePanel permission is only required in Chromium.

## Optional permissions

### `tabs` ("Read your browsing history" or "Access browser tabs")

This permission does NOT give access to existing browsing history and is only requested if and when you copy links for multiple tabs simultaneously. The Chromium browsers (Chrome, Edge, Arc, Brave, Vivaldi, Opera, etc.) use the scary-sounding request message "Read your browsing history" because malicious extensions that can see the titles and URLs of all tabs could start manually gathering your browsing activity. Other Chromium extensions that request immediate and complete access to browsing history, unlike Stardown, use the request message "read and change your browsing history on all signed-in devices".

### `downloads` ("Manage your downloads" or "Download files and read and modify the browser's download history")

By default, Stardown's output goes to the clipboard. However, you can optionally save some outputs as files instead. The downloads permission is needed if you want Stardown to create new files.

## Developer documentation

- [Permissions \| Chrome for Developers](https://developer.chrome.com/docs/extensions/reference/permissions-list)
- [Request the right permissions \| Firefox Extension Workshop](https://extensionworkshop.com/documentation/develop/request-the-right-permissions/)
