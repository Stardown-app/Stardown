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
import { getSetting, replaceBrackets, escapeMarkdown } from './common.js';

/**
 * A response object sent from a content script to a background script.
 * @typedef {object} ContentResponse
 * @property {number} status - the number of markdown items successfully created and
 * written to the clipboard. Zero means failure, and one or above means success.
 * @property {string} notifTitle - the title of the notification to show to the user.
 * @property {string} notifBody - the body of the notification to show to the user.
 */

let clickedElement;
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

// window.onload = setUpListeners; // TODO: is this needed in Chromium?
setUpListeners(); // Firefox requires setUpListeners to be called immediately. If it's
// called in window.onload instead, the content script will not be able to receive
// messages and an error message will appear: "Error: Could not establish connection.
// Receiving end does not exist."

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
            const linkMd1 = await createLinkMarkdown(document.title, location.href);
            return await handleCopyRequest(linkMd1);
        case 'pageRightClick':
            const id1 = await getClickedElementId(clickedElement);
            return await handlePageRightClick(id1);
        case 'selectionRightClick':
            const id2 = await getClickedElementId(clickedElement);
            return await handleSelectionRightClick(id2);
        case 'linkRightClick':
            const linkMd2 = await createLinkMarkdown(linkText, message.linkUrl);
            return await handleCopyRequest(linkMd2);
        case 'imageRightClick':
            const imageMd = await createImageMarkdown(message.srcUrl);
            return await handleCopyRequest(imageMd + '\n');
        case 'videoRightClick':
            const videoMd = await createMediaMarkdown(
                'video', message.srcUrl, message.pageUrl
            );
            return await handleCopyRequest(videoMd + '\n');
        case 'audioRightClick':
            const audioMd = await createMediaMarkdown(
                'audio', message.srcUrl, message.pageUrl
            );
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
    const subBrackets = await getSetting('subBrackets', 'underlined');
    title = await replaceBrackets(title, subBrackets);
    title = await escapeMarkdown(title);

    let url = location.href;
    if (htmlId) {
        url += '#' + htmlId;
    }
    url = url.replaceAll('(', '%28').replaceAll(')', '%29');

    const text = `[${title}](${url})`;

    return await handleCopyRequest(text);
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
    url = url.replaceAll('(', '%28').replaceAll(')', '%29');

    let text;
    const subBrackets = await getSetting('subBrackets', 'underlined');
    if (!selectedText) {
        title = await replaceBrackets(title, subBrackets);
        title = await escapeMarkdown(title);
        text = `[${title}](${url})`;
    } else {
        const selectionFormat = await getSetting('selectionFormat', 'blockquote');
        switch (selectionFormat) {
            case 'title':
                title = await replaceBrackets(title, subBrackets);
                title = await escapeMarkdown(title);
                text = `[${title}](${url})`;
                break;
            case 'selected':
                selectedText = await replaceBrackets(selectedText, subBrackets);
                selectedText = await escapeMarkdown(selectedText);
                selectedText = selectedText.replaceAll('\r\n', ' ').replaceAll('\n', ' ');
                text = `[${selectedText}](${url})`;
                break;
            case 'blockquote':
                title = await replaceBrackets(title, subBrackets);
                title = await escapeMarkdown(title);
                selectedText = await escapeMarkdown(selectedText.replaceAll('[', '\\['));
                text = await createBlockquoteMarkdown(selectedText, title, url);
                break;
            default:
                console.error(`Unknown selectionFormat: ${selectionFormat}`);
                throw new Error(`Unknown selectionFormat: ${selectionFormat}`);
        }
    }

    return await handleCopyRequest(text);
}

/**
 * createLinkMarkdown creates a markdown link. The title and URL are markdown-escaped
 * and encoded, and any square brackets in the title may be replaced depending on the
 * settings.
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
 * @param {string} url - the URL of the image.
 * @returns {Promise<string>}
 */
async function createImageMarkdown(url) {
    let fileName = url.split('/').pop();
    const subBrackets = await getSetting('subBrackets', 'underlined');
    fileName = await replaceBrackets(fileName, subBrackets);
    fileName = await escapeMarkdown(fileName);
    url = url.replaceAll('(', '%28').replaceAll(')', '%29');
    return `![${fileName}](${url})`;
}

/**
 * createMediaMarkdown creates markdown for video or audio. For rendering purposes, the
 * resulting markdown will only start with an exclamation mark if the page URL is used.
 * @param {string} altText - a description of the media to use in the markdown link.
 * This function assumes the alt text is already markdown-escaped.
 * @param {string} srcUrl - the URL of the media. If this is falsy or starts with
 * `blob:`, the page URL is used instead.
 * @param {string} pageUrl - the URL of the page the media is on. This is used only if
 * the source URL is falsy or starts with `blob:`.
 * @returns {Promise<string>}
 */
async function createMediaMarkdown(altText, srcUrl, pageUrl) {
    if (srcUrl && !srcUrl.startsWith('blob:')) {
        srcUrl = srcUrl.replaceAll('(', '%28').replaceAll(')', '%29');
        return `[${altText}](${srcUrl})`;
    } else {
        pageUrl = pageUrl.replaceAll('(', '%28').replaceAll(')', '%29');
        return `![${altText}](${pageUrl})`;
    }
}

/**
 * createTextFragmentArg creates for a markdown link a text fragment argument (the part
 * after the `#:~:text=`). Only selection objects with type 'Range' are used; all other
 * selections result in an empty string because this extension needs to also allow
 * creating links that do not include text fragments. All parentheses are replaced with
 * their URL-encoded equivalents.
 * @param {Selection} selection - A Selection object; the result of window.getSelection.
 * @returns {string}
 */
function createTextFragmentArg(selection) {
    if (selection.type !== 'Range') {
        return '';
    }

    // https://web.dev/articles/text-fragments#programmatic_text_fragment_link_generation
    let result;
    try {
        result = window.generateFragment(selection);
    } catch (err) {
        if (err.message !== 'window.generateFragment is not a function') {
            browser.runtime.sendMessage({ warning: err.message });
            return '';
        }
    }

    switch (result.status) {
        case 1:
            browser.runtime.sendMessage({
                warning: 'The selection provided could not be used to create a text fragment'
            });
            return '';
        case 2:
            browser.runtime.sendMessage({
                warning: 'No unique text fragment could be identified for this selection'
            });
            return '';
        case 3:
            browser.runtime.sendMessage({
                warning: 'Text fragment computation could not complete in time'
            });
            return '';
        case 4:
            browser.runtime.sendMessage({
                warning: 'An exception was raised during text fragment generation'
            });
            return '';
    }

    const fragment = result.fragment;

    let arg = '';
    if (fragment.prefix) {
        arg += urlEncode(fragment.prefix) + '-,';
    }
    arg += urlEncode(fragment.textStart);
    if (fragment.textEnd) {
        arg += ',' + urlEncode(fragment.textEnd);
    }
    if (fragment.suffix) {
        arg += ',-' + urlEncode(fragment.suffix);
    }
    arg = arg.replaceAll('(', '%28').replaceAll(')', '%29'); // for markdown links

    return arg;
}

/**
 * urlEncode URL-encodes a string, but also replaces '-' with '%2D' because the text
 * fragment generator appears to not handle '-' correctly.
 * @param {string} text - the text to encode.
 * @returns {string}
 */
function urlEncode(text) {
    return encodeURIComponent(text).replaceAll('-', '%2D');
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
