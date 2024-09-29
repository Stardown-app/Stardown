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

import { browser, getShortcutInstructions } from './browserSpecific.js';
import { getSetting } from './utils.js';

document.querySelector('#versionNumber').innerHTML = 'v' + browser.runtime.getManifest().version;

document.querySelector('#shortcutInstructions').innerHTML = getShortcutInstructions();

const form = document.querySelector('form');

const markupLanguageEl = document.querySelector('#markupLanguage');
const copyTabsWindowsEl = document.querySelector('#copyTabsWindows');
const createTextFragmentEl = document.querySelector('#createTextFragment');
const omitNavEl = document.querySelector('#omitNav');
const omitFooterEl = document.querySelector('#omitFooter');
const omitHiddenEl = document.querySelector('#omitHidden');
const notifyOnWarningEl = document.querySelector('#notifyOnWarning');
const notifyOnSuccessEl = document.querySelector('#notifyOnSuccess');

const mdSelectionFormatEl = document.querySelector('#mdSelectionFormat');
const mdYoutubeEl = document.querySelector('#mdYoutube');
const mdSelectionTemplateEl = document.querySelector('#mdSelectionTemplate');
const mdSelectionTemplateLabelEl = document.querySelector('#mdSelectionTemplateLabel');
const mdSelectionTemplateErrorEl = document.querySelector('#mdSelectionTemplateError');
const mdSubBracketsEl = document.querySelector('#mdSubBrackets');
const mdBulletPointEl = document.querySelector('#mdBulletPoint');

const jsonEmptyCellEl = document.querySelector('#jsonEmptyCell');
const jsonDestinationEl = document.querySelector('#jsonDestination');

const resetButton = document.querySelector('#reset');

// set up setting autosaving
initAutosave('markupLanguage', markupLanguageEl, 'value', async () => {
    // send the updated markupLanguage to the background script
    browser.runtime.sendMessage({
        category: 'markupLanguage',
        markupLanguage: markupLanguageEl.value,
    });
});
initAutosave('createTextFragment', createTextFragmentEl, 'checked');
initAutosave('omitNav', omitNavEl, 'checked');
initAutosave('omitFooter', omitFooterEl, 'checked');
initAutosave('omitHidden', omitHiddenEl, 'checked');
initAutosave('notifyOnWarning', notifyOnWarningEl, 'checked');
initAutosave('notifyOnSuccess', notifyOnSuccessEl, 'checked');
initAutosave('copyTabsWindows', copyTabsWindowsEl, 'value');

initAutosave('mdSelectionFormat', mdSelectionFormatEl, 'value');
initAutosave('mdYoutube', mdYoutubeEl, 'value');
initAutosave('mdSelectionTemplate', mdSelectionTemplateEl, 'value');
initAutosave('mdSubBrackets', mdSubBracketsEl, 'value');
initAutosave('mdBulletPoint', mdBulletPointEl, 'value');

initAutosave('jsonEmptyCell', jsonEmptyCellEl, 'value');
initAutosave('jsonDestination', jsonDestinationEl, 'value', () => {
    // send the updated jsonDestination to the background script
    browser.runtime.sendMessage({
        category: 'jsonDestination',
        jsonDestination: jsonDestinationEl.value
    });
});

/**
 * initAutosave initializes autosaving for a setting.
 * @param {string} settingName - the name of the setting.
 * @param {HTMLElement} el - the HTML element of the setting's input field.
 * @param {string} valueProperty - the HTML element's property that holds the setting's
 * value.
 * @param {function|undefined} then - an optional function to run after applying the
 * setting completes.
 */
function initAutosave(settingName, el, valueProperty, then) {
    el.addEventListener('input', async (event) => {
        const obj = {};
        obj[settingName] = el[valueProperty];
        await browser.storage.sync.set(obj).then(then);
    });
}

/**
 * loadSettings loads the settings from browser storage into the settings page.
 */
