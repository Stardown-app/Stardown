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
import { mdEncodeUri } from './converters/md.js';

/**
 * createTextFragmentArg creates for a markdown link a text fragment argument (the part
 * after the `#:~:text=`). Only selection objects with type 'Range' are used; all other
 * selections result in an empty string because this extension needs to also allow
 * creating links that do not include text fragments. All parentheses are replaced with
 * their URL-encoded equivalents. This function may adjust what part of the document is
 * selected, such as to include the entirety of partially selected words.
 * @param {Selection} selection - A Selection object; the result of window.getSelection.
 * @returns {string}
 */
export function createTextFragmentArg(selection) {
    if (selection.type !== 'Range') {
        return '';
    }

    // https://developer.mozilla.org/en-US/docs/Web/URI/Fragment/Text_fragments
    // https://web.dev/articles/text-fragments#programmatic_text_fragment_link_generation
    let result;
    try {
        result = window.generateFragment(selection);
    } catch (err) {
        if (err.message !== 'window.generateFragment is not a function') {
            console.warn('generateFragment: ' + err.message);
            browser.runtime.sendMessage({
                destination: 'background',
                category: 'showWarning',
                warning: err.message,
            });
            return '';
        }
    }

    switch (result.status) {
        case 1:
            console.warn('The selection provided could not be used to create a text fragment');
            browser.runtime.sendMessage({
                destination: 'background',
                category: 'showWarning',
                warning: 'The selection provided could not be used to create a text fragment',
            });
            return '';
        case 2:
            console.warn('No unique text fragment could be identified for this selection');
            browser.runtime.sendMessage({
                destination: 'background',
                category: 'showWarning',
                warning: 'No unique text fragment could be identified for this selection',
            });
            return '';
        case 3:
            console.warn('Text fragment computation could not complete in time');
            browser.runtime.sendMessage({
                destination: 'background',
                category: 'showWarning',
                warning: 'Text fragment computation could not complete in time',
            });
            return '';
        case 4:
            console.warn('An exception was raised during text fragment generation');
            browser.runtime.sendMessage({
                destination: 'background',
                category: 'showWarning',
                warning: 'An exception was raised during text fragment generation',
            });
            return '';
    }

    const fragment = result.fragment;

    let arg = '';
    if (fragment.prefix) {
        arg += encodeFragmentComponent(fragment.prefix) + '-,';
    }
    arg += encodeFragmentComponent(fragment.textStart);
    if (fragment.textEnd) {
        arg += ',' + encodeFragmentComponent(fragment.textEnd);
    }
    if (fragment.suffix) {
        arg += ',-' + encodeFragmentComponent(fragment.suffix);
    }

    arg = mdEncodeUri(arg);

    return arg;
}

/**
 * encodeFragmentComponent URL-encodes a string, but also replaces '-' with '%2D'
 * because the text fragment generator appears to not handle '-' correctly.
 * @param {string} text - the text to encode.
 * @returns {string}
 */
function encodeFragmentComponent(text) {
    return encodeURIComponent(text).replaceAll('-', '%2D');
}
