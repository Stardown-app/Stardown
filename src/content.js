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

import { browser, handleCopyRequest } from './browserSpecific.js';
import * as md from './generators/md.js';
import * as htmlSelection from './htmlSelection.js';
import { handleCopyPageRequest } from './htmlPage.js';
import { createTextFragmentArg } from './createTextFragmentArg.js';
import { getSetting, sendToNotepad } from './utils.js';
import { removeIdAndTextFragment } from './converters/utils/urls.js';
import { htmlTableToJson } from './converters/json.js';
import { htmlTableToCsv } from './converters/csv.js';

/**
 * A response object sent from a content script to a background script.
 * @typedef {object} ContentResponse
 * @property {number} status - the number of markdown items successfully created and
 * written to the clipboard. Zero means failure, and one or above means success.
 * @property {string} notifTitle - the title of the notification to show to the user.
 * @property {string} notifBody - the body of the notification to show to the user.
 */

/**
 * clickedElement is the element the user most recently right-clicked. It is assigned
 * values by the contextmenu event listener in setUpListeners.
 * @type {EventTarget|null}
 */
let clickedElement;

/**
 * linkText is the text of the link the user most recently right-clicked. It is assigned
 * values by the contextmenu event listener in setUpListeners.
 * @type {string|null}
 */
let linkText = null;

/**
 * tableSelection is the table the user most recently selected and right-clicked. It is
 * assigned values by the mouseup event listener in setUpListeners.
 * @type {Selection|null}
 */
let tableSelection = null;

/**
 * setUpListeners sets up listeners.
 * @returns {void}
 */
function setUpListeners() {

    document.addEventListener('mouseover', (event) => {
        // This event listener detects when the mouse is over an element that is a
        // selection, image, or link and sends a message to the background script so it
        // can load the correct context menu items. This is necessary because the
        // context menu cannot be updated while it is visible. If the mouse is over more
        // than one of selection, image, and link, the one message sent will only
        // contain the first of those that was detected.
        const s = window.getSelection();
        if (s && s.type === 'Range') {
            browser.runtime.sendMessage({
                destination: 'background',
                category: 'updateContextMenu',
                context: { mouseover: 'selection' },
            });
        } else if (event.target.nodeName === 'IMG') {
            browser.runtime.sendMessage({
                destination: 'background',
                category: 'updateContextMenu',
                context: { mouseover: 'image' },
            });
        } else if (event.target.nodeName === 'A') {
            browser.runtime.sendMessage({
                destination: 'background',
                category: 'updateContextMenu',
                context: { mouseover: 'link' },
            });
        }
    });

    document.addEventListener('mouseup', async (event) => {
        // This event listener detects when the user has selected a table and sends a
        // message to the background script so it can load the correct context menu
        // items.
        const selection = window.getSelection();
        if (!selection || selection.type !== 'Range') {
            return;
        }

        /** @type {DocumentFragment} */
        const frag = await htmlSelection.getSelectionFragment(selection);
        const isTable = frag?.firstChild?.nodeName === 'TABLE';
        if (isTable) {
            tableSelection = selection;
            browser.runtime.sendMessage({
                destination: 'background',
                category: 'updateContextMenu',
                context: { mouseup: 'table' },
            });
        } else {
            tableSelection = null;
        }
    });

    document.addEventListener('selectionchange', async (event) => {
        // This event listener detects when the user has deselected a table and sends a
        // message to the background script so it can load the correct context menu
        // items.
        browser.runtime.sendMessage({
            destination: 'background',
            category: 'updateContextMenu',
            context: { selectionchange: 'selection' },
        });
    });

    document.addEventListener('contextmenu', (event) => {
        clickedElement = event.target;

        if (event.target.nodeName === 'A') {
            linkText = event.target.textContent;
        } else if (event.target.parentElement.nodeName === 'A') {
            // Some anchors such as
            // [these](https://developer.mozilla.org/en-US/docs/Learn/HTML/Tables/Advanced#:~:text=is%20by%20using-,%3Cthead%3E%2C%20%3Ctbody%3E%2C%20and%20%3Ctfoot%3E,-%2C%20which%20allow%20you)
            // contain another element. The inner element is the event target, and the
            // anchor is its parent.
            linkText = event.target.parentElement.textContent;
        } else {
            linkText = null;
        }
    });

    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.destination !== 'content') {
            return;
        }

        // In Chromium, this listener must be synchronous and must send a response
        // immediately. True must be sent if the actual response will be sent
        // asynchronously.
        console.log('content.js received message');

        handleRequest(message).then((res) => {
            sendResponse(res);
        });

        return true; // needed to keep the message channel open for async responses
    });
}

