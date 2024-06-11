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

import * as menu from './menu.js';

browser.action = browser.browserAction; // for manifest v2 compatibility

/**
 * createContextMenus creates the context menu options.
 * @returns {void}
 */
export function createContextMenus() {
    browser.runtime.onInstalled.addListener(() => {
        browser.contextMenus.create(menu.pageItem);
        browser.contextMenus.create(menu.selectionItem);
        browser.contextMenus.create(menu.linkItem);
        browser.contextMenus.create(menu.imageItem);
        browser.contextMenus.create(menu.videoItem);
        browser.contextMenus.create(menu.audioItem);
    });
}

/**
 * updateContextMenu updates the options in the context menu based on the message from
 * the content script. This only works if the context menu is not visible.
 * @param {object} message - the message from the content script.
 * @param {boolean} message.isImage - whether the mouse is over an image.
 * @param {boolean} message.isLink - whether the mouse is over a link.
 * @returns {void}
 */
export function updateContextMenu(message) {
    if (message.isImage) {
        browser.contextMenus.update('link', { visible: false });
        browser.contextMenus.update('image', { visible: true });
    } else if (message.isLink) {
        browser.contextMenus.update('link', { visible: true });
        browser.contextMenus.update('image', { visible: false });
    }
}

/**
 * @typedef {import('../src/content.js').ContentResponse} ContentResponse
 */

/**
 * handleCopyRequest writes text to the clipboard and returns a content response object.
 * @param {string} text - the text to copy to the clipboard.
 * @returns {Promise<ContentResponse>}
 */
export async function handleCopyRequest(text) {
    try {
        await navigator.clipboard.writeText(text);
    } catch (err) {
        console.error(err);
        return {
            status: 0, // failure
            notifTitle: 'Failed to copy markdown',
            notifBody: err.message,
        };
    }
    return {
        status: 1, // successfully copied one item
        notifTitle: 'Markdown copied',
        notifBody: 'Your markdown can now be pasted',
    };
}
