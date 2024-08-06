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
import { getSetting } from './common.js';

const form = document.querySelector('form');

const youtubeMdEl = document.querySelector('#youtubeMd');
const selectionFormatEl = document.querySelector('#selectionFormat');
const selectionTemplateEl = document.querySelector('#selectionTemplate');
const selectionTemplateLabelEl = document.querySelector('#selectionTemplateLabel');
const selectionTemplateErrorEl = document.querySelector('#selectionTemplateError');
const emptyCellJsonEl = document.querySelector('#emptyCellJson');
const subBracketsEl = document.querySelector('#subBrackets');
const bulletPointEl = document.querySelector('#bulletPoint');
const doubleClickWindowsEl = document.querySelector('#doubleClickWindows');
const doubleClickIntervalEl = document.querySelector('#doubleClickInterval');
const createTextFragmentEl = document.querySelector('#createTextFragment');
const omitNavEl = document.querySelector('#omitNav');
const omitFooterEl = document.querySelector('#omitFooter');
const notifyOnWarningEl = document.querySelector('#notifyOnWarning');
const notifyOnSuccessEl = document.querySelector('#notifyOnSuccess');

const resetButton = document.querySelector('#reset');

// set up setting autosaving
initAutosave('youtubeMd', youtubeMdEl, 'value');
initAutosave('selectionFormat', selectionFormatEl, 'value');
initAutosave('selectionTemplate', selectionTemplateEl, 'value');
initAutosave('emptyCellJson', emptyCellJsonEl, 'value');
initAutosave('subBrackets', subBracketsEl, 'value');
initAutosave('bulletPoint', bulletPointEl, 'value');
initAutosave('createTextFragment', createTextFragmentEl, 'checked');
initAutosave('omitNav', omitNavEl, 'checked');
initAutosave('omitFooter', omitFooterEl, 'checked');
initAutosave('notifyOnWarning', notifyOnWarningEl, 'checked');
initAutosave('notifyOnSuccess', notifyOnSuccessEl, 'checked');
initAutosave('doubleClickWindows', doubleClickWindowsEl, 'value');
initAutosave('doubleClickInterval', doubleClickIntervalEl, 'value', () => {
    // send the updated doubleClickInterval to the background script
    browser.runtime.sendMessage({
        doubleClickInterval: doubleClickIntervalEl.value
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
 * loadSettings loads the settings from browser storage into the options page.
 */
async function loadSettings() {
    try {
        youtubeMdEl.value = await getSetting('youtubeMd');
        selectionFormatEl.value = await getSetting('selectionFormat');
        selectionTemplateEl.value = await getSetting('selectionTemplate');
        emptyCellJsonEl.value = await getSetting('emptyCellJson');
        subBracketsEl.value = await getSetting('subBrackets');
        bulletPointEl.value = await getSetting('bulletPoint');
        doubleClickWindowsEl.value = await getSetting('doubleClickWindows');
        doubleClickIntervalEl.value = await getSetting('doubleClickInterval');
        createTextFragmentEl.checked = await getSetting('createTextFragment');
        omitNavEl.checked = await getSetting('omitNav');
        omitFooterEl.checked = await getSetting('omitFooter');
        notifyOnWarningEl.checked = await getSetting('notifyOnWarning');
        notifyOnSuccessEl.checked = await getSetting('notifyOnSuccess');
    } catch (err) {
        console.error(err);
        throw err;
    }
}

/**
 * resetSettings deletes all settings from browser storage and indicates success. It
 * assumes it's being used as a form event listener for the 'reset' event so that it
 * doesn't have to reset the options page.
 */
async function resetSettings() {
    await browser.storage.sync.clear();

    selectionTemplateEl.style.display = 'none';
    selectionTemplateLabelEl.style.display = 'none';

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

    const matches = selectionTemplateEl.value.matchAll(/{{([^{}]+)}}/g);
    if (!matches) {
        return;
    }

    for (const match of matches) {
        const [full, key] = match;
        const tokens = key.split('.');

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
            selectionTemplateErrorEl.textContent = `Unknown variable "${key}"`;
            selectionTemplateErrorEl.style.color = 'red';
            selectionTemplateErrorEl.style.display = 'inline-block';
            return;
        }
    }

    selectionTemplateErrorEl.textContent = '';
    selectionTemplateErrorEl.style.display = 'none';
}

selectionFormatEl.addEventListener('change', function () {
    // hide or show the selection template setting based on the selection format
    if (selectionFormatEl.value === 'template') {
        selectionTemplateEl.style.display = 'block';
        selectionTemplateLabelEl.style.display = 'block';
    } else {
        selectionTemplateEl.style.display = 'none';
        selectionTemplateLabelEl.style.display = 'none';
    }
});
new Promise(resolve => setTimeout(resolve, 50)).then(() => {
    selectionFormatEl.dispatchEvent(new Event('change'));
});

selectionTemplateEl.addEventListener('input', async function () {
    await validateTemplateVariables();
});

document.addEventListener('DOMContentLoaded', loadSettings);
form.addEventListener('reset', resetSettings);
