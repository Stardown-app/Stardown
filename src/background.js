/*
   Copyright 2024 Chris Wheeler

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

let browserName;
if (typeof browser === 'undefined') {
    browserName = 'chromium';
    var browser = chrome;
} else {
    browserName = 'firefox';
}

if (typeof browser.action === 'undefined') {
    browser.action = browser.browserAction; // for manifest v2 compatibility
}

let lastClick = new Date(0);
let doubleClickInterval = 500;

getSetting('doubleClickInterval', 500).then(value => doubleClickInterval = value);

browser.action.onClicked.addListener(async (tab) => {
    const now = new Date();
    const msSinceLastClick = now - lastClick; // milliseconds
    const isDoubleClick = msSinceLastClick < doubleClickInterval;
    if (isDoubleClick) {
        let havePerm;
        try {
            // The permissions request must be the first async function call in the
            // event handler or it will throw an error.
            havePerm = await browser.permissions.request({ permissions: ['tabs'] });
        } catch (err) {
            await showStatus(0, 'Error', err.message);
            return;
        }
        if (!havePerm) {
            await showStatus(0, 'Error', 'Unable to copy links for multiple tabs without permission');
            return;
        }

        lastClick = new Date(0);
        await handleIconDoubleClick(tab);
        return;
    }
    // it's a single-click
    lastClick = now;

    await handleInteraction(tab, { category: 'iconSingleClick' });
});

const pageMenuItem = {
    id: 'page',
    title: 'Copy markdown link to here',
    contexts: ['page', 'editable'],
};

const selectionMenuItem = {
    id: 'selection',
    title: 'Copy markdown of selection',
    contexts: ['selection'],
};

const linkMenuItem = {
    id: 'link',
    title: 'Copy markdown of link',
    contexts: ['link'],
};

const imageMenuItem = {
    id: 'image',
    title: 'Copy markdown of image',
    contexts: ['image'],
};

const videoMenuItem = {
    id: 'video',
    title: 'Copy markdown of video',
    contexts: ['video'],
};

const audioMenuItem = {
    id: 'audio',
    title: 'Copy markdown of audio',
    contexts: ['audio'],
};

if (browserName === 'firefox') {
    browser.contextMenus.create(pageMenuItem);
    browser.contextMenus.create(selectionMenuItem);
    browser.contextMenus.create(linkMenuItem);
    browser.contextMenus.create(imageMenuItem);
    browser.contextMenus.create(videoMenuItem);
    browser.contextMenus.create(audioMenuItem);
}

browser.runtime.onMessage.addListener((message) => {
    // These context menu updates are done with messages from a content script because
    // the contextMenus.update method cannot update a context menu that is already open.
    // The content script listens for mouseover events.
    updateContextMenu(message);
});

/**
 * updateContextMenu updates the options in the context menu based on the message from
 * the content script. This only works if the context menu is not visible.
 * @param {object} message - the message from the content script.
 * @param {boolean} message.isImage - whether the mouse is over an image.
 * @param {boolean} message.isLink - whether the mouse is over a link.
 * @returns {void}
 * @throws {Error} - if the browser is unknown.
 */
function updateContextMenu(message) {
    if (browserName === 'firefox') {
        if (message.isImage) {
            browser.contextMenus.update('link', { visible: false });
            browser.contextMenus.update('image', { visible: true });
        } else if (message.isLink) {
            browser.contextMenus.update('link', { visible: true });
            browser.contextMenus.update('image', { visible: false });
        }
    } else if (browserName === 'chromium') {
        // The `update` method doesn't work well in Chromium because the one remaining
        // context menu option would still be under a "Stardown" parent menu option
        // instead of being in the root of the context menu.
        browser.contextMenus.removeAll();

        if (message.isImage) {
            browser.contextMenus.create(imageMenuItem);
        } else if (message.isLink) {
            browser.contextMenus.create(linkMenuItem);
        } else {
            browser.contextMenus.create(linkMenuItem);
            browser.contextMenus.create(imageMenuItem);
        }

        browser.contextMenus.create(pageMenuItem);
        browser.contextMenus.create(selectionMenuItem);
        browser.contextMenus.create(videoMenuItem);
        browser.contextMenus.create(audioMenuItem);
    } else {
        console.error('Unknown browser');
        throw new Error('Unknown browser');
    }
}

