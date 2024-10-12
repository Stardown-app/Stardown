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

import { browser } from './browserSpecific.js';
import { getSetting } from './getSetting.js';
import { createTextFragmentArg } from './createTextFragmentArg.js';

/**
 * sendToNotepad sends text to Stardown's sidebar notepad to be inserted.
 * @param {string} text
 * @returns {Promise<void>}
 */
export async function sendToNotepad(text) {
    browser.runtime.sendMessage({
        destination: 'sidebar',
        category: 'sendToNotepad',
        text: text,
    });
}

/**
 * applyTemplate applies a template to a title, URL, and text.
 * @param {string} template
 * @param {string} title
 * @param {string} url
 * @param {string} text
 * @returns {Promise<string>}
 */
export async function applyTemplate(template, title, url, text) {
    const today = new Date();
    const YYYYMMDD = today.getFullYear() + '/' + (today.getMonth() + 1) + '/' + today.getDate();
    const templateVars = {
        link: { title, url },
        date: { YYYYMMDD },
        text,
    };

    try {
        return template.replaceAll(/{{([\w.]+)}}/g, (match, group) => {
            return group.split('.').reduce((vars, token) => vars[token], templateVars);
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
    urlObj.hash = ''; // remove HTML element ID and maybe text fragment
    if (urlObj.pathname.includes(':~:text=')) {
        urlObj.pathname = urlObj.pathname.split(':~:text=')[0]; // definitely remove text fragment
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

    let arg = ''; // the text fragment argument
    const createTextFragment = await getSetting('createTextFragment');
    if (createTextFragment && selection) {
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

    return url;
}
