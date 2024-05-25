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

if (typeof browser === 'undefined') {
    var browser = chrome;
}

let clickedElement;

document.addEventListener(
    'contextmenu',
    function (event) {
        clickedElement = event.target;
    },
    true,
);

document.addEventListener('mouseover', (event) => {
    const isLink = event.target.nodeName === 'A';
    const isImage = event.target.nodeName === 'IMG';
    browser.runtime.sendMessage({ isLink, isImage });
});

browser.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    switch (message.category) {
        case 'page':
        case 'selection':
            sendResponse(getClickedElementId(clickedElement));
            break;
        case 'link':
        case 'image':
        case 'video':
        case 'audio':
            copyText(message.markdown, message.category, sendResponse);
            break;
        default:
            console.error('Unknown message category:', message.category);
    }

    return true;
});

/**
 * getClickedElementId gets the ID of the element that was right-clicked. If the element
 * doesn't have an ID, it looks at its parent element. This repeats until an element
 * with an ID is found, or until the root of the DOM is reached.
 * @param {EventTarget | null} clickedElement - the element that was right-clicked.
 * @returns {string} - the ID of the element that was right-clicked.
 */
function getClickedElementId(clickedElement) {
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
 * copyText writes markdown text to the clipboard.
 * @param {string} text - the text to copy to the clipboard.
 * @param {string} description - a description of the text.
 * @param {function} sendResponse - the function to call to send a response back to the
 * background script.
 * @returns {undefined}
 */
function copyText(text, description, sendResponse) {
    navigator.clipboard.writeText(text).then(() => {
        sendResponse({
            title: 'Markdown copied',
            body: `Your ${description} markdown can now be pasted`,
        });
    }).catch((err) => {
        console.error('Failed to copy text to clipboard because:', err);
    });
}
