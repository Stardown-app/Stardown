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

const browser = chrome || browser;

window.onload = function () {
    let clickedElement;

    document.addEventListener(
        'contextmenu',
        function (event) {
            clickedElement = event.target;
        },
        true,
    );

    browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request === "getClickedElementId") {
            // if clickedElement doesn't have an id, look at its parent
            while (clickedElement && !clickedElement.id) {
                clickedElement = clickedElement.parentElement;
            }
            if (clickedElement && clickedElement.id) {
                sendResponse(clickedElement.id);
            } else {
                console.log('No HTML element with an ID was found in the clicked path');
                sendResponse('');
            }
        }
        return true;
    });
}

/**
 * getSetting gets a setting from the browser's sync storage.
 * @param {string} name - the name of the setting.
 * @param {any} default_ - the default value of the setting.
 * @returns {any}
 */
async function getSetting(name, default_) {
    try {
        const v = (await browser.storage.sync.get(name))[name];
        if (v !== undefined) {
            return v;
        }
        return default_;
    } catch (err) {
        console.error(err);
        return default_;
    }
}

/**
 * replaceBrackets replaces square brackets in a link title with the character or escape
 * sequence chosen in settings.
 * @param {string} title - the raw link title.
 * @returns {Promise<string>}
 */
async function replaceBrackets(title) {
    let sub_brackets = await getSetting('sub_brackets', 'underlined');
    if (sub_brackets === 'underlined') {
        return title.replaceAll('[', '⦋').replaceAll(']', '⦌');
    } else if (sub_brackets === 'escaped') {
        return title.replaceAll('[', '\\[').replaceAll(']', '\\]');
    }
    return title;
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
