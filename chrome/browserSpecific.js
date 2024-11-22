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
    return `Navigate to <code>chrome://extensions/shortcuts</code>`;
}

/**
 * createContextMenus creates the context menu options.
 * @param {string} markupLanguage - the markup language the user chose.
 * @returns {void}
 */
export function createContextMenus(markupLanguage) {
    // This function should do nothing. It needs to exist because the Firefox extension
    // uses a function by the same name that is imported into the background script.
}

/**
 * isTableSelected is a flag that indicates whether a table is currently selected.
 * @type {boolean}
 */
let isTableSelected = false;

/**
 * updateContextMenu changes which options are in the context menu based on the category
 * of HTML element the mouse is interacting with. This only has an effect if the context
 * menu is not currently visible.
 * @param {string} context - info about the element the mouse is interacting with.
 * @param {string} markupLanguage - the markup language the user chose.
 * @returns {Promise<void>}
 */
export async function updateContextMenu(context, markupLanguage) {
    // The `browser.contextMenus.update` method doesn't work well in Chromium because
    // when it's used to hide all but one context menu option, the one remaining would
    // appear under a "Stardown" parent menu option instead of being in the root of the
    // context menu.

    if (isTableSelected && context.selectionchange) {
        isTableSelected = false;
    }

    if (!isTableSelected) {
        browser.contextMenus.removeAll();

        if (context.mouseup === 'table') {
            isTableSelected = true;
            browser.contextMenus.create(menu.markdownTableItem);
            browser.contextMenus.create(menu.tsvTableItem);
            browser.contextMenus.create(menu.csvTableItem);
            browser.contextMenus.create(menu.jsonTableItem);
            browser.contextMenus.create(menu.htmlTableItem);
        } else {
            if (context.mouseover === 'image') {
                browser.contextMenus.create(menu.imageItem);
            } else if (context.mouseover === 'link') {
                browser.contextMenus.create(menu.linkItem);
            }

            browser.contextMenus.create(menu.selectionItem);
            browser.contextMenus.create(menu.pageItem);
            browser.contextMenus.create(menu.pageSectionItem);
            browser.contextMenus.create(menu.videoItem);
            browser.contextMenus.create(menu.audioItem);
        }

        updateContextMenuLanguage(markupLanguage);
    }
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

    browser.contextMenus.update('page', {
        title: `Copy ${markupLanguage} link for this page`,
    }, () => { if (browser.runtime.lastError) return; });
    browser.contextMenus.update('pageSection', {
        title: `Copy ${markupLanguage} link for this section`,
    }, () => { if (browser.runtime.lastError) return; });
    browser.contextMenus.update('selection', {
        title: `Copy ${markupLanguage} of selection`,
    }, () => { if (browser.runtime.lastError) return; });
    browser.contextMenus.update('link', {
        title: `Copy ${markupLanguage} of link`,
    }, () => { if (browser.runtime.lastError) return; });
    browser.contextMenus.update('image', {
        title: `Copy ${markupLanguage} of image`,
    }, () => { if (browser.runtime.lastError) return; });
    browser.contextMenus.update('video', {
        title: `Copy ${markupLanguage} of video`,
    }, () => { if (browser.runtime.lastError) return; });
    browser.contextMenus.update('audio', {
        title: `Copy ${markupLanguage} of audio`,
    }, () => { if (browser.runtime.lastError) return; });
}
