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

/**
 * A response object sent from a content script to a background script.
 * @typedef {object} ContentResponse
 * @property {number} status - the number of markdown items successfully created and
 * written to the clipboard. Zero means failure, and one or above means success.
 * @property {string} notifTitle - the title of the notification to show to the user.
 * @property {string} notifBody - the body of the notification to show to the user.
 */

// clickedElement is the element the user most recently right-clicked. It is assigned
// values by the contextmenu event listener in setUpListeners.
let clickedElement;

// linkText is the text of the link the user most recently right-clicked. It is assigned
// values by the contextmenu event listener in setUpListeners.
let linkText = null;

/**
 * setUpListeners sets up listeners.
 * @returns {void}
 */
function setUpListeners() {

    document.addEventListener('mouseover', (event) => {
        // This event listener is used to determine if any element that may be
        // right-clicked is a link or an image. This information is sent to the
        // background script to determine if the context menu item for copying link or
        // image markdown should be shown. This is necessary because the context menu
        // cannot be updated while it is visible.
        const isLink = event.target.nodeName === 'A';
        const isImage = event.target.nodeName === 'IMG';
        browser.runtime.sendMessage({ isLink, isImage });
    });

    document.addEventListener('contextmenu', (event) => {
        clickedElement = event.target;

        if (event.target.nodeName === 'A') {
            linkText = event.target.textContent;
        } else {
            linkText = null;
        }
    });

    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        // In Chromium, this listener must be synchronous and must send a response
        // immediately. True must be sent if the actual response will be sent
        // asynchronously.

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
 * handleRequest processes a message sent from the background script and returns a
 * response.
 * @param {object} message - the message object sent from the background script. Must
 * have a `category` property and may have other properties depending on the category.
 * @param {string} message.category - the category of the message.
 * @returns {Promise<ContentResponse>}
 */
async function handleRequest(message) {
    switch (message.category) {
        case 'copy':
            return await handleCopyRequest(message.text);
        case 'iconSingleClick':
            const linkMd1 = await md.createLink(document.title, location.href);
            return await handleCopyRequest(linkMd1);
        case 'pageRightClick':
            const id1 = await getClickedElementId(clickedElement);
            return await handlePageRightClick(id1);
        case 'selectionRightClick':
            const id2 = await getClickedElementId(clickedElement);
            return await handleSelectionRightClick(id2);
        case 'linkRightClick':
            const linkMd2 = await md.createLink(linkText, message.linkUrl);
            return await handleCopyRequest(linkMd2);
        case 'imageRightClick':
            const imageMd = await md.createImage(message.srcUrl);
            return await handleCopyRequest(imageMd + '\n');
        case 'videoRightClick':
            const videoMd = await md.createVideo(message.srcUrl, message.pageUrl);
            return await handleCopyRequest(videoMd + '\n');
        case 'audioRightClick':
            const audioMd = await md.createAudio(message.srcUrl, message.pageUrl);
            return await handleCopyRequest(audioMd + '\n');
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
 * @returns {Promise<ContentResponse>}
 */
async function handleSelectionRightClick(htmlId) {
    let title = document.title;
    let url = await removeIdAndTextFragment(location.href);

    let selectedText;
    let arg; // the text fragment argument
    const selection = window.getSelection();
    if (selection) {
        selectedText = selection.toString().trim();
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

    const markdown = await htmlSelection.createMd(title, url, selectedText);

    return await handleCopyRequest(markdown);
}

/**
 * removeIdAndTextFragment removes any HTML element ID and/or text fragment from a URL.
 * If the URL has neither, it is returned unchanged.
 * @param {string} url - the URL to remove any HTML element ID and/or text fragment
 * from.
 * @returns {Promise<string>}
 */
async function removeIdAndTextFragment(url) {
    // If the URL has an HTML element ID, any text fragment will also be in the `hash`
    // attribute of its URL object. However, if the URL has a text fragment but no HTML
    // element ID, the text fragment may be in the `pathname` attribute of its URL
    // object along with part of the URL that should not be removed.
    const urlObj = new URL(url);
    urlObj.hash = ''; // remove HTML element ID and maybe text fragment
    if (urlObj.pathname.includes(':~:text=')) {
        urlObj.pathname = urlObj.pathname.split(':~:text=')[0];
    }
    url = urlObj.toString();

    return url;
}
