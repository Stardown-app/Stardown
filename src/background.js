/*
   Copyright 2024 Chris Wheeler and Jonathan Chua

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import {
    browser,
    sleep,
    createContextMenus,
    updateContextMenu,
} from "./browserSpecific.js";
import { getSetting } from "./getSetting.js";
import { createTabLink } from "./generators/md.js";

let jsonDestination = "clipboard";
let windowId = null;

browser.runtime.onInstalled.addListener(async (details) => {
    switch (details.reason) {
        case "install":
            await detectMissingShortcuts();
            break;
        case "update":
            await showUpboardingPage();
            break;
        case "browser_update":
        case "chrome_update":
            break;
        case "shared_module_update":
            break;
        default:
            console.warn(`Unknown onInstalled reason: ${details.reason}`);
    }
});

createContextMenus();
getSetting("jsonDestination").then((value) => (jsonDestination = value));
browser.tabs.query({ currentWindow: true, active: true }).then((tabs) => {
    if (tabs[0]) {
        windowId = tabs[0].windowId;
    }
});
browser.windows.onFocusChanged.addListener(async (newWindowId) => {
    if (newWindowId !== -1) {
        windowId = newWindowId;
    }
});

browser.commands.onCommand.addListener(async (command) => {
    switch (command) {
        case "openSidePanel":
            // Chromium only
            browser.sidePanel.open({ windowId: windowId });
            break;
        case "copySelection":
            const tabs = await browser.tabs.query({
                currentWindow: true,
                highlighted: true,
            });
            if (tabs.length === 1) {
                // if only one tab is selected
                // copy the selected part of the page if any, otherwise copy the tab
                await handleInteraction(tabs[0], {
                    category: "copySelectionShortcut",
                });
            } else {
                // if multiple tabs are selected
                // copy the selected tabs
                await handleCopyMultipleTabs(tabs);
            }
            break;
        case "copyEntirePage":
            const tabs1 = await browser.tabs.query({
                active: true,
                currentWindow: true,
            });
            await handleInteraction(tabs1[0], {
                category: "copyEntirePageShortcut",
            });
            break;
        case "copyMultipleTabs":
            const tabs2 = await browser.tabs.query({
                currentWindow: true,
                highlighted: true,
            });
            await handleCopyMultipleTabs(tabs2);
            break;
        case "openSettings":
            browser.runtime.openOptionsPage();
            break;
        default:
            console.error(`Unknown command: ${command}`);
            throw new Error(`Unknown command: ${command}`);
    }
});

browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.destination !== "background") {
        return;
    }

    switch (message.category) {
        case "updateContextMenu":
            // These context menu updates are done with messages from the content script
            // because the contextMenus.update method cannot update a context menu that
            // is already open. The content script listens for mouseover and mouseup
            // events.
            await updateContextMenu(message.context);
            break;
        case "downloadFile":
            await downloadFile(message.file);
            break;
        case "showStatus":
            await showStatus(
                message.status,
                message.notifTitle,
                message.notifBody,
            );
            break;
        case "showWarning":
            const notifyOnWarning = await getSetting("notifyOnWarning");
            if (notifyOnWarning) {
                await showNotification("Warning", message.warning);
            }
            break;
        case "copySelectionButtonPressed":
            const tabs = await browser.tabs.query({
                currentWindow: true,
                highlighted: true,
            });
            if (tabs.length === 1) {
                // if only one tab is selected
                // copy the selected part of the page if any, otherwise copy the tab
                await handleInteraction(tabs[0], {
                    category: "copySelectionShortcut",
                });
            } else {
                // if multiple tabs are selected
                // copy the selected tabs
                await handleCopyMultipleTabs(tabs);
            }
            break;
        case "copyEntirePageButtonPressed":
            const tabs1 = await browser.tabs.query({
                active: true,
                currentWindow: true,
            });
            await handleInteraction(tabs1[0], {
                category: "copyEntirePageShortcut",
            });
            break;
        case "copyMultipleTabsButtonPressed":
            const tabs2 = await browser.tabs.query({
                currentWindow: true,
                highlighted: true,
            });
            await handleCopyMultipleTabs(tabs2);
            break;
        case "sidebarButtonPressed":
            // Chromium only
            browser.sidePanel?.open({ windowId: windowId });
            break;
        case "settingsButtonPressed":
            browser.runtime.openOptionsPage();
            break;
        case "jsonDestination":
            jsonDestination = message.jsonDestination;
            break;
        default:
            console.error(`Unknown message category: ${message.category}`);
            throw new Error(`Unknown message category: ${message.category}`);
    }
});

browser.contextMenus.onClicked.addListener(async (info, tab) => {
    switch (info.menuItemId) {
        case "page":
            await handleInteraction(
                tab,
                { category: "pageRightClick" },
                { frameId: info.frameId },
            );
            break;
        case "pageSection":
            await handleInteraction(
                tab,
                { category: "pageSectionRightClick" },
                { frameId: info.frameId },
            );
            break;
        case "selection":
            await handleInteraction(
                tab,
                { category: "selectionRightClick" },
                { frameId: info.frameId },
            );
            break;
        case "selectionWithSource":
            await handleInteraction(
                tab,
                { category: "selectionWithSourceRightClick" },
                { frameId: info.frameId },
            );
            break;
        case "selectionQuote":
            await handleInteraction(
                tab,
                { category: "selectionQuoteRightClick" },
                { frameId: info.frameId },
            );
            break;
        case "link":
            // In Chromium unlike in Firefox, `info.linkText` is undefined and no
            // property in `info` has the link's text.
            await handleInteraction(tab, {
                category: "linkRightClick",
                linkUrl: info.linkUrl,
            });
            break;
        case "image":
            await handleInteraction(tab, {
                category: "imageRightClick",
                srcUrl: info.srcUrl,
            });
            break;
        case "video":
            await handleInteraction(tab, {
                category: "videoRightClick",
                srcUrl: info.srcUrl,
                pageUrl: info.pageUrl,
            });
            break;
        case "audio":
            await handleInteraction(tab, {
                category: "audioRightClick",
                srcUrl: info.srcUrl,
                pageUrl: info.pageUrl,
            });
            break;
        case "markdownTable":
            await handleInteraction(
                tab,
                { category: "markdownTableRightClick" },
                { frameId: info.frameId },
            );
            break;
        case "tsvTable":
            await handleInteraction(
                tab,
                { category: "tsvTableRightClick" },
                { frameId: info.frameId },
            );
            break;
        case "csvTable":
            await handleInteraction(
                tab,
                { category: "csvTableRightClick" },
                { frameId: info.frameId },
            );
            break;
        case "jsonTable":
            if (jsonDestination === "file") {
                let havePerm;
                try {
                    // The permissions request must be the first async function call in
                    // the event handler or it will throw an error.
                    havePerm = await browser.permissions.request({
                        permissions: ["downloads"],
                    });
                } catch (err) {
                    await showStatus(0, "Error", err.message);
                    return;
                }
                if (!havePerm) {
                    await showStatus(
                        0,
                        "Error",
                        "Unable to download JSON without permission",
                    );
                    return;
                }
            }

            await handleInteraction(
                tab,
                { category: "jsonTableRightClick" },
                { frameId: info.frameId },
            );
            break;
        case "htmlTable":
            await handleInteraction(
                tab,
                { category: "htmlTableRightClick" },
                { frameId: info.frameId },
            );
            break;
        default:
            console.error(`Unknown context menu item: ${info.menuItemId}`);
            throw new Error(`Unknown context menu item: ${info.menuItemId}`);
    }
});

/**
 * handleInteraction sends a message to the content script and then shows the user a
 * status indicator.
 * @param {any} tab - the tab the user interacted with.
 * @param {object} message - the message to send to the content script. This must have a
 * `category` property, and can have other properties depending on the category.
 * @param {string} message.category - the category of the message.
 * @param {object} options - the options for the message. For example, the `frameId`
 * option can be used to specify the frame to send the message to.
 * @param {number} successStatus - the status to show if the operation was successful.
 * @returns {Promise<void>}
 */