// Chromium requires setUpListeners to be called when the window loads. If it's only
// called immediately, the content script will not be able to receive messages and no
// error message will appear. It's fine to also call it immediately.
window.onload = setUpListeners;

// Firefox requires setUpListeners to be called immediately. If it's only called in
// window.onload, the content script will not be able to receive messages and an error
// message will appear: "Error: Could not establish connection. Receiving end does not
// exist." Firefox also requires setUpListeners to NOT be called in window.onload, or
// else pressing Stardown's copy shortcut for some sites will show the error message
// "Clipboard write is not allowed" even though writing to the clipboard is still
// successful. The bundle script should comment out the `window.onload` assignment for
// Firefox.
setUpListeners();

/**
 * lastRequestId is the ID of the last request sent from background.js to content.js. It
 * is used to prevent duplicate requests from being processed. This is necessary because
 * Chromium duplicates requests for some reason, which can cause the wrong output
 * configuration to be used if not handled carefully. More details in
 * https://github.com/Stardown-app/Stardown/issues/98.
 * @type {number|null}
 */
let lastRequestId = null;

/**
 * handleRequest processes a message from the background script and returns a response.
 * @param {object} message - the message object sent from the background script. Must
 * have `category` and `id` properties and may have other properties depending on the
 * category.
 * @param {string} message.category - the category of the message.
 * @param {number} message.id - the ID of the message.
 * @returns {Promise<ContentResponse|null>}
 */
async function handleRequest(message) {
    if (message.id === lastRequestId) {
        console.log(`Ignoring duplicate request: ${message.category}`);
        return null;
    }
    lastRequestId = message.id;
    console.log('Handling request:', message.category);

    switch (message.category) {
        case 'copyText':
            await sendToNotepad(message.text);
            // write to the clipboard & return a response
            return await handleCopyRequest(message.text);
        case 'copySelectionShortcut':
            // respond to use of the copy keyboard shortcut or copy button
            return await handleCopySelectionShortcut();
        case 'copyEntirePageShortcut':
            return await handleCopyPageRequest();
        case 'pageRightClick':
            const id1 = await getClickedElementId(clickedElement);
            return await handlePageRightClick(id1);
        case 'selectionRightClick':
            const selection1 = window.getSelection();
            const id2 = await getClickedElementId(clickedElement);
            return await handleSelectionCopyRequest(id2, selection1);
        case 'linkRightClick':
            const linkMd = await md.createLink(linkText, message.linkUrl);
            await sendToNotepad(linkMd);
            return await handleCopyRequest(linkMd);
        case 'imageRightClick':
            const imageMd = await md.createImage(message.srcUrl);
            await sendToNotepad(imageMd + '\n');
            return await handleCopyRequest(imageMd + '\n');
        case 'videoRightClick':
            const videoMd = await md.createVideo(message.srcUrl, message.pageUrl);
            await sendToNotepad(videoMd + '\n');
            return await handleCopyRequest(videoMd + '\n');
        case 'audioRightClick':
            const audioMd = await md.createAudio(message.srcUrl, message.pageUrl);
            await sendToNotepad(audioMd + '\n');
            return await handleCopyRequest(audioMd + '\n');
        case 'markdownTableRightClick':
            const id3 = await getClickedElementId(clickedElement);
            return await handleSelectionCopyRequest(id3, tableSelection);
        case 'tsvTableRightClick':
            return await handleCsvTableRightClick(tableSelection, '\t');
        case 'csvTableRightClick':
            return await handleCsvTableRightClick(tableSelection, ',');
        case 'jsonTableRightClick':
            return await handleJsonTableRightClick(tableSelection);
        case 'htmlTableRightClick':
            /** @type {DocumentFragment} */
            const tableFrag = await htmlSelection.getSelectionFragment(tableSelection);
            if (tableFrag === null) {
                return null;
            }
            const h = tableFrag.firstChild.outerHTML;
            await sendToNotepad(h);
            return await handleCopyRequest(h);
        default:
            console.error('Unknown message category:', message.category);
            throw new Error('Unknown message category:', message.category);
    }
}

/**
 * getClickedElementId gets the ID of the element that was right-clicked. If the element
 * doesn't have an ID, it looks at its parent element. This repeats until an element
 * with an ID is found, or until the root of the DOM is reached.
 * @param {EventTarget|null} clickedElement - the element that was right-clicked.
 * @returns {Promise<string>} - the ID of the element that was right-clicked. If no
 * element with an ID was found, an empty string is returned.
 */
