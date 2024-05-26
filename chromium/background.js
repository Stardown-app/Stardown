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

import { getSetting } from "./common";

if (typeof browser === 'undefined') {
    var browser = chrome;
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
            console.error(err);
            await showNotification('Error', err.message);
            await brieflyShowX();
            return;
        }
        if (!havePerm) {
            return;
        }

        lastClick = new Date(0);
        await handleDoubleClick();
        return;
    }
    // it's a single-click
    lastClick = now;

    const errStr = await scriptWriteLinkToClipboard(tab, '');
    if (errStr === null) {
        await brieflyShowCheckmark(1);
    } else {
        await showNotification('Error', errStr);
        await brieflyShowX();
    }
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

browser.runtime.onMessage.addListener((message) => {
    updateContextMenu(message);
});

function updateContextMenu(message) {
    // These context menu updates are done with messages from a content script because
    // the contextMenus.update method cannot update a context menu that is already open.
    // The content script listens for mouseover events.

    // Doing this with the `update` method doesn't work well in Chromium because the
    // remaining context menu option would still be under a "Stardown" parent menu
    // option instead of being directly in the context menu.
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
}

browser.contextMenus.onClicked.addListener(async (info, tab) => {
    const notify = await getSetting('notify', false);

    switch (info.menuItemId) {
        case 'page':
            await sendIdLinkCopyMessage(info, tab, 'page');
            await brieflyShowCheckmark(1);
            if (notify) {
                await showNotification('Markdown copied', 'Your markdown can now be pasted');
            }
            break;
        case 'selection':
            await sendIdLinkCopyMessage(info, tab, 'selection');
            await brieflyShowCheckmark(1);
            if (notify) {
                await showNotification('Markdown copied', 'Your markdown can now be pasted');
            }
            break;
        case 'link':
            // In Chromium, `info.linkText` is undefined, and no other property in
            // `info` has the link's text.
            const linkText = await browser.tabs.sendMessage(tab.id, { category: 'getLinkText' });
            const linkMd = await createLinkMarkdown(linkText, info.linkUrl);
            const {
                title: linkNotifTitle, body: linkNotifBody
            } = await browser.tabs.sendMessage(tab.id, {
                category: 'link',
                markdown: linkMd,
            });
            await brieflyShowCheckmark(1);
            if (notify) {
                await showNotification(linkNotifTitle, linkNotifBody);
            }
            break;
        case 'image':
            const imageMd = await createImageMarkdown(info, tab);
            const {
                title: imgNotifTitle, body: imgNotifBody
            } = await browser.tabs.sendMessage(tab.id, {
                category: 'image',
                markdown: imageMd + '\n',
            });
            await brieflyShowCheckmark(1);
            if (notify) {
                await showNotification(imgNotifTitle, imgNotifBody);
            }
            break;
        case 'video':
            await copyMediaLinkMarkdown(info, tab, 'video');
            break;
        case 'audio':
            await copyMediaLinkMarkdown(info, tab, 'audio');
            break;
        default:
            console.error(`Unknown context menu item: ${info.menuItemId}`);
    }
});

browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.doubleClickInterval) {
        doubleClickInterval = message.doubleClickInterval;
    } else if (message.error) {
        await showNotification('Error', message.error);
    }
});

