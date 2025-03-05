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
import { CodeJar } from './codejar.js';
import { getSetting } from './getSetting.js';

const notepadEl = document.getElementById('notepad');
const byteCountEl = document.getElementById('byteCount');
const syncLimitMessageEl = document.getElementById('syncLimitMessage');

const jar = CodeJar(notepadEl, highlight);

const SYNC_SAVE_DELAY = 500; // milliseconds // sync storage time limit: https://developer.chrome.com/docs/extensions/reference/api/storage#property-sync-sync-MAX_WRITE_OPERATIONS_PER_MINUTE
let lastEditTime = 0; // milliseconds
const MAX_SYNC_BYTES = 8100; // sync storage byte limit: https://developer.chrome.com/docs/extensions/reference/api/storage#property-sync
const MAX_LOCAL_BYTES = 10485000; // local storage byte limit: https://developer.chrome.com/docs/extensions/reference/api/storage#property-local

let notepadStorageLocation = 'sync';
getSetting('notepadStorageLocation').then(newValue => {
    notepadStorageLocation = newValue;
    const byteLimit = getByteLimit();

    // load the notepad content when the page loads
    getLocalSetting('notepadContent').then(content => {
        if (!content) {
            getSetting('notepadContent').then(content => {
                jar.updateCode(content || '');
            });
        } else {
            jar.updateCode(content || '');
        }
    });
});

browser.commands.getAll().then(cmds => {
    const copySelectionShortcut = cmds.find(
        cmd => cmd.name === 'copySelection'
    )?.shortcut || 'Alt+C';
    notepadEl.setAttribute('data-placeholder', `Press ${copySelectionShortcut} to copy and paste.`);
});

// save the notepad content when it changes
notepadEl.addEventListener('input', async () => {
    lastEditTime = Date.now();
    const byteLimit = getByteLimit();
    await saveNotepad(byteLimit);
});

