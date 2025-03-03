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
const charCountEl = document.getElementById('char-count');
const syncLimitButton = document.getElementById('sync-limit-button');

const SYNC_SAVE_DELAY = 500; // milliseconds // sync storage time limit: https://developer.chrome.com/docs/extensions/reference/api/storage#property-sync-sync-MAX_WRITE_OPERATIONS_PER_MINUTE
let lastEditTime = 0; // milliseconds
const MAX_SYNC_CHARS = 8100; // sync storage character limit: https://developer.chrome.com/docs/extensions/reference/api/storage#property-sync
const MAX_LOCAL_CHARS = 10485000; // local storage character limit: https://developer.chrome.com/docs/extensions/reference/api/storage#property-local

// For sync storage, all of the notepad's double quotes, backslashes, newlines, and tabs
// are replaced with other characters to prevent the character count from increasing when
// converting to JSON.

let notepadStorageLocation = 'sync';
getSetting('notepadStorageLocation').then(newValue => {
    notepadStorageLocation = newValue;
    const charLimit = getCharLimit();

    // load the notepad content when the page loads
    getLocalSetting('notepadContent').then(content => {
        if (!content) {
            getSetting('notepadContent').then(content => {
                notepad.value = (content || '')
                    .replaceAll('␞', '"')
                    .replaceAll('␛', '\\')
                    .replaceAll('␊', '\n')
                    .replaceAll('␉', '\t');
                updateCharacterCount(charLimit);
            });
        } else {
            notepad.value = content;
            updateCharacterCount(charLimit);
        }
    });
});

browser.commands.getAll().then(cmds => {
    const copySelectionShortcut = cmds.find(
        cmd => cmd.name === 'copySelection'
    )?.shortcut || 'Alt+C';
    notepad.placeholder = `Press ${copySelectionShortcut} to copy and paste.`;
});

// save the notepad content when it changes
notepad.addEventListener('input', async () => {
    lastEditTime = Date.now();
    const charLimit = getCharLimit();
    updateCharacterCount(charLimit);
    await saveNotepad(charLimit);
});

syncLimitButton.addEventListener('click', async () => {
    // move the cursor to where syncing ends
    const charLimit = getCharLimit();
    notepad.selectionStart = charLimit;
    notepad.selectionEnd = charLimit;

    scrollToCursor();
    notepad.focus();
});

browser.runtime.onMessage.addListener(async message => {
    if (message.destination !== 'sidebar') {
        return;
    }

    switch (message.category) {
        case 'notepadStorageLocation':
            if (message.notepadStorageLocation !== notepadStorageLocation) {
                notepadStorageLocation = message.notepadStorageLocation;
                await changeNotepadStorageLocation();
            }
            break;
        case 'sendToNotepad':
            const newText = message.text.trim();
            if (newText) {
                await receiveToNotepad(newText);
            }
            break;
        default:
            console.error(`Unknown message category: ${message.category}`);
            throw new Error(`Unknown message category: ${message.category}`);
    }
});

/**
 * @param {number} charLimit
 * @returns {Promise<void>}
 */
async function saveNotepad(charLimit) {
    await sleep(SYNC_SAVE_DELAY);
    if (lastEditTime + SYNC_SAVE_DELAY > Date.now()) {
        return;
    }

    switch (notepadStorageLocation) {
        case 'sync':
            const isOverCharLimit = notepad.value.length > charLimit;
            if (isOverCharLimit) {
                const limitedChars = notepad.value
                    .substring(0, charLimit)
                    .replaceAll('"', '␞')
                    .replaceAll('\\', '␛')
                    .replaceAll('\n', '␊')
                    .replaceAll('\t', '␉');
                    browser.storage.sync.set({ notepadContent: limitedChars });
                browser.storage.local.set({ notepadContent: notepad.value });
            } else {
                const chars = notepad.value
                    .replaceAll('"', '␞')
                    .replaceAll('\\', '␛')
                    .replaceAll('\n', '␊')
                    .replaceAll('\t', '␉');
                    browser.storage.sync.set({ notepadContent: chars });
                browser.storage.local.set({ notepadContent: '' });
            }
            break;
        case 'local':
            browser.storage.local.set({ notepadContent: notepad.value });
            break;
        default:
            console.error(`Unknown notepadStorageLocation: ${notepadStorageLocation}`);
            throw new Error(`Unknown notepadStorageLocation: ${notepadStorageLocation}`);
    }
}

