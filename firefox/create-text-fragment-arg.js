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

/**
 * This file requires the `generateFragment` function to be in `window`, and is intended
 * to be run using `browser.tabs.executeScript` with the `file` option. For example,
 *
 * ```js
 * const args = await browser.tabs.executeScript(tab.id, {
 *     file: 'create-text-fragment-arg.js',
 * });
 * const arg = args[0];
 * ```
 */

if (typeof browser === 'undefined') {
    var browser = chrome;
}

/**
 * enc URL-encodes a string, but also replaces '-' with '%2D' because the text fragment
 * generator appears to not handle '-' correctly.
 * @param {string} text - the text to encode.
 * @returns {string}
 */
function enc(text) {
    return encodeURIComponent(text).replaceAll('-', '%2D');
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
        arg += enc(fragment.prefix) + '-,';
    }
    arg += enc(fragment.textStart);
    if (fragment.textEnd) {
        arg += ',' + enc(fragment.textEnd);
    }
    if (fragment.suffix) {
        arg += ',-' + enc(fragment.suffix);
    }
    arg = arg.replaceAll('(', '%28').replaceAll(')', '%29'); // for markdown links

    return arg;
}

var selection = window.getSelection();

// The file's last expression's value is sent to where this file was run from with
// `browser.tabs.executeScript`.
[createTextFragmentArg(selection), selection.toString().trim()];
