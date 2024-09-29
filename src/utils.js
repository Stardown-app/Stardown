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

const defaultSettings = {
    markupLanguage: 'markdown',
    createTextFragment: true,
    omitNav: true,
    omitFooter: true,
    omitHidden: true,
    notifyOnWarning: false,
    notifyOnSuccess: false,
    copyTabsWindows: 'current',

    mdSelectionFormat: 'source with link',
    mdYoutube: 'almost everywhere',
    mdSubBrackets: 'underlined',
    mdBulletPoint: '-',
    mdSelectionTemplate: `> [!note]
> from [{{link.title}}]({{link.url}}) on {{date.YYYYMMDD}}

{{selection}}`,

    jsonEmptyCell: 'null',
    jsonDestination: 'clipboard',
};

/**
 * getSetting gets a setting from the browser's sync storage. If the setting does not
 * exist there, its default value is returned.
 * @param {string} name - the name of the setting.
 * @returns {Promise<any>}
 */
export async function getSetting(name) {
    let obj;
    try {
        obj = await browser.storage?.sync.get(name);
    } catch (err) {
        console.error(err);
        return defaultSettings[name];
    }
    if (obj === undefined) {
        return defaultSettings[name];
    }

    const value = obj[name];
    if (value === undefined) {
        return defaultSettings[name];
    }

    return value;
}

/**
 * sendToNotepad sends text to Stardown's sidebar notepad to be inserted.
 * @param {string} text
 * @returns {Promise<void>}
 */
export async function sendToNotepad(text) {
    browser.runtime.sendMessage({
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
