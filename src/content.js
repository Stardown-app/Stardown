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

import { browser, handleCopyRequest } from './config.js';
import * as md from './md.js';
import * as htmlSelection from './htmlSelection.js';
import { createTextFragmentArg } from './createTextFragmentArg.js';
import { getSetting } from './common.js';
import { removeIdAndTextFragment } from './converters/urls.js';
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
            browser.runtime.sendMessage({ context: { mouseover: 'selection' } });
        } else if (event.target.nodeName === 'IMG') {
            browser.runtime.sendMessage({ context: { mouseover: 'image' } });
        } else if (event.target.nodeName === 'A') {
            browser.runtime.sendMessage({ context: { mouseover: 'link' } });
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
        const html = await htmlSelection.getSelectionHtml(selection);
        const isTable = html.startsWith('<table');
        if (isTable) {
            tableSelection = selection;
            browser.runtime.sendMessage({ context: { mouseup: 'table' } });
        } else {
            tableSelection = null;
        }
    });

    document.addEventListener('selectionchange', async (event) => {
        // This event listener detects when the user has deselected a table and sends a
        // message to the background script so it can load the correct context menu
        // items.
        browser.runtime.sendMessage({ context: { selectionchange: 'selection' } });
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
// else clicking Stardown's icon for some sites will show the error message "Clipboard
// write is not allowed" even though writing to the clipboard is still successful. The
// bundle script should comment out the `window.onload` assignment for Firefox.
setUpListeners();

/**
 * lastRequestId is the ID of the last request sent from background.js to content.js. It
 * is used by certain request categories to prevent duplicate requests from being
 * processed. This is necessary because Chromium sometimes duplicates requests for some
 * reason, which can cause the wrong output configuration to be used if not handled
 * carefully.
 * @type {number|null}
 */
let lastRequestId = null;

/**
 * handleRequest processes a message from the background script and returns a response.
 * @param {object} message - the message object sent from the background script. Must
 * have a `category` property and may have other properties depending on the category.
 * @param {string} message.category - the category of the message.
 * @returns {Promise<ContentResponse|null>}
 */
async function handleRequest(message) {
    switch (message.category) {
        case 'copy':
            return await handleCopyRequest(message.text);
        case 'iconSingleClick':
            return await handleIconSingleClick();
        case 'pageRightClick':
            const id1 = await getClickedElementId(clickedElement);
            return await handlePageRightClick(id1);
        case 'selectionRightClick':
            const selection1 = window.getSelection();
            const id2 = await getClickedElementId(clickedElement);
            return await handleSelectionRightClick(id2, selection1);
        case 'linkRightClick':
            const linkMd = await md.createLink(linkText, message.linkUrl);
            return await handleCopyRequest(linkMd);
        case 'imageRightClick':
            const imageMd = await md.createImage(message.srcUrl);
            return await handleCopyRequest(imageMd + '\n');
        case 'videoRightClick':
            const videoMd = await md.createVideo(message.srcUrl, message.pageUrl);
            return await handleCopyRequest(videoMd + '\n');
        case 'audioRightClick':
            const audioMd = await md.createAudio(message.srcUrl, message.pageUrl);
            return await handleCopyRequest(audioMd + '\n');
        case 'markdownTableRightClick':
            console.log('markdownTableRightClick in content.js');
            const id3 = await getClickedElementId(clickedElement);
            return await handleSelectionRightClick(id3, tableSelection);
        case 'tsvTableRightClick':
            if (message.id === lastRequestId) {
                console.log('Ignoring duplicate request: tsvTableRightClick in content.js');
                return null;
            }
            lastRequestId = message.id;
            console.log('tsvTableRightClick in content.js');
            return await handleCsvTableRightClick(tableSelection, '\t');
        case 'csvTableRightClick':
            if (message.id === lastRequestId) {
                console.log('Ignoring duplicate request: csvTableRightClick in content.js');
                return null;
            }
            lastRequestId = message.id;
            console.log('csvTableRightClick in content.js');
            return await handleCsvTableRightClick(tableSelection, ',');
        case 'jsonTableRightClick':
            if (message.id === lastRequestId) {
                console.log('Ignoring duplicate request: jsonTableRightClick in content.js');
                return null;
            }
            lastRequestId = message.id;
            console.log('jsonTableRightClick in content.js');
            return await handleJsonTableRightClick(tableSelection);
        case 'htmlTableRightClick':
            console.log('htmlTableRightClick in content.js');
            const tableHtml = await htmlSelection.getSelectionHtml(tableSelection);
            return await handleCopyRequest(tableHtml);
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
 * handleIconSingleClick handles a single left-click on the browser action icon.
 * @returns {Promise<ContentResponse>}
 */
async function handleIconSingleClick() {
    const selection = window.getSelection();
    if (selection && selection.type === 'Range') {
        // only allow Range (and not Caret) selections or else every icon click will
        // count as a selection click
        return await handleSelectionRightClick('', selection);
    } else {
        const linkMd = await md.createLink(document.title, location.href);
        return await handleCopyRequest(linkMd);
    }
}

/**
 * handlePageRightClick handles a right-click on a page.
 * @param {string} htmlId - the ID of the HTML element that was right-clicked.
 * @returns {Promise<ContentResponse>}
 */
async function handlePageRightClick(htmlId) {
    let title = document.title;
    let url = location.href;
    if (htmlId) {
        url += '#' + htmlId;
    }

    const link = await md.createLink(title, url);
    return await handleCopyRequest(link);
}

/**
 * handleSelectionRightClick handles a right-click on a selection.
 * @param {string} htmlId - the ID of the HTML element that was right-clicked.
 * @param {Selection} selection - a selection object.
 * @returns {Promise<ContentResponse>}
 */
async function handleSelectionRightClick(htmlId, selection) {
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

    const markdown = await htmlSelection.createText(title, url, selection);

    return await handleCopyRequest(markdown);
}

/**
 * handleCsvTableRightClick handles a right-click on a table to convert it to CSV and
 * write it to the clipboard.
 * @param {Selection} tableSelection
 * @param {string} delimiter - what to separate fields with.
 * @returns {Promise<ContentResponse>}
 */
async function handleCsvTableRightClick(tableSelection, delimiter = ',') {
    let html = await htmlSelection.getSelectionHtml(tableSelection);
    if (html === null) {
        html = tableSelection.textContent;
    }

    const tableCsv = await htmlTableToCsv(html, delimiter);
    return await handleCopyRequest(tableCsv);
}

/**
 * handleJsonTableRightClick handles a right-click on a table to convert it to JSON and
 * either write it to the clipboard or a file.
 * @param {Selection} tableSelection
 * @returns {Promise<ContentResponse|null>}
 */
async function handleJsonTableRightClick(tableSelection) {
    let html = await htmlSelection.getSelectionHtml(tableSelection);
    if (html === null) {
        html = tableSelection.textContent;
    }

    const jsonDestination = await getSetting('jsonDestination');
    if (jsonDestination === 'clipboard') {
        console.log('Writing JSON to clipboard');
        const tableJson = await htmlTableToJson(html);
        return await handleCopyRequest(tableJson);
    } else {
        const tableJson = await htmlTableToJson(html);
        // Tell the background what to download because apparently `browser.downloads`
        // is always undefined in content scripts.
        browser.runtime.sendMessage({
            downloadFile: {
                filename: 'table.json',
                json: tableJson,
            }
        });
        return null;
    }
}
