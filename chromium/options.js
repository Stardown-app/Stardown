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
    await browser.storage.sync.set({
        sub_brackets: document.querySelector("#sub_brackets").value,
    });
}

async function loadOptions() {
    try {
        const sub_brackets = (await browser.storage.sync.get("sub_brackets")).sub_brackets;
        document.querySelector("#sub_brackets").value = sub_brackets || "underlined";
    } catch (err) {
        console.error(err);
    }
}

document.addEventListener("DOMContentLoaded", loadOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