async function handleInteraction(
    tab,
    message,
    options = {},
    successStatus = 1,
) {
    const uriScheme = tab.url.split(":")[0];
    if (!["http", "https", "file"].includes(uriScheme)) {
        await showStatus(
            0,
            "Error",
            `Stardown cannot run on pages with a URL that starts with "${uriScheme}:"`,
        );
        return;
    } else if (tab.url.endsWith(".pdf")) {
        await showStatus(0, "Error", "Stardown cannot run on PDFs");
        return;
    } else if (
        // it's an extension store
        tab.url.startsWith("https://chromewebstore.google.com") ||
        tab.url.startsWith("https://microsoftedge.microsoft.com/addons") ||
        tab.url.startsWith("https://addons.mozilla.org") ||
        tab.url.startsWith("https://addons.opera.com")
    ) {
        await showStatus(0, "Error", "This page is protected by the browser");
        return;
    } else if (tab.url.startsWith("https://support.mozilla.org")) {
        await showStatus(0, "Error", "This page is protected by the browser");
        return;
    }

    message.destination = "content";
    message.id = Math.random(); // why: https://github.com/Stardown-app/Stardown/issues/98

    let status, notifTitle, notifBody;
    try {
        console.log("Sending message from background.js to content.js");
        const response = await browser.tabs.sendMessage(
            tab.id,
            message,
            options,
        );
        if (response === null) {
            console.log("Response is null");
            return;
        } else if (response === undefined) {
            await showStatus(
                0,
                "Error",
                "No response received from the content script",
            );
            return;
        }
        status = response.status;
        notifTitle = response.notifTitle;
        notifBody = response.notifBody;
    } catch (err) {
        await showStatus(0, "Error", err.message);
        return;
    }
    if (status === 1) {
        // success
        await showStatus(successStatus, notifTitle, notifBody);
    } else {
        // failure
        await showStatus(status, notifTitle, notifBody);
    }
}