// prevent writing to the clipboard with the HTML MIME type because it's completely
// unnecessary and sometimes causes formatting problems when pasting
notepadEl.addEventListener('copy', event => {
    event.preventDefault();

    const selection = window.getSelection();
    const selectedText = selection.toString();
    if (selectedText) {
        event.clipboardData.setData('text/plain', selectedText);
    }
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

function highlight(editor, cursorPos) {
    let text = editor.textContent || '';

    const byteLimit = getByteLimit();
    const byteCount = getJsonByteCount(text);

    // update the byte count
    byteCountEl.textContent = `${byteCount}/${byteLimit} bytes`;

    const isOverByteLimit = byteCount > byteLimit;
    if (isOverByteLimit) {
        byteCountEl.style.color = 'red';
        syncLimitMessageEl.style.visibility = 'visible';

        // give a light red background to the characters that are over the byte limit
        const before = getSubstringByJsonBytes(text, byteLimit);
        const after = text.slice(before.length);
        text = `${before}<span style="background-color: rgba(255, 0, 0, 0.2)">${after}</span>`
    } else {
        byteCountEl.style.color = 'black';
        syncLimitMessageEl.style.visibility = 'hidden';
    }

    // apply markdown syntax highlighting
    text = text
        // header
        .replaceAll(/((^|\n)#+ [^\n]*)/g, '<span style="color: rgb(199, 83, 0)">$1</span>')
        // link
        .replaceAll(/\[([^\^]?[^\[\]\n]*)\]\(([^\(\)\n]+)\)/g, '[<span style="color: rgb(50, 116, 240)">$1</span>](<span style="color: rgb(150, 150, 150)">$2</span>)')
        // inline code block delimited by single backticks
        .replaceAll(/(?<!`)`([^`\n]+)`(?!`)/g, '`<span style="background-color: rgb(224, 224, 224)">$1</span>`')
        // code block
        .replaceAll(/(^|\n)([`~]{3,}[^\n]*\n(?:.|\n)*?[`~]{3,})\n/g, '$1<span style="background-color: rgb(224, 224, 224); display: block;">$2</span>\n')
        // bold and/or italic
        .replaceAll(/((\*|_){1,3}\S(?:[^\n]+?\S)?\2)/g, '<span style="color: rgb(6, 117, 15)">$1</span>')

    editor.innerHTML = text;
}

/**
 * @param {number} byteLimit
 * @returns {Promise<void>}
 */
async function saveNotepad(byteLimit) {
    await sleep(SYNC_SAVE_DELAY);
    if (lastEditTime + SYNC_SAVE_DELAY > Date.now()) {
        return;
    }

    const content = jar.toString().trim();

    switch (notepadStorageLocation) {
        case 'sync':
            const isOverByteLimit = getJsonByteCount(content) > byteLimit;
            if (isOverByteLimit) {
                const limitedChars = getSubstringByJsonBytes(content, byteLimit);
                browser.storage.sync.set({ notepadContent: limitedChars });
                browser.storage.local.set({ notepadContent: content });
            } else {
                browser.storage.sync.set({ notepadContent: content });
                browser.storage.local.set({ notepadContent: '' });
            }
            break;
        case 'local':
            browser.storage.local.set({ notepadContent: content });
            break;
        default:
            console.error(`Unknown notepadStorageLocation: ${notepadStorageLocation}`);
            throw new Error(`Unknown notepadStorageLocation: ${notepadStorageLocation}`);
    }
}

/**
 * @returns {number}
 */
function getByteLimit() {
    switch (notepadStorageLocation) {
        case 'sync':
            return MAX_SYNC_BYTES;
        case 'local':
            return MAX_LOCAL_BYTES;
        default:
            console.error(`Unknown notepadStorageLocation: ${notepadStorageLocation}`);
            throw new Error(`Unknown notepadStorageLocation: ${notepadStorageLocation}`);
    }
}

/**
 * getJsonByteCount determines the number of bytes a string will be after it is converted
 * to a JSON string not including the double quotes that delimit the JSON string.
 * @param {string} text
 * @returns {number}
 */
function getJsonByteCount(text) {
    return new Blob([JSON.stringify(text)]).size - 2;
}

/**
 * scrollToCursor scrolls the notepad to bring the cursor into view.
 * @returns {void}
 */
function scrollToCursor() {
    const cursorPos = jar.save();
    const textBeforeCursor = jar.toString().substring(0, cursorPos.start);
    const linesBeforeCursor = textBeforeCursor.split('\n').length;

    const lineHeight = parseInt(window.getComputedStyle(notepadEl).lineHeight);
    const visibleHeight = notepadEl.clientHeight;
    const scrollPosition = notepadEl.scrollTop;

    const cursorY = linesBeforeCursor * lineHeight;

    const isCursorAbove = cursorY < scrollPosition;
    const isCursorBelow = cursorY > scrollPosition + visibleHeight - lineHeight;

    if (isCursorAbove) {
        notepadEl.scrollTop = cursorY;
    } else if (isCursorBelow) {
        notepadEl.scrollTop = cursorY - visibleHeight + lineHeight;
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
        jar.updateCode((jar.toString().trim() + '\n\n' + newText).trim());
        notepadEl.scrollTop = notepadEl.scrollHeight; // scroll to the end
    } else if (notepadAppendOrInsert === 'insert') {
        const cursorPos = jar.save();
        const before = jar.toString().slice(0, cursorPos.start).trim();
        const after = jar.toString().slice(cursorPos.end).trim();
        jar.updateCode((before + '\n\n' + newText + '\n\n' + after).trim());

        // move the cursor to the end of the new text
        let newCursorPosition = newText.length;
        if (before.length > 0) {
            newCursorPosition += before.length + 2; // 2 for newlines
        }
        jar.restore({
            start: newCursorPosition,
            end: newCursorPosition,
        });

        scrollToCursor();
    } else {
        console.error(`Unknown notepadAppendOrInsert: "${notepadAppendOrInsert}"`);
        throw new Error(`Unknown notepadAppendOrInsert: "${notepadAppendOrInsert}"`);
    }

    const byteLimit = getByteLimit();
    await saveNotepad(byteLimit);
}

/**
 * @returns {Promise<void>}
 */
async function changeNotepadStorageLocation() {
    const byteLimit = getByteLimit();
    await saveNotepad(byteLimit);

    const isWithinByteLimit = getJsonByteCount(jar.toString()) <= byteLimit;
    if (isWithinByteLimit) {
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

/**
 * getSubstringByJsonBytes gets the beginning of the string up to byteLimit JSON bytes
 * without splitting any characters.
 * @param {string} text
 * @param {number} byteLimit
 * @returns {string}
 */
function getSubstringByJsonBytes(text, byteLimit) {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const encoded = encoder.encode(JSON.stringify(text)).slice(1, -1);
    if (encoded.length <= byteLimit) {
        return text;
    }

    // find the last valid character boundary within the byte limit
    let validByteLength = byteLimit;
    while (validByteLength > 0 && (encoded[validByteLength] & 0xC0) === 0x80) {
        validByteLength--;
    }

    // decode the valid portion
    return JSON.parse('"' + decoder.decode(encoded.subarray(0, validByteLength)) + '"');
}
