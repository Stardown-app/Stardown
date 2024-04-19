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

async function saveOptions(e) {
    e.preventDefault();
    await browser.storage.sync.set(
        {
            subBrackets: document.querySelector("#subBrackets").value,
            linkFormat: document.querySelector("#linkFormat").value,
            bulletPoint: document.querySelector("#bulletPoint").value,
            doubleClickWindows: document.querySelector("#doubleClickWindows").value,
            doubleClickInterval: document.querySelector("#doubleClickInterval").value,
        },
        () => {
            // indicate saving was successful
            const button = document.querySelector('#submit');
            button.value = 'Saved ✔';
            button.style.backgroundColor = '#00d26a';
            setTimeout(() => {
                button.value = 'Save';
                button.style.backgroundColor = '';
            }, 750);
        }
    );
}

async function loadOptions() {
    try {
        const subBrackets = await getSetting("subBrackets", "underlined");
        document.querySelector("#subBrackets").value = subBrackets;

        const linkFormat = await getSetting("linkFormat", "blockquote");
        document.querySelector("#linkFormat").value = linkFormat;

        const bulletPoint = await getSetting("bulletPoint", "-");
        document.querySelector("#bulletPoint").value = bulletPoint;

        const doubleClickWindows = await getSetting("doubleClickWindows", "current");
        document.querySelector("#doubleClickWindows").value = doubleClickWindows;

        const doubleClickInterval = await getSetting("doubleClickInterval", 500);
        document.querySelector("#doubleClickInterval").value = doubleClickInterval;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

async function resetOptions() {
    await browser.storage.sync.clear();
    const button = document.querySelector('#reset');
    button.value = 'Reset ✔';
    button.style.backgroundColor = '#aadafa';
    setTimeout(() => {
        button.value = 'Reset';
        button.style.backgroundColor = '';
    }, 750);
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
        if (v === undefined) {
            return default_;
        }
        return v;
    } catch (err) {
        console.error(err);
        return default_;
    }
}

document.addEventListener("DOMContentLoaded", loadOptions);
const form = document.querySelector("form")
form.addEventListener("submit", saveOptions);
form.addEventListener("reset", resetOptions);