/**
 * handleCopyMultipleTabs handles a request from the user to create a markdown list of
 * links, and sends it to the content script to be copied. A status indicator is then
 * shown to the user.
 * @param {Tab[]} tabs
 * @returns {Promise<void>}
 */
async function handleCopyMultipleTabs(tabs) {
    if (tabs.length === 1) {
        // if only one tab is highlighted
        // get unhighlighted tabs
        const copyTabsWindows = await getSetting("copyTabsWindows");
        if (copyTabsWindows === "current") {
            tabs = await browser.tabs.query({ currentWindow: true });
        } else if (copyTabsWindows === "all") {
            tabs = await browser.tabs.query({});
        }
    }

    // create the links
    let text = "";
    const markupLanguage = await getSetting("markupLanguage");
    switch (markupLanguage) {
        case "html":
            const result = ["<ul>"];
            for (let i = 0; i < tabs.length; i++) {
                const anchor = `  <li><a href="${tabs[i].url}">${tabs[i].title}</a></li>`;
                result.push(anchor);
            }
            result.push("</ul>");
            text = result.join("\n");
            break;
        case "markdown":
        case "markdown with some html":
            const mdSubBrackets = await getSetting("mdSubBrackets");
            const links = await Promise.all(
                tabs.map((tab) => createTabLink(tab, mdSubBrackets)),
            );
            const mdBulletPoint = await getSetting("mdBulletPoint");
            text = links.map((link) => `${mdBulletPoint} ${link}\n`).join("");
            break;
        default:
            await showStatus(0, "Error", "Unsupported markup language");
            return;
    }

    const message = { category: "copyText", text: text };
    const options = {};
    const activeTabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
    });
    const activeTab = activeTabs[0];
    await handleInteraction(activeTab, message, options, tabs.length);
}

/**
 * showUpboardingPage shows the upboarding page for the version in the manifest if the
 * page exists and hasn't been shown yet.
 * @returns {Promise<void>}
 * @throws {Error}
 */
async function showUpboardingPage() {
    const manifest = browser.runtime.getManifest();

    const filePath = `/upboard/${manifest.version}.html`;
    if (!filePath.startsWith("/")) {
        throw new Error("The upboarding page path should start with a slash");
        // tabs.create becomes unpredictable without the leading slash for files
        // packaged with an extension:
        // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/create#:~:text=if%20you%20omit%20the%20leading%20%27%2F%27%2C%20the%20url%20is%20treated%20as%20a%20relative%20url%2C%20and%20different%20browsers%20may%20construct%20different%20absolute%20urls.
    }
    if (!(await fileExists(filePath))) {
        console.log(
            `There does not appear to be an upboarding page for v${manifest.version}`,
        );
        return;
    }

    // check whether the upboarding page has been shown yet
    const lastUpboardVersionShown = await getSetting("lastUpboardVersionShown");

    const last = lastUpboardVersionShown?.split(".").map((n) => parseInt(n));
    const current = manifest.version.split(".").map((n) => parseInt(n));

    if (
        last === undefined ||
        last[0] > current[0] ||
        (last[0] === current[0] &&
            (last[1] > current[1] ||
                (last[1] === current[1] && last[2] > current[2])))
    ) {
        // show the upboarding page
        await browser.tabs.create({ url: filePath });
        await browser.storage.sync.set({
            lastUpboardVersionShown: manifest.version,
        });
    }
}

/**
 * fileExists reports whether a file exists within the browser extension's files.
 * @param {string} filePath
 * @returns {Promise<boolean>}
 */
