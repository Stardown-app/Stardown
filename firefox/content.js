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

let clickedElement;

document.addEventListener(
    'contextmenu',
    function (event) {
        clickedElement = event.target;
    },
    true,
);

browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request === "getClickedElementId") {
        // if clickedElement doesn't have an id, look at its parent
        while (clickedElement && !clickedElement.id) {
            clickedElement = clickedElement.parentElement;
        }
        if (clickedElement === null) {
            console.log('No HTML element with an ID was found in the clicked path');
            return;
        }
        sendResponse(clickedElement.id);
    }
    return true;
});
