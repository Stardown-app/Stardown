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

import { browser } from "./browserSpecific.js";
import { getSetting } from "./getSetting.js";
import { createTextFragmentArg } from "./createTextFragmentArg.js";
import { DOMPurify } from "./purify.js";

/**
 * A response object sent from a content script to a background script.
 * @typedef {object} ContentResponse
 * @property {number} status - the number of markdown items successfully created and
 * written to the clipboard. Zero means failure, and one or above means success.
 * @property {string} notifTitle - the title of the notification to show to the user.
 * @property {string} notifBody - the body of the notification to show to the user.
 */

/**
 * sendToNotepad sends text to Stardown's sidebar notepad to be appended or inserted.
 * @param {string} text
 * @returns {Promise<void>}
 */
export async function sendToNotepad(text) {
    browser.runtime.sendMessage({
        destination: "sidebar",
        category: "sendToNotepad",
        text: text,
    });
}

/**
 * handleCopyRequest writes text to the clipboard and returns a content response object.
 * @param {string} text - the text to copy to the clipboard.
 * @returns {Promise<ContentResponse>}
 */
export async function handleCopyRequest(text) {
    // `navigator.clipboard.writeText` only works in Chromium if the document is
    // focused. Probably for security reasons, focus functions like
    // `document.body.focus()`, `window.focus()`, `document.documentElement.focus()`,
    // and `document.activeElement.focus()` don't appear to work here. Interacting with
    // Stardown's popup or sidebar causes the document to lose focus. Whether the
    // document is focused doesn't seem to be an issue in Firefox. However,
    // `navigator.clipboard` is sometimes undefined (at least in Firefox, probably in
    // all browsers) on `http:` pages, so the fallback method for writing to the
    // clipboard is sometimes useful for all browsers.

    try {
        await navigator.clipboard.writeText(text);
        console.log("Successfully wrote text to the clipboard.");
    } catch (err) {
        console.warn("navigator.clipboard.writeText:", err.message);
        console.log("Using fallback method to write text to the clipboard.");

        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();

        try {
            document.execCommand("copy");
            console.log("No error thrown by the fallback method.");
        } catch (fallbackError) {
            console.error(
                "Failed to write text to the clipboard using fallback method because:",
                fallbackError.message,
            );
            return {
                status: 0, // failure
                notifTitle: "Failed to copy text",
                notifBody: fallbackError.message,
            };
        } finally {
            document.body.removeChild(textarea);
        }
    }

    return {
        status: 1, // successfully copied one item
        notifTitle: "Text copied",
        notifBody: "Your text can now be pasted",
    };
}

/**
 * applyTemplate applies a template to a title, URL, and text.
 * @param {string} template
 * @param {string} title
 * @param {string} sourceUrl
 * @param {string} text
 * @returns {Promise<string>}
 */
export async function applyTemplate(template, title, sourceUrl, text) {
    const today = new Date();
    const YYYYMMDD =
        today.getFullYear() +
        "/" +
        (today.getMonth() + 1) +
        "/" +
        today.getDate();
    const templateVars = {
        page: { title: title },
        source: { url: sourceUrl },
        date: { YYYYMMDD: YYYYMMDD },
        text: text.trim(),
    };

    try {
        return template.replaceAll(/{{([\w.]+)}}/g, (match, group) => {
            return group
                .split(".")
                .reduce((vars, token) => vars[token], templateVars);
        });
    } catch (err) {
        // an error message should have been shown when the user changed the template
        console.error(err);
        throw err;
    }
}

/**
 * removeIdAndTextFragment removes any HTML element ID and any text fragment from a URL.
 * If the URL has neither, it is returned unchanged.
 * @param {string} url
 * @returns {string}
 */
export function removeIdAndTextFragment(url) {
    // If the URL has an HTML element ID, any text fragment will also be in the `hash`
    // attribute of its URL object. However, if the URL has a text fragment but no HTML
    // element ID, the text fragment may be in the `pathname` attribute of its URL
    // object along with part of the URL that should not be removed.
    const urlObj = new URL(url);
    urlObj.hash = ""; // remove HTML element ID and maybe text fragment
    if (urlObj.pathname.includes(":~:text=")) {
        urlObj.pathname = urlObj.pathname.split(":~:text=")[0]; // definitely remove text fragment
    }
    return urlObj.toString();
}

/**
 * addIdAndTextFragment adds an HTML element ID and a text fragment to a URL. If the
 * given URL already contains an ID and/or a text fragment, they are first removed. The
 * text fragment is created from the selection.
 * @param {string} url
 * @param {string} htmlId
 * @param {Selection} selection
 * @returns {Promise<string>}
 */
export async function addIdAndTextFragment(url, htmlId, selection) {
    url = removeIdAndTextFragment(url);

    let arg = ""; // the text fragment argument
    const createTextFragment = await getSetting("createTextFragment");
    if (createTextFragment && selection) {
        arg = createTextFragmentArg(selection);
    }

    if (htmlId || arg) {
        url += "#";
        if (htmlId) {
            url += htmlId;
        }
        if (arg) {
            url += `:~:text=${arg}`;
        }
    }

    return url;
}

/**
 * @param {DocumentFragment} frag
 * @returns {Promise<DocumentFragment>}
 */
export async function sanitizeInput(frag) {
    if (!await getSetting("sanitizeInput")) {
        console.warn("html NOT sanitized");
        return frag;
    }

    try {
        frag = DOMPurify.sanitize(frag, {
            IN_PLACE: true,
            RETURN_DOM_FRAGMENT: true,
            ADD_TAGS: ["#document-fragment"],
        });
    } catch (err) {
        console.error("DOMPurify: " + err.message);
        return null;
    }

    console.log(
        `DOMPurify removed ${DOMPurify.removed.length} elements and/or attributes`
    );

    return frag;
}
