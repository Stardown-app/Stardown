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

import * as menu from "./menu.js";

browser.action = browser.browserAction; // for manifest v2 compatibility

/**
 * sleep pauses the execution of the current async function for a number of
 * milliseconds.
 * @param {number} ms - the number of milliseconds to sleep.
 * @returns {Promise<void>}
 */
export async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
 * @returns {void}
 */
export function createContextMenus() {
    browser.runtime.onInstalled.addListener(() => {
        browser.contextMenus.create(menu.pageItem);
        browser.contextMenus.create(menu.pageSectionItem);
        browser.contextMenus.create(menu.selectionItem);
        browser.contextMenus.create(menu.selectionWithSourceItem);
        browser.contextMenus.create(menu.selectionQuoteItem);
        browser.contextMenus.create(menu.linkItem);
        browser.contextMenus.create(menu.imageItem);
        browser.contextMenus.create(menu.videoItem);
        browser.contextMenus.create(menu.audioItem);
        browser.contextMenus.create(menu.markdownTableItem);
        browser.contextMenus.create(menu.tsvTableItem);
        browser.contextMenus.create(menu.csvTableItem);
        browser.contextMenus.create(menu.jsonTableItem);
        browser.contextMenus.create(menu.htmlTableItem);

        browser.contextMenus.update("markdownTable", { visible: false });
        browser.contextMenus.update("tsvTable", { visible: false });
        browser.contextMenus.update("csvTable", { visible: false });
        browser.contextMenus.update("jsonTable", { visible: false });
        browser.contextMenus.update("htmlTable", { visible: false });
    });
}

/**
 * updateContextMenu changes which options are in the context menu based on the category
 * of HTML element the mouse is interacting with. This only has an effect if the context
 * menu is not currently visible.
 * @param {string} context - info about the element the mouse is interacting with.
 * @returns {Promise<void>}
 */
export async function updateContextMenu(context) {
    switch (context.mouseover) {
        case "selection":
            browser.contextMenus.update("link", { visible: false });
            browser.contextMenus.update("image", { visible: false });
            break;
        case "image":
            browser.contextMenus.update("link", { visible: false });
            browser.contextMenus.update("image", { visible: true });
            break;
        case "link":
            browser.contextMenus.update("link", { visible: true });
            browser.contextMenus.update("image", { visible: false });
            break;
    }

    if (context.mouseup === "table") {
        await sleep(100); // wait for the context menu

        browser.contextMenus.update("selection", { visible: false });
        browser.contextMenus.update("selectionWithSource", { visible: false });
        browser.contextMenus.update("selectionQuote", { visible: false });

        browser.contextMenus.update("markdownTable", { visible: true });
        browser.contextMenus.update("tsvTable", { visible: true });
        browser.contextMenus.update("csvTable", { visible: true });
        browser.contextMenus.update("jsonTable", { visible: true });
        browser.contextMenus.update("htmlTable", { visible: true });
    } else if (context.selectionchange) {
        browser.contextMenus.update("selection", { visible: true });
        browser.contextMenus.update("selectionWithSource", { visible: true });
        browser.contextMenus.update("selectionQuote", { visible: true });

        browser.contextMenus.update("markdownTable", { visible: false });
        browser.contextMenus.update("tsvTable", { visible: false });
        browser.contextMenus.update("csvTable", { visible: false });
        browser.contextMenus.update("jsonTable", { visible: false });
        browser.contextMenus.update("htmlTable", { visible: false });
    }
}
