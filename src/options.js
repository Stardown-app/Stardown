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

const submitButton = document.querySelector('#submit');
const resetButton = document.querySelector('#reset');

async function saveOptions(e) {
    e.preventDefault();
    await browser.storage.sync.set(
        {
            youtubeMd: youtubeMdEl.value,
            selectionFormat: selectionFormatEl.value,
            subBrackets: subBracketsEl.value,
            bulletPoint: bulletPointEl.value,
            doubleClickWindows: doubleClickWindowsEl.value,
            doubleClickInterval: doubleClickIntervalEl.value,
            notifyOnSuccess: notifyOnSuccessEl.checked,
        },
        () => {
            // indicate saving was successful
            submitButton.value = 'Saved ✔';
            submitButton.style.backgroundColor = '#00d26a';
            setTimeout(() => {
                submitButton.value = 'Save';
                submitButton.style.backgroundColor = '';
            }, 750);

            // send the updated doubleClickInterval to the background script
            browser.runtime.sendMessage({
                doubleClickInterval: doubleClickIntervalEl.value
            });
        }
    );
}

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
form.addEventListener('submit', saveOptions);
form.addEventListener('reset', resetOptions);