browser.contextMenus.onClicked.addListener(async (info, tab) => {
    switch (info.menuItemId) {
        case 'page':
            await handleInteraction(
                tab, { category: 'pageRightClick' }, { frameId: info.frameId },
            );
            break;
        case 'selection':
            await handleInteraction(
                tab, { category: 'selectionRightClick' }, { frameId: info.frameId },
            );
            break;
        case 'link':
            // In Chromium, unlike in Firefox, `info.linkText` is undefined and no
            // property in `info` has the link's text.
            await handleInteraction(
                tab, { category: 'linkRightClick', linkUrl: info.linkUrl },
            );
            break;
        case 'image':
            await handleInteraction(
                tab, { category: 'imageRightClick', srcUrl: info.srcUrl },
            );
            break;
        case 'video':
            await handleInteraction(
                tab, { category: 'videoRightClick', srcUrl: info.srcUrl, pageUrl: info.pageUrl },
            )
            break;
        case 'audio':
            await handleInteraction(
                tab, { category: 'audioRightClick', srcUrl: info.srcUrl, pageUrl: info.pageUrl },
            );
            break;
        default:
            console.error(`Unknown context menu item: ${info.menuItemId}`);
            throw new Error(`Unknown context menu item: ${info.menuItemId}`);
    }
});

browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.doubleClickInterval) {
        doubleClickInterval = message.doubleClickInterval;
    } else if (message.warning) {
        await showNotification('Warning', message.warning);
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
 * @returns {Promise<void>}
 */
async function handleInteraction(tab, message, options = {}) {
    let status, notifTitle, notifBody;
    try {
        const response = await browser.tabs.sendMessage(tab.id, message, options);
        if (response === undefined) {
            await showStatus(0, 'Error', 'No response received from the content script');
            return;
        }
        status = response.status;
        notifTitle = response.notifTitle;
        notifBody = response.notifBody;
    } catch (err) {
        await showStatus(0, 'Error', err.message);
        return;
    }
    await showStatus(status, notifTitle, notifBody);
}

/**
 * handleIconDoubleClick handles the user double-clicking the extension's icon by
 * creating a markdown list of links and sending it to the content script to be copied.
 * A status indicator is then shown to the user.
 * @param {any} activeTab - the tab that was active when the icon was double-clicked.
 * @returns {Promise<void>}
 */
async function handleIconDoubleClick(activeTab) {
    // figure out which tabs to create links for
    let tabs = await browser.tabs.query({ currentWindow: true, highlighted: true });
    if (tabs.length === 1) { // if only one tab is highlighted
        // get unhighlighted tabs
        const doubleClickWindows = await getSetting('doubleClickWindows', 'current');
        if (doubleClickWindows === 'current') {
            tabs = await browser.tabs.query({ currentWindow: true });
        } else if (doubleClickWindows === 'all') {
            tabs = await browser.tabs.query({});
        }
    }

    const subBrackets = await getSetting('subBrackets', 'underlined');
    const links = await Promise.all(
        tabs.map(tab => createTabLinkMarkdown(tab, subBrackets))
    );
    const bulletPoint = await getSetting('bulletPoint', '-');
    const linksListMd = links.map(link => `${bulletPoint} ${link}\n`).join('');

    const {
        status, notifTitle, notifBody,
    } = await browser.tabs.sendMessage(activeTab.id, {
        category: 'copy', text: linksListMd,
    });

    if (status === 0) { // failure
        await showStatus(0, notifTitle, notifBody);
    } else { // success
        await showStatus(tabs.length, notifTitle, notifBody);
    }
}

/**
 * createTabLinkMarkdown creates a markdown link for a tab. Stardown does not add to, or
 * remove from, the link any HTML element ID or text fragment. The tab title is used as
 * the link title.
 * @param {any} tab - the tab to create the link from.
 * @param {boolean} subBrackets - the setting for what to substitute any square brackets
 * with.
 * @returns {Promise<string>} - a Promise that resolves to the markdown link.
 */
async function createTabLinkMarkdown(tab, subBrackets) {
    if (tab.title === undefined) {
        console.error('tab.title is undefined');
        throw new Error('tab.title is undefined');
        // Were the necessary permissions granted?
    }

    let title = await replaceBrackets(tab.title, subBrackets);
    title = await escapeMarkdown(title);
    const url = tab.url.replaceAll('(', '%28').replaceAll(')', '%29');

    return `[${title}](${url})`;
}

/**
 * createBlockquoteMarkdown creates a markdown blockquote with a link at the end. Any
 * character escaping or replacements should have already been done before calling this
 * function.
 * @param {string} text - the text of the blockquote.
 * @param {string} title - the title of the link.
 * @param {string} url - the URL of the link.
 * @returns {Promise<string>}
 */
async function createBlockquoteMarkdown(text, title, url) {
    text = text.replaceAll('\n', '\n> ');
    return `> ${text}\n> \n> — [${title}](${url})\n`;
}

/**
 * replaceBrackets replaces square brackets in a link title with the character or escape
 * sequence chosen in settings.
 * @param {string} title - the raw link title.
 * @param {string} subBrackets - the setting for what to substitute any square brackets
 * with.
 * @returns {Promise<string>}
 */
async function replaceBrackets(title, subBrackets) {
    if (subBrackets === 'underlined') {
        return title.replaceAll('[', '⦋').replaceAll(']', '⦌');
    } else if (subBrackets === 'escaped') {
        return title.replaceAll('[', '\\[').replaceAll(']', '\\]');
    }
    return title;
}

/**
 * escapeMarkdown escapes some (not all!) markdown characters in a string. This function
 * is useful for markdown link titles and blockquotes. It does not escape square
 * brackets, among other characters.
 * @param {string} text - the text to escape markdown characters in.
 * @returns {Promise<string>}
 */
async function escapeMarkdown(text) {
    return text
        .replaceAll('>', '\\>')
        .replaceAll('<', '\\<')
        .replaceAll('#', '\\#')
        .replaceAll('_', '\\_')
        .replaceAll('*', '\\*')
        .replaceAll('-', '\\-')
        .replaceAll('+', '\\+')
        .replaceAll('=', '\\=')
        .replaceAll('`', '\\`')
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
    if (status > 0) { // success
        await brieflyShowCheck(status);
        const notifyOnSuccess = await getSetting('notifyOnSuccess', false);
        if (notifyOnSuccess) {
            await showNotification(notifTitle, notifBody);
        }
    } else { // failure
        console.error(`${notifTitle}: ${notifBody}`);
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
        throw new Error('title is undefined');
    } else if (body === undefined) {
        throw new Error('body is undefined');
    }
    browser.notifications.create('', {
        type: 'basic',
        iconUrl: 'images/icon-128.png',
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
    if (!itemCount || itemCount === 1) {
        browser.action.setBadgeText({ text: '✓' });
    } else {
        browser.action.setBadgeText({ text: `${itemCount} ✓` });
    }
    browser.action.setBadgeBackgroundColor({ color: 'green' });
    await sleep(1000); // 1 second
    browser.action.setBadgeText({ text: '' });
}

/**
 * brieflyShowX briefly shows a red X (✗) on the extension's icon.
 * @returns {Promise<void>}
 */
async function brieflyShowX() {
    browser.action.setBadgeText({ text: '✗' });
    browser.action.setBadgeBackgroundColor({ color: 'red' });
    await sleep(1000); // 1 second
    browser.action.setBadgeText({ text: '' });
}

/**
 * sleep pauses the execution of the current async function for a number of
 * milliseconds.
 * @param {number} ms - the number of milliseconds to sleep.
 * @returns {Promise<void>}
 */
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * getSetting gets a setting from the browser's sync storage. If the setting does not
 * exist there, the default value is returned.
 * @param {string} name - the name of the setting.
 * @param {any} default_ - the default value of the setting.
 * @returns {Promise<any>}
 */
async function getSetting(name, default_) {
    let obj;
    try {
        obj = await browser.storage.sync.get(name);
    } catch (err) {
        console.error(err);
        return default_;
    }
    if (obj === undefined) {
        console.error(`Tried to get undefined setting "${name}"`);
        return default_;
    }

    const value = obj[name];
    if (value === undefined) {
        return default_;
    }

    return value;
}
