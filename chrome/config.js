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

export const browser = chrome;

/**
 * createContextMenus creates the context menu options.
 * @returns {void}
 */
export function createContextMenus() {
    // This function should do nothing. It needs to exist because the Firefox extension
    // uses a function by the same name that is imported into the background script.
}

/**
 * updateContextMenu changes which options are in the context menu based on the category
 * of HTML element the mouse is over. This only has an effect if the context menu is not
 * currently visible.
 * @param {string} category - the category of the element the mouse is over.
 * @returns {void}
 */
export function updateContextMenu(category) {
    // The `browser.contextMenus.update` method doesn't work well in Chromium because
    // when it's used to hide all but one context menu option, the one remaining would
    // appear under a "Stardown" parent menu option instead of being in the root of the
    // context menu.
    browser.contextMenus.removeAll();

    if (category === 'image') {
        browser.contextMenus.create(menu.imageItem);
    } else if (category === 'link') {
        browser.contextMenus.create(menu.linkItem);
    }

    browser.contextMenus.create(menu.selectionItem);
    browser.contextMenus.create(menu.pageItem);
    browser.contextMenus.create(menu.videoItem);
    browser.contextMenus.create(menu.audioItem);
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
    // `navigator.clipboard.writeText` only works in Chromium if the document is
    // focused. Probably for security reasons, `document.body.focus()` doesn't work
    // here. Whether the document is focused doesn't seem to be an issue in Firefox.
    if (!document.hasFocus()) {
        console.info('The document is not focused');
        return {
            status: 0, // failure
            notifTitle: 'Error',
            notifBody: 'Please click the page and try again',
        };
    }

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