async function handleDoubleClick() {
    let tabs = await browser.tabs.query({ currentWindow: true, highlighted: true });
    if (tabs.length === 1) {
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
    const text = links.map(link => `${bulletPoint} ${link}\n`).join('');
    const activeTab = tabs.find(tab => tab.active);
    const errStr = await scriptWriteToClipboard(activeTab, text);
    if (errStr === null) {
        await brieflyShowCheckmark(tabs.length);
    } else {
        await showNotification('Error', errStr);
        await brieflyShowX();
    }
}

/**
 * sendIdLinkCopyMessage sends a message to the content script to get the ID of the
 * right-clicked HTML element and then writes a markdown link to the clipboard.
 * @param {any} info - the context menu info.
 * @param {any} tab - the tab that the context menu was clicked in.
 * @param {string} category - the category of the content to copy.
 * @returns {Promise<void>}
 */
async function sendIdLinkCopyMessage(info, tab, category) {
    browser.tabs.sendMessage(
        tab.id,
        { category: category },  // this will be the first input to the onMessage listener
        { frameId: info.frameId },
        async function (clickedElementId) {
            // clickedElementId may be undefined, an empty string, or a non-empty string
            const errStr = await scriptWriteLinkToClipboard(tab, clickedElementId);
            if (errStr !== null) {
                await showNotification('Error', errStr);
                await brieflyShowX();
            }
        }
    );
}

/**
 * createLinkMarkdown creates a markdown link. The title and URL are escaped, and any
 * square brackets are replaced depending on the settings.
 * @param {string} title - the title of the link.
 * @param {string} url - the URL of the link.
 * @returns {Promise<string>}
 */
async function createLinkMarkdown(title, url) {
    const subBrackets = await getSetting('subBrackets', 'underlined');
    title = await replaceBrackets(title, subBrackets);
    title = await escapeMarkdown(title);
    url = url.replaceAll('(', '%28').replaceAll(')', '%29');
    return `[${title}](${url})`;
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

    const title = await replaceBrackets(tab.title, subBrackets);
    const url = tab.url.replaceAll('(', '%28').replaceAll(')', '%29');

    return `[${title}](${url})`;
}

/**
 * scriptWriteToClipboard writes text to the clipboard in a tab. This function expects
 * the tabs permission and will fail silently if the tabs permission has not been
 * granted and the document is not focused.
 * @param {any} tab - the tab to write text to the clipboard in.
 * @param {string} text - the text to write to the clipboard.
 * @returns {Promise<string|null>} - a Promise that resolves to null if the text was
 * written to the clipboard successfully, or an error message if not.
 */
async function scriptWriteToClipboard(tab, text) {
    let injectionResult;
    try {
        injectionResult = await browser.scripting.executeScript({
            target: { tabId: tab.id },
            args: [text],
            function: (text) => {
                return (async () => {
                    // This script assumes the tabs permission has been granted. If it
                    // has not been granted, `navigator.clipboard.writeText` will fail
                    // silently when the document is not focused.
                    // if (!document.hasFocus()) {
                    //     return 'Click the page and try again';
                    // }

                    await navigator.clipboard.writeText(text);
                    return null;
                })();
            },
        });
    } catch (err) {
        return err.message;
    }

    // `injectionResult[0].result` is whatever the injected script returned.
    return injectionResult[0].result;
}

/**
 * scriptWriteLinkToClipboard copies to the clipboard a markdown link for a tab,
 * optionally including an HTML element ID, and/or a text fragment, and/or a markdown
 * blockquote depending on the settings and whether text is selected. Browsers that
 * support text fragments will try to use them first, and use the ID as a fallback if
 * necessary.
 * @param {any} tab - the tab to copy the link from.
 * @param {string|undefined} id - the ID of the HTML element to link to. If falsy, no ID
 * is included in the link.
 * @returns {Promise<string|null>} - a Promise that resolves to null if the text was
 * copied successfully, or an error message if not.
 */
async function scriptWriteLinkToClipboard(tab, id) {
    if (!id) {
        id = '';
    }

    const subBrackets = await getSetting('subBrackets', 'underlined');

    let injectionResult;
    try {
        injectionResult = await browser.scripting.executeScript({
            target: { tabId: tab.id },
            args: [id, subBrackets],
            function: (id, subBrackets) => {
                return (async () => {
                    let title = document.title;
                    let url = location.href.replaceAll('(', '%28').replaceAll(')', '%29');

                    // Remove any preexisting HTML element ID and/or text fragment from
                    // the URL. If the URL has an HTML element ID, any text fragment
                    // will also be in the `hash` attribute of its URL object. However,
                    // if the URL has a text fragment but no HTML element ID, the text
                    // fragment may be in the `pathname` attribute of its URL object
                    // along with part of the URL that should not be removed.
                    const urlObj = new URL(url);
                    urlObj.hash = '';  // remove HTML element ID and maybe text fragment
                    if (urlObj.pathname.includes(':~:text=')) {
                        urlObj.pathname = urlObj.pathname.split(':~:text=')[0];
                    }
                    url = urlObj.toString();

                    let selectedText;
                    let arg;  // the text fragment argument
                    const selection = window.getSelection();
                    if (selection) {
                        selectedText = selection.toString().trim();
                        arg = createTextFragmentArg(selection);
                    }

                    if (id || arg) {
                        url += '#';
                        if (id) {
                            url += id;
                        }
                        if (arg) {
                            url += `:~:text=${arg}`;
                        }
                    }

                    let text;
                    if (!selectedText) {
                        title = await replaceBrackets(title, subBrackets);
                        title = await escapeMarkdown(title);
                        text = `[${title}](${url})`;
                    } else {
                        const linkFormat = await getSetting('linkFormat', 'blockquote');
                        switch (linkFormat) {
                            case 'title':
                                title = await replaceBrackets(title, subBrackets);
                                title = await escapeMarkdown(title);
                                text = `[${title}](${url})`;
                                break;
                            case 'selected':
                                selectedText = await replaceBrackets(selectedText, subBrackets);
                                selectedText = await escapeMarkdown(selectedText);
                                selectedText = selectedText.replaceAll('\n', ' ');
                                text = `[${selectedText}](${url})`;
                                break;
                            case 'blockquote':
                                title = await replaceBrackets(title, subBrackets);
                                title = await escapeMarkdown(title);
                                selectedText = await escapeMarkdown(selectedText.replaceAll('[', '\\['));
                                text = await createBlockquoteMarkdown(selectedText, title, url);
                                break;
                            default:
                                console.error(`Unknown linkFormat: ${linkFormat}`);
                                throw new Error(`Unknown linkFormat: ${linkFormat}`);
                        }
                    }

                    // `navigator.clipboard.writeText` only works in a script if the
                    // document is focused, or if the tabs permission has been granted.
                    // Probably for security reasons, `document.body.focus()` doesn't
                    // work here. Whether the document is focused doesn't seem to be an
                    // issue in Firefox, unless that's just because the Firefox version
                    // of Stardown doesn't have to inject a script to write to the
                    // clipboard.
                    if (!document.hasFocus()) {
                        return 'Click the page and try again';
                    }

                    await navigator.clipboard.writeText(text);
                    return null;
                })();
            },
        });
    } catch (err) {
        return err.message;
    }

    // `injectionResult[0].result` is whatever the injected script returned.
    return injectionResult[0].result;
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
 * createImageMarkdown creates markdown of an image.
 * @param {any} info - the context menu info.
 * @param {any} tab - the tab that the context menu was clicked in.
 * @returns {Promise<string>}
 */
async function createImageMarkdown(info, tab) {
    const url = info.srcUrl;
    const fileName = url.replaceAll('(', '%28').replaceAll(')', '%29').split('/').pop();
    return `![${fileName}](${url})`;
}

/**
 * copyMediaLinkMarkdown creates and copies markdown of a media link.
 * @param {any} info - the context menu info. This object should have a `pageUrl`
 * property and maybe a `srcUrl` property.
 * @param {any} tab - the tab that the context menu was clicked in.
 * @param {string} category - the category of the media link.
 */
async function copyMediaLinkMarkdown(info, tab, category) {
    let url = info.srcUrl;
    if (!url) {
        url = info.pageUrl;
    }
    url = url.replaceAll('(', '%28').replaceAll(')', '%29');
    const md = `[${category}](${url})`;
    const {
        title: notifTitle, body: notifBody
    } = await browser.tabs.sendMessage(tab.id, {
        category: category,
        markdown: md,
    });
    await brieflyShowCheckmark(1);
    if (notify) {
        await showNotification(notifTitle, notifBody);
    }
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
 * showNotification shows the user a notification.
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

async function brieflyShowCheckmark(linkCount) {
    if (linkCount === 0) {
        await showNotification('Error', 'No links to copy');
        await brieflyShowX();
        return;
    } else if (linkCount === 1) {
        browser.action.setBadgeText({ text: '✓' });
    } else {
        browser.action.setBadgeText({ text: `${linkCount} ✓` });
    }
    browser.action.setBadgeBackgroundColor({ color: 'green' });
    await sleep(1000);  // 1 second
    browser.action.setBadgeText({ text: '' });
}

async function brieflyShowX() {
    browser.action.setBadgeText({ text: '✗' });
    browser.action.setBadgeBackgroundColor({ color: 'red' });
    await sleep(1000);  // 1 second
    browser.action.setBadgeText({ text: '' });
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
