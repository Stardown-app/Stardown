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
const subBracketsEl = document.querySelector('#subBrackets');
const bulletPointEl = document.querySelector('#bulletPoint');
const doubleClickWindowsEl = document.querySelector('#doubleClickWindows');
const doubleClickIntervalEl = document.querySelector('#doubleClickInterval');
const notifyOnSuccessEl = document.querySelector('#notifyOnSuccess');

const resetButton = document.querySelector('#reset');

// set up setting autosaving
initAutosave('youtubeMd', youtubeMdEl, 'value');
initAutosave('selectionFormat', selectionFormatEl, 'value');
initAutosave('subBrackets', subBracketsEl, 'value');
initAutosave('bulletPoint', bulletPointEl, 'value');
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
 * loadOptions loads the options from browser storage into the options page.
 */
async function loadOptions() {
    try {
        youtubeMdEl.value = await getSetting('youtubeMd');
        selectionFormatEl.value = await getSetting('selectionFormat');
        subBracketsEl.value = await getSetting('subBrackets');
        bulletPointEl.value = await getSetting('bulletPoint');
        doubleClickWindowsEl.value = await getSetting('doubleClickWindows');
        doubleClickIntervalEl.value = await getSetting('doubleClickInterval');
        notifyOnSuccessEl.checked = await getSetting('notifyOnSuccess');
    } catch (err) {
        console.error(err);
        throw err;
    }
}

/**
 * resetOptions resets the options on the options page and indicates success.
 */
async function resetOptions() {
    await browser.storage.sync.clear();
    resetButton.value = 'Reset ✔';
    resetButton.style.backgroundColor = '#aadafa';
    setTimeout(() => {
        resetButton.value = 'Reset';
        resetButton.style.backgroundColor = '';
    }, 750);
}

document.addEventListener('DOMContentLoaded', loadOptions);
form.addEventListener('reset', resetOptions);