async function loadSettings() {
    try {
        markupLanguageEl.value = await getSetting('markupLanguage');
        copyTabsWindowsEl.value = await getSetting('copyTabsWindows');
        createTextFragmentEl.checked = await getSetting('createTextFragment');
        omitNavEl.checked = await getSetting('omitNav');
        omitFooterEl.checked = await getSetting('omitFooter');
        omitHiddenEl.checked = await getSetting('omitHidden');
        notifyOnWarningEl.checked = await getSetting('notifyOnWarning');
        notifyOnSuccessEl.checked = await getSetting('notifyOnSuccess');

        mdSelectionFormatEl.value = await getSetting('mdSelectionFormat');
        mdYoutubeEl.value = await getSetting('mdYoutube');
        mdSelectionTemplateEl.value = await getSetting('mdSelectionTemplate');
        mdSubBracketsEl.value = await getSetting('mdSubBrackets');
        mdBulletPointEl.value = await getSetting('mdBulletPoint');

        jsonEmptyCellEl.value = await getSetting('jsonEmptyCell') || 'null';
        jsonDestinationEl.value = await getSetting('jsonDestination');
    } catch (err) {
        console.error(err);
        throw err;
    }
}

/**
 * resetSettings deletes all settings from browser storage and indicates success. It
 * assumes it's being used as a form event listener for the 'reset' event so that it
 * doesn't have to reset the settings page.
 */
async function resetSettings() {
    await browser.storage.sync.clear();

    mdSelectionTemplateEl.style.display = 'none';
    mdSelectionTemplateLabelEl.style.display = 'none';

    resetButton.value = 'Reset all ✔';
    resetButton.style.backgroundColor = '#aadafa';
    setTimeout(() => {
        resetButton.value = 'Reset all';
        resetButton.style.backgroundColor = '';
    }, 750);
}

/**
 * validateTemplateVariables validates the selection template's variables. If any are
 * invalid, an error message is displayed.
 * @returns {Promise<void>}
 */
async function validateTemplateVariables() {
    const title = 'page title';
    const url = 'https://example.com';
    const YYYYMMDD = '2024-01-01';
    const selection = 'selected text';
    const templateVars = {
        link: { title, url },
        date: { YYYYMMDD },
        selection,
    };

    const matches = mdSelectionTemplateEl.value.matchAll(/{{([^{}]+)}}/g);
    if (!matches) {
        return;
    }

    for (const match of matches) {
        const [full, group] = match;
        const tokens = group.split('.');

        let value = templateVars;
        for (const token of tokens) {
            if (token.includes(' ')) {
                value = undefined;
                break;
            }
            value = value[token];
            if (value === undefined) {
                break;
            }
        }

        if (value === undefined) {
            mdSelectionTemplateErrorEl.textContent = `Unknown variable "${group}"`;
            mdSelectionTemplateErrorEl.style.color = 'red';
            mdSelectionTemplateErrorEl.style.display = 'inline-block';
            return;
        }
    }

    mdSelectionTemplateErrorEl.textContent = '';
    mdSelectionTemplateErrorEl.style.display = 'none';
}

mdSelectionFormatEl.addEventListener('change', function () {
    // hide or show the selection template setting based on the selection format
    if (mdSelectionFormatEl.value === 'template') {
        mdSelectionTemplateEl.style.display = 'block';
        mdSelectionTemplateLabelEl.style.display = 'block';
    } else {
        mdSelectionTemplateEl.style.display = 'none';
        mdSelectionTemplateLabelEl.style.display = 'none';
    }
});
new Promise(resolve => setTimeout(resolve, 50)).then(() => {
    mdSelectionFormatEl.dispatchEvent(new Event('change'));
});

mdSelectionTemplateEl.addEventListener('input', async function () {
    await validateTemplateVariables();
});

document.addEventListener('DOMContentLoaded', loadSettings);
form.addEventListener('reset', resetSettings);