async function fileExists(filePath) {
    const fileUrl = browser.runtime.getURL(filePath);
    try {
        const response = await fetch(fileUrl);
        if (!response.ok) {
            console.error(`response not ok for ${fileUrl}`);
            return false;
        }
        await response.text(); // throws an error for nonexistent files
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * downloadFile downloads a file to the user's computer. This must be in the background
 * script because `browser.downloads` appears to always be undefined in content scripts.
 * @param {object} fileObj - the object containing info about a file to download.
 * @param {string} fileObj.name - the name of the file to download.
 * @param {string} fileObj.type - the type of the file to download.
 * @param {string|undefined} fileObj.json - the content of the file to download if the
 * file is JSON.
 * @returns {Promise<void>}
 */
async function downloadFile(fileObj) {
    if (fileObj.type === "json" && fileObj.json) {
        const json = fileObj.json;
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const name = fileObj.name || "file.json";
        await browser.downloads
            .download({
                url: url,
                filename: name,
                saveAs: true,
                conflictAction: "uniquify",
            })
            .then(
                (id) => console.log("Download started with ID", id),
                (err) => console.error("Download failed:", err),
            );
    } else {
        console.error("No content to download");
    }
}

/**
 * showStatus indicates to the user whether an operation was successful. The indicators
 * are badge text on the extension's icon and possibly a system notification.
 * @param {number} status - the number of items successfully copied. Zero means failure,
 * and one or above means success.
 * @param {string} notifTitle - the title of the notification to show the user.
 * @param {string} notifBody - the body of the notification to show the user.
 * @returns {Promise<void>}
 */
async function showStatus(status, notifTitle, notifBody) {
    if (status > 0) {
        // success
        await brieflyShowCheck(status);
        const notifyOnSuccess = await getSetting("notifyOnSuccess");
        if (notifyOnSuccess) {
            await showNotification(notifTitle, notifBody);
        }
    } else {
        // failure
        console.error(`${notifTitle}: ${notifBody}`);
        if (
            notifBody ===
            "Could not establish connection. Receiving end does not exist."
        ) {
            notifBody =
                "Stardown wasn't ready or wasn't allowed to load into the frame.";
            // This can happen when the page wasn't finished loading when the user
            // interacted with it, or if the user tried to use Stardown within an
            // iframe.
        }
        await brieflyShowX();
        await showNotification(notifTitle, notifBody);
    }
}

/**
 * showNotification shows the user a system notification.
 * @param {string} title - the title of the notification.
 * @param {string} body - the body of the notification.
 * @returns {Promise<void>}
 */
async function showNotification(title, body) {
    if (title === undefined) {
        throw new Error("title is undefined");
    } else if (body === undefined) {
        throw new Error("body is undefined");
    }
    browser.notifications.create("", {
        type: "basic",
        iconUrl: "images/stardown-128.png",
        title: title,
        message: body,
    });
}

/**
 * brieflyShowCheck briefly shows a green check (✓) on the extension's icon.
 * @param {number} itemCount - the number of items successfully created and written to
 * the clipboard. Zero means failure, and one or above means success.
 * @returns {Promise<void>}
 */
async function brieflyShowCheck(itemCount) {
    browser.action.setBadgeBackgroundColor({ color: "green" });
    if (!itemCount || itemCount === 1) {
        browser.action.setBadgeText({ text: "✓" });
    } else {
        browser.action.setBadgeText({ text: `${itemCount} ✓` });
    }
    await sleep(1000); // 1 second
    browser.action.setBadgeText({ text: "" });
}

/**
 * brieflyShowX briefly shows a red X (✗) on the extension's icon.
 * @returns {Promise<void>}
 */
async function brieflyShowX() {
    browser.action.setBadgeBackgroundColor({ color: "red" });
    browser.action.setBadgeText({ text: "✗" });
    await sleep(1000); // 1 second
    browser.action.setBadgeText({ text: "" });
}

/**
 * detectMissingShortcuts detects whether any of Stardown's commands that should have
 * shortcuts are missing them. If any are missing, it opens an error page. This is
 * useful in Chromium because if another extension is already using a shortcut,
 * Stardown's shortcut will not be set. However, this function has no effect in Firefox
 * because Firefox allows duplicate shortcuts and no way to detect them.
 * @returns {Promise<void>}
 */
async function detectMissingShortcuts() {
    /** @type {object[]} */
    const cmds = await browser.commands.getAll();

    /** @type {string[]} */
    let cmdsExpectingShortcut = [];
    const manifest = browser.runtime.getManifest();
    const manifestCmds = manifest.commands;
    for (let i = 0; i < cmds.length; i++) {
        const cmd = cmds[i];
        if (manifestCmds[cmd.name]?.suggested_key) {
            cmdsExpectingShortcut.push(cmd.name);
        }
    }

    /** @type {object[]} */
    const missing = [];
    for (let i = 0; i < cmds.length; i++) {
        const cmd = cmds[i];
        if (cmd.shortcut === "" && cmdsExpectingShortcut.includes(cmd.name)) {
            missing.push(cmd);
        }
    }

    if (missing.length > 0) {
        console.log("Missing shortcuts:", missing);

        // [tabs.create() | MDN](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/create#url)
        browser.tabs.create({ url: `/welcomeShortcutsMissing.html` });
    }
}
