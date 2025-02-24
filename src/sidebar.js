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

const MAX_SYNC_CHARS = 8100; // sync storage character limit: https://developer.chrome.com/docs/extensions/reference/api/storage#property-sync
const MAX_LOCAL_CHARS = 10485000; // local storage character limit: https://developer.chrome.com/docs/extensions/reference/api/storage#property-local
let maxChars = MAX_SYNC_CHARS;

notepad.setAttribute('maxlength', maxChars);

const charCount = document.getElementById('char-count');

const SYNC_SAVE_DELAY = 500; // milliseconds // sync storage time limit: https://developer.chrome.com/docs/extensions/reference/api/storage#property-sync-sync-MAX_WRITE_OPERATIONS_PER_MINUTE
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
            const newText = message.text.trim();
            // if the new text to add would go over the character limit
            if (newText.length + 4 + notepad.value.length > maxChars) { // 4 for newlines
                // ignore the new text and turn the character counter red
                charCount.setAttribute('style', 'color: red;');
                return;
            }
            charCount.setAttribute('style', 'color: black;');

            lastEditTime = Date.now();

            const notepadAppendOrInsert = await getSetting('notepadAppendOrInsert');
            if (notepadAppendOrInsert === 'append') {
                notepad.value = notepad.value.trim() + '\n\n' + newText;
                notepad.scrollTop = notepad.scrollHeight; // scroll to the end
            } else if (notepadAppendOrInsert === 'insert') {
                const before = notepad.value.slice(0, notepad.selectionStart).trim();
                const after = notepad.value.slice(notepad.selectionEnd).trim();
                notepad.value = before + '\n\n' + newText + '\n\n' + after;

                // move the cursor to the end of the new text
                const newCursorPosition = before.length + newText.length + 2; // 2 for newlines
                notepad.selectionStart = newCursorPosition;
                notepad.selectionEnd = newCursorPosition;

                scrollToCursor();
            } else {
                console.error(`Unknown value of notepadAppendOrInsert setting: "${notepadAppendOrInsert}"`);
                throw new Error(`Unknown value of notepadAppendOrInsert setting: "${notepadAppendOrInsert}"`);
            }

            updateCharacterCount();
            await saveNotepad();
            break;
        default:
            console.error(`Unknown message category: ${message.category}`);
            throw new Error(`Unknown message category: ${message.category}`);
    }
});

async function saveNotepad() {
    await sleep(SYNC_SAVE_DELAY);
    if (lastEditTime + SYNC_SAVE_DELAY > Date.now()) {
        return;
    }

    browser.storage.sync.set({ notepadContent: notepad.value });
}

function updateCharacterCount() {
    charCount.textContent = `${notepad.value.length}/${maxChars} characters`;
}

/**
 * scrollToCursor scrolls the notepad to bring the cursor into view.
 */
function scrollToCursor() {
    const textBeforeCursor = notepad.value.substring(0, notepad.selectionStart);
    const linesBeforeCursor = textBeforeCursor.split('\n').length;

    const lineHeight = parseInt(window.getComputedStyle(notepad).lineHeight);
    const visibleHeight = notepad.clientHeight;
    const scrollPosition = notepad.scrollTop;

    const cursorY = linesBeforeCursor * lineHeight;

    const isCursorAbove = cursorY < scrollPosition;
    const isCursorBelow = cursorY > scrollPosition + visibleHeight - lineHeight;

    if (isCursorAbove) {
        notepad.scrollTop = cursorY;
    } else if (isCursorBelow) {
        notepad.scrollTop = cursorY - visibleHeight + lineHeight;
    }
    // if the cursor is already visible, don't scroll
}
