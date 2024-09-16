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

import { browser, sleep, createContextMenus, updateContextMenu, updateContextMenuLanguage } from './config.js';
import { getSetting } from './common.js';
import { createTabLink } from './generators/md.js';

let markupLanguage = 'markdown';
let jsonDestination = 'clipboard';
let windowId = null;

getSetting('markupLanguage').then(value => {
    markupLanguage = value;
    createContextMenus(value);
});
getSetting('jsonDestination').then(value => jsonDestination = value);
browser.tabs.query({ currentWindow: true, active: true }).then(tabs => {
    windowId = tabs[0].windowId;
});
browser.windows.onFocusChanged.addListener(async windowId_ => {
    if (windowId_ !== -1) {
        windowId = windowId_;
    }
});

browser.commands.onCommand.addListener(async command => {
    if (command === 'openSidePanel') {
        // Chromium only
        browser.sidePanel.open({ windowId: windowId });
    } else if (command === 'copy') {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        await handleInteraction(tabs[0], { category: 'copyShortcut' });
    } else if (command === 'copyMultiple') {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        await handleCopyAllTabs(tabs[0]);
    } else if (command === 'openSettings') {
        browser.runtime.openOptionsPage();
    } else if (command === 'openHelp') {
        browser.tabs.create({ url: 'https://github.com/Stardown-app/Stardown?tab=readme-ov-file#-stardown' });
    } else {
        console.error(`Unknown command: ${command}`);
        throw new Error(`Unknown command: ${command}`);
    }
});

browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.context) {
        // These context menu updates are done with messages from a content script
        // because the contextMenus.update method cannot update a context menu that is
        // already open. The content script listens for mouseover and mouseup events.
        await updateContextMenu(message.context, markupLanguage);
    } else if (message.showStatus) {
        await showStatus(message.status, message.notifTitle, message.notifBody);
    } else if (message.copyButtonPressed) {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        await handleInteraction(tabs[0], { category: 'copyShortcut' });
    } else if (message.copyMultipleButtonPressed) {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        await handleCopyAllTabs(tabs[0]);
    } else if (message.sidebarButtonPressed) {
        // Chromium only
        browser.sidePanel?.open({ windowId: windowId });
    } else if (message.helpButtonPressed) {
        browser.tabs.create({ url: 'https://github.com/Stardown-app/Stardown?tab=readme-ov-file#-stardown' });
    } else if (message.settingsButtonPressed) {
        browser.runtime.openOptionsPage();
    } else if (message.markupLanguage) {
        markupLanguage = message.markupLanguage;
        updateContextMenuLanguage(markupLanguage);
    } else if (message.jsonDestination) {
        jsonDestination = message.jsonDestination;
    } else if (message.downloadFile) {
        await downloadFile(message.downloadFile);
    } else if (message.warning) {
        console.warn(`Warning: ${message.warning}`);
        const notifyOnWarning = await getSetting('notifyOnWarning');
        if (notifyOnWarning) {
            await showNotification('Warning', message.warning);
        }
    }
});

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
            // In Chromium unlike in Firefox, `info.linkText` is undefined and no
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
        case 'markdownTable':
            await handleInteraction(
                tab, { category: 'markdownTableRightClick' }, { frameId: info.frameId },
            );
            break;
        case 'tsvTable':
            await handleInteraction(
                tab, { category: 'tsvTableRightClick' }, { frameId: info.frameId },
            );
            break;
        case 'csvTable':
            await handleInteraction(
                tab, { category: 'csvTableRightClick' }, { frameId: info.frameId },
            );
            break;
        case 'jsonTable':
            if (jsonDestination === 'file') {
                let havePerm;
                try {
                    // The permissions request must be the first async function call in
                    // the event handler or it will throw an error.
                    havePerm = await browser.permissions.request({ permissions: ['downloads'] });
                } catch (err) {
                    await showStatus(0, 'Error', err.message);
                    return;
                }
                if (!havePerm) {
                    await showStatus(0, 'Error', 'Unable to download JSON without permission');
                    return;
                }
            }

            await handleInteraction(
                tab, { category: 'jsonTableRightClick' }, { frameId: info.frameId },
            );
            break;
        case 'htmlTable':
            await handleInteraction(
                tab, { category: 'htmlTableRightClick' }, { frameId: info.frameId },
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
async function handleInteraction(tab, message, options = {}, successStatus = 1) {
    if (tab.url.endsWith('.pdf')) {
        await showStatus(0, 'Error', 'Stardown cannot run on PDFs');
        return;
    }

    message.id = Math.random(); // why: https://github.com/Stardown-app/Stardown/issues/98

    let status, notifTitle, notifBody;
    try {
        console.log('Sending message from background.js to content.js');
        const response = await browser.tabs.sendMessage(tab.id, message, options);
        if (response === null) {
            console.log('Response is null');
            return;
        } else if (response === undefined) {
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
    if (status === 1) { // success
        await showStatus(successStatus, notifTitle, notifBody);
    } else { // failure
        await showStatus(status, notifTitle, notifBody);
    }
}

/**
 * handleCopyAllTabs handles a request from the user to create a markdown list of links,
 * and sends it to the content script to be copied. A status indicator is then shown
 * to the user.
 * @param {any} activeTab
 * @returns {Promise<void>}
 */
async function handleCopyAllTabs(activeTab) {
    // figure out which tabs to create links for
    let tabs = await browser.tabs.query({ currentWindow: true, highlighted: true });
    if (tabs.length === 1) { // if only one tab is highlighted
        // get unhighlighted tabs
        const copyTabsWindows = await getSetting('copyTabsWindows');
        if (copyTabsWindows === 'current') {
            tabs = await browser.tabs.query({ currentWindow: true });
        } else if (copyTabsWindows === 'all') {
            tabs = await browser.tabs.query({});
        }
    }

    // create the links
    let text = '';
    switch (markupLanguage) {
        case 'html':
            const result = ['<ul>'];
            for (let i = 0; i < tabs.length; i++) {
                const anchor = `  <li><a href="${tabs[i].url}">${tabs[i].title}</a></li>`;
                result.push(anchor);
            }
            result.push('</ul>');
            text = result.join('\n');
            break;
        case 'markdown':
        case 'markdown with some html':
            const mdSubBrackets = await getSetting('mdSubBrackets');
            const links = await Promise.all(
                tabs.map(tab => createTabLink(tab, mdSubBrackets))
            );
            const mdBulletPoint = await getSetting('mdBulletPoint');
            text = links.map(link => `${mdBulletPoint} ${link}\n`).join('');
            break;
        default:
            await showStatus(0, 'Error', 'Unsupported markup language');
            return;
    }

    const message = { category: 'copyText', text: text };
    const options = {};
    await handleInteraction(activeTab, message, options, tabs.length);
}

/**
 * downloadFile downloads a file to the user's computer. This must be in the background
 * script because `browser.downloads` appears to always be undefined in content scripts.
 * @param {object} fileObj - the object containing info about a file to download.
 * @param {string} fileObj.filename - the name of the file to download.
 * @param {string|undefined} fileObj.json - the content of the file to download if the
 * file is JSON.
 * @returns {Promise<void>}
 */
async function downloadFile(fileObj) {
    if (fileObj.json) {
        const json = fileObj.json;
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const filename = fileObj.filename || 'file.json';
        await browser.downloads.download({
            url: url,
            filename: filename,
            saveAs: true,
            conflictAction: 'uniquify',
        }).then(
            id => console.log('Download started with ID', id),
            err => console.error('Download failed:', err),
        );
    } else {
        console.error('No content to download');
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
    if (status > 0) { // success
        await brieflyShowCheck(status);
        const notifyOnSuccess = await getSetting('notifyOnSuccess');
        if (notifyOnSuccess) {
            await showNotification(notifTitle, notifBody);
        }
    } else { // failure
        console.error(`${notifTitle}: ${notifBody}`);
        if (notifBody === 'Could not establish connection. Receiving end does not exist.') {
            notifBody = "Stardown wasn't ready or wasn't allowed to load into the frame.";
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
