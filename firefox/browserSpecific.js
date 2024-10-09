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
 * sleep pauses the execution of the current async function for a number of
 * milliseconds.
 * @param {number} ms - the number of milliseconds to sleep.
 * @returns {Promise<void>}
 */
export async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * getShortcutInstructions returns instructions for managing extension shortcuts.
 * @returns {string}
 */
export function getShortcutInstructions() {
    return `See <a href="https://support.mozilla.org/en-US/kb/manage-extension-shortcuts-firefox" target="_blank">
        Manage extension shortcuts in Firefox
        </a>`;
}

/**
 * createContextMenus creates the context menu options.
 * @param {string} markupLanguage - the markup language the user chose.
 * @returns {void}
 */
export function createContextMenus(markupLanguage) {
    browser.runtime.onInstalled.addListener(() => {
        browser.contextMenus.create(menu.pageSectionItem);
        browser.contextMenus.create(menu.selectionItem);
        browser.contextMenus.create(menu.linkItem);
        browser.contextMenus.create(menu.imageItem);
        browser.contextMenus.create(menu.videoItem);
        browser.contextMenus.create(menu.audioItem);
        browser.contextMenus.create(menu.markdownTableItem);
        browser.contextMenus.create(menu.tsvTableItem);
        browser.contextMenus.create(menu.csvTableItem);
        browser.contextMenus.create(menu.jsonTableItem);
        browser.contextMenus.create(menu.htmlTableItem);

        browser.contextMenus.update('markdownTable', { visible: false });
        browser.contextMenus.update('tsvTable', { visible: false });
        browser.contextMenus.update('csvTable', { visible: false });
        browser.contextMenus.update('jsonTable', { visible: false });
        browser.contextMenus.update('htmlTable', { visible: false });

        updateContextMenuLanguage(markupLanguage);
    });
}

/**
 * updateContextMenu changes which options are in the context menu based on the category
 * of HTML element the mouse is interacting with. This only has an effect if the context
 * menu is not currently visible.
 * @param {string} context - info about the element the mouse is interacting with.
 * @param {string} markupLanguage - the markup language the user chose.
 * @returns {Promise<void>}
 */
export async function updateContextMenu(context, markupLanguage) {
    switch (context.mouseover) {
        case 'selection':
            browser.contextMenus.update('link', { visible: false });
            browser.contextMenus.update('image', { visible: false });
            break;
        case 'image':
            browser.contextMenus.update('link', { visible: false });
            browser.contextMenus.update('image', { visible: true });
            break;
        case 'link':
            browser.contextMenus.update('link', { visible: true });
            browser.contextMenus.update('image', { visible: false });
            break;
    }

    if (context.mouseup === 'table') {
        await sleep(100); // wait for the context menu

        browser.contextMenus.update('selection', { visible: false });

        browser.contextMenus.update('markdownTable', { visible: true });
        browser.contextMenus.update('tsvTable', { visible: true });
        browser.contextMenus.update('csvTable', { visible: true });
        browser.contextMenus.update('jsonTable', { visible: true });
        browser.contextMenus.update('htmlTable', { visible: true });
    } else if (context.selectionchange) {
        browser.contextMenus.update('selection', { visible: true });

        browser.contextMenus.update('markdownTable', { visible: false });
        browser.contextMenus.update('tsvTable', { visible: false });
        browser.contextMenus.update('csvTable', { visible: false });
        browser.contextMenus.update('jsonTable', { visible: false });
        browser.contextMenus.update('htmlTable', { visible: false });
    }

    updateContextMenuLanguage(markupLanguage);
}

/**
 * updateContextMenuLanguage changes the context menu options to reflect the user's
 * chosen markup language.
 * @param {string} markupLanguage - the markup language the user chose.
 * @returns {void}
 */
export function updateContextMenuLanguage(markupLanguage) {
    if (markupLanguage === 'html') {
        markupLanguage = 'HTML';
    } else if (markupLanguage === 'markdown with some html') {
        markupLanguage = 'markdown';
    }

    browser.contextMenus.update('pageSection', {
        title: `Copy ${markupLanguage} link for this section`,
    });
    browser.contextMenus.update('selection', {
        title: `Copy ${markupLanguage} of selection`,
    });
    browser.contextMenus.update('link', {
        title: `Copy ${markupLanguage} of link`,
    });
    browser.contextMenus.update('image', {
        title: `Copy ${markupLanguage} of image`,
    });
    browser.contextMenus.update('video', {
        title: `Copy ${markupLanguage} of video`,
    });
    browser.contextMenus.update('audio', {
        title: `Copy ${markupLanguage} of audio`,
    });
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
            notifTitle: 'Failed to copy text',
            notifBody: err.message,
        };
    }
    return {
        status: 1, // successfully copied one item
        notifTitle: 'Text copied',
        notifBody: 'Your text can now be pasted',
    };
}
