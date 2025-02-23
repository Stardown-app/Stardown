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

import { browser, getShortcutInstructions } from './browserSpecific.js';
import { getSetting } from './getSetting.js';

document.querySelector('#versionNumber').innerHTML = 'v' + browser.runtime.getManifest().version;

document.querySelector('#shortcutInstructions').innerHTML = getShortcutInstructions();

const form = document.querySelector('form');

const markupLanguageEl = document.querySelector('#markupLanguage');
const copyTabsWindowsEl = document.querySelector('#copyTabsWindows');
const notepadAppendOrInsertEl = document.querySelector('#notepadAppendOrInsert');
const createTextFragmentEl = document.querySelector('#createTextFragment');
const extractMainContentEl = document.querySelector('#extractMainContent');
const omitNavEl = document.querySelector('#omitNav');
const omitFooterEl = document.querySelector('#omitFooter');
const omitHiddenEl = document.querySelector('#omitHidden');
const notifyOnWarningEl = document.querySelector('#notifyOnWarning');
const notifyOnSuccessEl = document.querySelector('#notifyOnSuccess');

const mdYoutubeEl = document.querySelector('#mdYoutube');
const templateEl = document.querySelector('#template');
const templateErrorEl = document.querySelector('#templateError');
const mdSubBracketsEl = document.querySelector('#mdSubBrackets');
const mdBulletPointEl = document.querySelector('#mdBulletPoint');

const jsonEmptyCellEl = document.querySelector('#jsonEmptyCell');
const jsonDestinationEl = document.querySelector('#jsonDestination');

const resetButton = document.querySelector('#reset');

// set up setting autosaving
initAutosave('markupLanguage', markupLanguageEl, 'value');
initAutosave('copyTabsWindows', copyTabsWindowsEl, 'value');
initAutosave('notepadAppendOrInsert', notepadAppendOrInsertEl, 'value');
initAutosave('createTextFragment', createTextFragmentEl, 'checked');
initAutosave('extractMainContent', extractMainContentEl, 'checked');
initAutosave('omitNav', omitNavEl, 'checked');
initAutosave('omitFooter', omitFooterEl, 'checked');
initAutosave('omitHidden', omitHiddenEl, 'checked');
initAutosave('notifyOnWarning', notifyOnWarningEl, 'checked');
initAutosave('notifyOnSuccess', notifyOnSuccessEl, 'checked');

initAutosave('mdYoutube', mdYoutubeEl, 'value');
initAutosave('mdSelectionWithSourceTemplate', templateEl, 'value');
initAutosave('mdSubBrackets', mdSubBracketsEl, 'value');
initAutosave('mdBulletPoint', mdBulletPointEl, 'value');

initAutosave('jsonEmptyCell', jsonEmptyCellEl, 'value');
initAutosave('jsonDestination', jsonDestinationEl, 'value', () => {
    browser.runtime.sendMessage({
        destination: 'background',
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
        notepadAppendOrInsertEl.value = await getSetting('notepadAppendOrInsert');
        createTextFragmentEl.checked = await getSetting('createTextFragment');
        extractMainContentEl.checked = await getSetting('extractMainContent');
        omitNavEl.checked = await getSetting('omitNav');
        omitFooterEl.checked = await getSetting('omitFooter');
        omitHiddenEl.checked = await getSetting('omitHidden');
        notifyOnWarningEl.checked = await getSetting('notifyOnWarning');
        notifyOnSuccessEl.checked = await getSetting('notifyOnSuccess');

        mdYoutubeEl.value = await getSetting('mdYoutube');
        templateEl.value = await getSetting('mdSelectionWithSourceTemplate');
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
    const sourceUrl = 'https://example.com';
    const YYYYMMDD = '2024-01-01';
    const text = 'converted text';
    const templateVars = {
        page: { title: title },
        source: { url: sourceUrl },
        date: { YYYYMMDD: YYYYMMDD },
        text: text.trim(),
    };

    const matches = templateEl.value.matchAll(/{{([^{}]+)}}/g);
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
            templateErrorEl.textContent = `Unknown variable "${group}"`;
            templateErrorEl.style.display = 'inline-block';
            return;
        }
    }

    templateErrorEl.textContent = '';
    templateErrorEl.style.display = 'none';
}

templateEl.addEventListener('input', async function () {
    await validateTemplateVariables();
});

document.addEventListener('DOMContentLoaded', loadSettings);
form.addEventListener('reset', resetSettings);