async function getClickedElementId(clickedElement) {
    // if clickedElement doesn't have an id, look at its parent
    while (clickedElement && !clickedElement.id) {
        clickedElement = clickedElement.parentElement;
    }

    if (clickedElement && clickedElement.id) {
        return clickedElement.id;
    } else {
        console.log('No HTML element with an ID was found in the clicked path');
        return '';
    }
}

/**
 * handleCopySelectionShortcut handles a request from the user to copy a selection.
 * @returns {Promise<ContentResponse>}
 */
async function handleCopySelectionShortcut() {
    const selection = window.getSelection();
    if (selection && selection.type === 'Range') {
        // only allow Range (and not Caret) selections or else every copy request will
        // count as a selection click
        return await handleSelectionCopyRequest('', selection);
    }

    const markupLanguage = await getSetting('markupLanguage');
    switch (markupLanguage) {
        case 'markdown':
        case 'markdown with some html':
            const linkMd = await md.createLink(document.title, location.href);
            await sendToNotepad(linkMd);
            return await handleCopyRequest(linkMd);
        case 'html':
            const anchor = `<a href="${location.href}">${document.title}</a>`;
            await sendToNotepad(anchor);
            return await handleCopyRequest(anchor);
        default:
            console.error('Unknown markup language:', markupLanguage);
            throw new Error('Unknown markup language:', markupLanguage);
    }
}

/**
 * handlePageRightClick handles a right-click on a page.
 * @param {string} htmlId - the ID of the HTML element that was right-clicked.
 * @returns {Promise<ContentResponse>}
 */
async function handlePageRightClick(htmlId) {
    let title = document.title;
    let url = removeIdAndTextFragment(location.href);
    if (htmlId) {
        url += '#' + htmlId;
    }

    const link = await md.createLink(title, url);
    await sendToNotepad(link);
    return await handleCopyRequest(link);
}

/**
 * handleSelectionCopyRequest handles a request to copy a selection.
 * @param {string} htmlId - the ID of the HTML element that was right-clicked.
 * @param {Selection} selection - a selection object.
 * @returns {Promise<ContentResponse>}
 */
async function handleSelectionCopyRequest(htmlId, selection) {
    let title = document.title;
    let url = removeIdAndTextFragment(location.href);

    let arg = ''; // the text fragment argument
    const createTextFragment = await getSetting('createTextFragment');
    if (createTextFragment && selection && selection.type === 'Range') {
        arg = createTextFragmentArg(selection);
    }

    if (htmlId || arg) {
        url += '#';
        if (htmlId) {
            url += htmlId;
        }
        if (arg) {
            url += `:~:text=${arg}`;
        }
    }

    const text = await htmlSelection.createText(title, url, selection);

    return await handleCopyRequest(text);
}

/**
 * handleCsvTableRightClick handles a right-click on a table to convert it to CSV and
 * write it to the clipboard.
 * @param {Selection} tableSelection
 * @param {string} delimiter - what to separate fields with.
 * @returns {Promise<ContentResponse>}
 */
async function handleCsvTableRightClick(tableSelection, delimiter = ',') {
    /** @type {DocumentFragment} */
    let frag = await htmlSelection.getSelectionFragment(tableSelection);

    let text = '';
    if (frag === null) {
        text = tableSelection.textContent;
    } else {
        text = await htmlTableToCsv(frag, delimiter);
    }

    await sendToNotepad(text);
    return await handleCopyRequest(text);
}

/**
 * handleJsonTableRightClick handles a right-click on a table to convert it to JSON and
 * either write it to the clipboard or a file.
 * @param {Selection} tableSelection
 * @returns {Promise<ContentResponse|null>}
 */
async function handleJsonTableRightClick(tableSelection) {
    /** @type {DocumentFragment} */
    let frag = await htmlSelection.getSelectionFragment(tableSelection);
    if (frag === null) {
        const text = tableSelection.textContent;
        await sendToNotepad(text);
        return await handleCopyRequest(text);
    }

    const tableJson = await htmlTableToJson(frag);

    const jsonDestination = await getSetting('jsonDestination');
    if (jsonDestination === 'clipboard') {
        await sendToNotepad(tableJson);
        return await handleCopyRequest(tableJson);
    }

    // Tell the background what to download because apparently `browser.downloads` is
    // always undefined in content scripts.
    browser.runtime.sendMessage({
        destination: 'background',
        category: 'downloadFile',
        file: {
            name: 'table.json',
            type: 'json',
            json: tableJson,
        }
    });
    return null;
}
