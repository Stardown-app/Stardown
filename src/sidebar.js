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

import { browser, sleep } from './browserSpecific.js';
import { getSetting } from './getSetting.js';

const notepad = document.getElementById('notepad');
const MAX_CHARS = 8100; // sync storage character limit: https://developer.chrome.com/docs/extensions/reference/api/storage#property-sync-sync-QUOTA_BYTES_PER_ITEM:~:text=quota_bytes_per_item
notepad.setAttribute('maxlength', MAX_CHARS);
// if we switch to local storage to save the notepad, set MAX_CHARS to 10485000

const charCount = document.getElementById('char-count');

const SAVE_DELAY = 500; // milliseconds // sync storage time limit: https://developer.chrome.com/docs/extensions/reference/api/storage#property-sync-sync-MAX_WRITE_OPERATIONS_PER_MINUTE
let lastEditTime = 0; // milliseconds

browser.commands.getAll().then(cmds => {
    const copySelectionShortcut = cmds.find(
        cmd => cmd.name === 'copySelection'
    )?.shortcut || 'Alt+C';
    notepad.placeholder = `Press ${copySelectionShortcut} to copy and paste.`;
});

// load the notepad content when the page loads
getSetting('notepadContent').then(content => {
    notepad.value = content || '';
    updateCharacterCount();
});

// save the notepad content when it changes
notepad.addEventListener('input', async () => {
    lastEditTime = Date.now();
    updateCharacterCount();
    charCount.setAttribute('style', 'color: black;');
    await saveNotepad();
});

browser.runtime.onMessage.addListener(async message => {
    if (message.destination !== 'sidebar') {
        return;
    }

    switch (message.category) {
        case 'sendToNotepad':
            const newText = '\n\n' + message.text.trim() + '\n\n';
            // if the new text to add would go over the character limit
            if (newText.length + notepad.value.length > MAX_CHARS) {
                // ignore the new text and turn the character counter red
                charCount.setAttribute('style', 'color: red;');
                return;
            }
            charCount.setAttribute('style', 'color: black;');

            const notepadAppendOrInsert = await getSetting('notepadAppendOrInsert');
            if (notepadAppendOrInsert === 'append') {
                notepad.value = (notepad.value.trimEnd() + newText).trim();
            } else if (notepadAppendOrInsert === 'insert') {
                const before = notepad.value.slice(0, notepad.selectionStart).trimEnd();
                const after = notepad.value.slice(notepad.selectionEnd).trimStart();
                notepad.value = (before + newText + after).trim();
            } else {
                console.error(`Unknown value of notepadAppendOrInsert setting: "${notepadAppendOrInsert}"`);
                throw new Error(`Unknown value of notepadAppendOrInsert setting: "${notepadAppendOrInsert}"`);
            }

            lastEditTime = Date.now();
            updateCharacterCount();
            await saveNotepad();
            break;
        default:
            console.error(`Unknown message category: ${message.category}`);
            throw new Error(`Unknown message category: ${message.category}`);
    }
});

async function saveNotepad() {
    await sleep(SAVE_DELAY);
    if (lastEditTime + SAVE_DELAY > Date.now()) {
        return;
    }

    browser.storage.sync.set({ notepadContent: notepad.value });
}

function updateCharacterCount() {
    charCount.textContent = `${notepad.value.length}/${MAX_CHARS} characters`;
}
