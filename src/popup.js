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

if (typeof browser === 'undefined') {
    var browser = chrome;
}

const copyButton = document.getElementById('copyButton');
const helpButton = document.getElementById('helpButton');

copyButton.addEventListener('click', async () => {
    browser.runtime.sendMessage({ copyButtonPressed: true });
});
helpButton.addEventListener('click', async () => {
    browser.runtime.sendMessage({ helpButtonPressed: true });
});
