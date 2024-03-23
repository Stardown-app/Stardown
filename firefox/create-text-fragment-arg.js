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
    const result = window.generateFragment(selection);
    switch (result.status) {
        case 1:
            console.error('generateFragment: the selection provided could not be used');
            return '';
        case 2:
            console.error('generateFragment: no unique fragment could be identified for this selection');
            return '';
        case 3:
            console.error('generateFragment: computation could not complete in time');
            return '';
        case 4:
            console.error('generateFragment: an exception was raised during generation');
            return '';
    }

    const fragment = result.fragment;

    let arg = '';
    if (fragment.prefix) {
        arg += encodeURIComponent(fragment.prefix) + '-,';
    }
    arg += encodeURIComponent(fragment.textStart);
    if (fragment.textEnd) {
        arg += ',' + encodeURIComponent(fragment.textEnd);
    }
    if (fragment.suffix) {
        arg += ',-' + encodeURIComponent(fragment.suffix);
    }
    arg = arg.replaceAll('(', '%28').replaceAll(')', '%29');  // for markdown links

    return arg;
}

var selection = window.getSelection();

// The file's last expression's value is sent to where this file was run from with
// `browser.tabs.executeScript`.
[createTextFragmentArg(selection), selection.toString()];