/**
 * @param {number} charLimit
 * @returns {void}
 */
function updateCharacterCount(charLimit) {
    charCountEl.textContent = `${notepad.value.length}/${charLimit} characters`;
    const isOverCharLimit = notepad.value.length > charLimit;
    if (isOverCharLimit) {
        charCountEl.setAttribute('style', 'color: red');
        if (notepadStorageLocation === 'sync') {
            syncLimitButton.setAttribute('style', 'visibility: visible');
        }
    } else {
        charCountEl.setAttribute('style', 'color: black');
        syncLimitButton.setAttribute('style', 'visibility: hidden');
    }
}

/**
 * @returns {number}
 */
function getCharLimit() {
    switch (notepadStorageLocation) {
        case 'sync':
            return MAX_SYNC_CHARS;
        case 'local':
            return MAX_LOCAL_CHARS;
        default:
            console.error(`Unknown notepadStorageLocation: ${notepadStorageLocation}`);
            throw new Error(`Unknown notepadStorageLocation: ${notepadStorageLocation}`);
    }
}

/**
 * scrollToCursor scrolls the notepad to bring the cursor into view.
 * @returns {void}
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

/**
 * @param {string} newText
 * @returns {Promise<void>}
 */
async function receiveToNotepad(newText) {
    lastEditTime = Date.now();

    const notepadAppendOrInsert = await getSetting('notepadAppendOrInsert');
    if (notepadAppendOrInsert === 'append') {
        notepad.value = (notepad.value.trim() + '\n\n' + newText).trim();
        notepad.scrollTop = notepad.scrollHeight; // scroll to the end
    } else if (notepadAppendOrInsert === 'insert') {
        const before = notepad.value.slice(0, notepad.selectionStart).trim();
        const after = notepad.value.slice(notepad.selectionEnd).trim();
        notepad.value = (before + '\n\n' + newText + '\n\n' + after).trim();

        // move the cursor to the end of the new text
        let newCursorPosition = newText.length;
        if (before.length > 0) {
            newCursorPosition += before.length + 2; // 2 for newlines
        }
        notepad.selectionStart = newCursorPosition;
        notepad.selectionEnd = newCursorPosition;

        scrollToCursor();
    } else {
        console.error(`Unknown notepadAppendOrInsert: "${notepadAppendOrInsert}"`);
        throw new Error(`Unknown notepadAppendOrInsert: "${notepadAppendOrInsert}"`);
    }

    const charLimit = getCharLimit();
    updateCharacterCount(charLimit);
    await saveNotepad(charLimit);
}

/**
 * @returns {Promise<void>}
 */
async function changeNotepadStorageLocation() {
    const charLimit = getCharLimit();
    updateCharacterCount(charLimit);
    await saveNotepad(charLimit);

    const isWithinCharLimit = notepad.value.length <= charLimit;
    if (isWithinCharLimit) {
        // remove the notepad content from its current storage location
        switch (notepadStorageLocation) {
            case 'sync':
                browser.storage.local.set({ notepadContent: '' });
                break;
            case 'local':
                browser.storage.sync.set({ notepadContent: '' });
                break;
            default:
                console.error(`Unknown notepadStorageLocation: ${notepadStorageLocation}`);
                throw new Error(`Unknown notepadStorageLocation: ${notepadStorageLocation}`);
        }
    }
}

const defaultLocalSettings = {
    notepadContent: '',
};

/**
 * getLocalSetting gets a setting from the browser's local storage. If the setting does
 * not exist there, its default value is returned.
 * @param {string} name - the name of the setting.
 * @returns {Promise<any>}
 */
async function getLocalSetting(name) {
    let obj;
    try {
        obj = await browser.storage?.local.get(name);
    } catch (err) {
        console.error(err);
        return defaultLocalSettings[name];
    }
    if (obj === undefined) {
        return defaultLocalSettings[name];
    }

    const value = obj[name];
    if (value === undefined) {
        return defaultLocalSettings[name];
    }

    return value;
}
