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

window.onload = function () {
    let clickedElement;

    document.addEventListener(
        'contextmenu',
        function (event) {
            clickedElement = event.target;
        },
        true,
    );

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request === "getClickedElementId") {
            sendResponse({ clickedElementId: clickedElement.id });
        }
        return true;
    });
}

/**
 * createTextFragmentArg creates a text fragment argument for a markdown link. If the
 * text is more than 8 words long, only the first 4 and last 4 words are used. If the
 * text is empty, an empty string is returned.
 * @param {string} text - The text to create a text fragment for.
 * @returns {string} - The text fragment argument for a markdown link, or an empty
 * string if the given text is empty.
 */
function createTextFragmentArg(text) {
    if (!text) {
        return '';
    }

    // if text is more than 8 words long, use only the first 4 and last 4 words
    const words = text.split(' ');
    if (words.length > 8) {
        const first4 = encodeURIComponent(words.slice(0, 4).join(' '));
        const last4 = encodeURIComponent(words.slice(-4).join(' '));
        return `${first4},${last4}`;
    } else {
        return encodeURIComponent(text);
    }
}
