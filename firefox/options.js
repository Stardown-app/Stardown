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

async function saveOptions(e) {
    e.preventDefault();
    await browser.storage.sync.set(
        {
            sub_brackets: document.querySelector("#sub_brackets").value,
            use_selected: document.querySelector("#use_selected").checked,
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
        const sub_brackets = (await browser.storage.sync.get("sub_brackets")).sub_brackets;
        document.querySelector("#sub_brackets").value = sub_brackets || "underlined";

        let use_selected = (await browser.storage.sync.get("use_selected")).use_selected;
        if (use_selected === undefined) {
            use_selected = true;
            await browser.storage.sync.set({ use_selected: true });
        }
        document.querySelector("#use_selected").checked = use_selected;
    } catch (err) {
        console.error(err);
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

document.addEventListener("DOMContentLoaded", loadOptions);
const form = document.querySelector("form")
form.addEventListener("submit", saveOptions);
form.addEventListener("reset", resetOptions);
