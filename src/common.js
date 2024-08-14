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

import { browser } from './config.js';

const defaultSettings = {
    youtubeMd: 'almost everywhere',
    createTextFragment: true,
    omitNav: true,
    omitFooter: true,
    notifyOnWarning: false,
    notifyOnSuccess: false,
    subBrackets: 'underlined',
    selectionFormat: 'source with link',
    selectionTemplate: `
> [!note]
> from [{{link.title}}]({{link.url}}) on {{date.YYYYMMDD}}

{{selection}}
`.trim(),
    jsonDestination: 'clipboard',
    emptyCellJson: 'null',
    bulletPoint: '-',
    doubleClickWindows: 'current',
    doubleClickInterval: 500,
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
