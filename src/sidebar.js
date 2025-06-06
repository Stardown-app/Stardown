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

import { browser } from "./browserSpecific.js";
import { CodeJar } from "./codejar.js";
import { getSetting } from "./getSetting.js";

/**
 * @typedef {import('./codejar.js').Position} Position
 */

const notepadEl = document.getElementById("notepad");
const byteCountEl = document.getElementById("byteCount");
const syncLimitMessageEl = document.getElementById("syncLimitMessage");
const syncLimitButton = document.getElementById("syncLimitButton");
const saveErrorIconEl = document.getElementById("saveErrorIcon");

const jar = CodeJar(notepadEl, codejarHighlight);

const SYNC_SAVE_DELAY = 500; // milliseconds // sync storage time limit: https://developer.chrome.com/docs/extensions/reference/api/storage#property-sync-sync-MAX_WRITE_OPERATIONS_PER_MINUTE
const MAX_SYNC_BYTES = 8100; // sync storage byte limit: https://developer.chrome.com/docs/extensions/reference/api/storage#property-sync
const MAX_LOCAL_BYTES = 10485000; // local storage byte limit: https://developer.chrome.com/docs/extensions/reference/api/storage#property-local
let notepadStorageLocation = "sync";

async function main() {
    notepadStorageLocation = await getSetting("notepadStorageLocation");

    document.body.style.fontSize = await getSetting("notepadFontSize");

    // load notepad content
    let content = await getLocalSetting("notepadContent");
    if (!content) {
        content = await getSetting("notepadContent");
    }
    jar.updateCode(content);

    // scroll to the previous scroll position
    notepadEl.scrollTop = await getSetting("notepadScrollPosition");

    // set placeholder text
    const cmds = await browser.commands.getAll();
    const copySelectionShortcut =
        cmds.find((cmd) => cmd.name === "copySelection")?.shortcut || "Alt+C";
    notepadEl.setAttribute(
        "data-placeholder",
        `Press ${copySelectionShortcut} to copy and paste.`,
    );
}

syncLimitButton.addEventListener("click", () => {
    // move the cursor to where syncing ends
    const byteLimit = getByteLimit();
    const i = getSubstringByJsonBytes(jar.toString(), byteLimit).length;
    jar.restore({
        start: i,
        end: i,
    });

    scrollToCursor();
    notepadEl.focus();
});

notepadEl.addEventListener("scrollend", (event) => {
    saveScrollPosition();
});

// save the notepad content when it changes
notepadEl.addEventListener("input", async () => {
    const byteLimit = getByteLimit();
    saveNotepad(byteLimit);
});

// prevent writing to the clipboard with the HTML MIME type because it's completely
// unnecessary and sometimes causes formatting problems when pasting
notepadEl.addEventListener("copy", (event) => {
    event.preventDefault();

    const selection = window.getSelection();
    const selectedText = selection.toString();
    if (selectedText) {
        event.clipboardData.setData("text/plain", selectedText);
    } else {
        // copy the line the cursor is on
        const cursorPosStart = jar.save().start;
        const content = jar.toString();
        if (content.length === 0) {
            event.clipboardData.setData("text/plain", "");
            return;
        }

        let leftEdge = cursorPosStart - 1;
        while (leftEdge >= 0 && content[leftEdge] !== "\n") {
            leftEdge--;
        }
        let rightEdge = cursorPosStart;
        while (rightEdge < content.length && content[rightEdge] !== "\n") {
            rightEdge++;
        }

        event.clipboardData.setData(
            "text/plain",
            content.slice(leftEdge + 1, rightEdge) + "\n",
        );
    }
});

browser.runtime.onMessage.addListener(async (message) => {
    if (message.destination !== "sidebar") {
        return;
    }

    switch (message.category) {
        case "notepadFontSize":
            document.body.style.fontSize = message.notepadFontSize;
            break;
        case "notepadStorageLocation":
            if (message.notepadStorageLocation !== notepadStorageLocation) {
                notepadStorageLocation = message.notepadStorageLocation;
                await changeNotepadStorageLocation();
            }
            break;
        case "sendToNotepad":
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
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("'", "&#039;");
}

/**
 * @param {Element} editor
 * @param {Position} cursorPos
 */
function codejarHighlight(editor, cursorPos) {
    let text = editor.textContent || "";

    const byteLimit = getByteLimit();
    const byteCount = getJsonByteCount(text);

    // update the byte count
    byteCountEl.textContent = `${byteCount}/${byteLimit} bytes`;

    let beforeLimit = "";
    let afterLimit = "";
    const isOverByteLimit = byteCount > byteLimit;
    if (isOverByteLimit) {
        byteCountEl.style.color = "red";
        syncLimitMessageEl.style.visibility = "visible";

        beforeLimit = getSubstringByJsonBytes(text, byteLimit);
        afterLimit = escapeHtml(text.slice(beforeLimit.length));
        // give a light red background to the characters that are over the byte limit
        afterLimit =
            '<span style="background-color: rgba(255, 0, 0, 0.2)">' +
            afterLimit +
            "</span>";
    } else {
        beforeLimit = text;
        byteCountEl.style.color = "black";
        syncLimitMessageEl.style.visibility = "hidden";
    }

    editor.innerHTML = highlight(escapeHtml(beforeLimit)) + afterLimit;
    // afterLimit should probably not be highlighted because (1) it doesn't really need to
    // be, (2) the red background that marks which characters are over the limit would not
    // appear everywhere it should, and (3) if the byte limit is within an element that
    // normally should be highlighted, all highlighting throughout afterLimit would
    // probably get messed up
}

/**
 * highlight applies syntax highlighting.
 * @param {string} text
 * @returns {string}
 */
function highlight(text) {
    return (
        text
            // header
            .replaceAll(
                /((^|\n)#+ [^\n]*)/g,
                '<span style="color: rgb(199, 83, 0)">$1</span>',
            )

            // link
            .replaceAll(
                /\[([^\^]?[^\[\]\n]*)\]\(([^\(\)\s]+(?: "[^"\n]+")?)\)/g,
                '[<span style="color: rgb(50, 116, 240)">$1</span>](<span style="color: rgb(150, 150, 150)">$2</span>)',
            )

            // inline code block
            .replaceAll(
                /(`+)([^\n]*?[^`\n][^\n]*?)\1/g,
                '$1<span style="background-color: rgb(224, 224, 224)">$2</span>$1',
            )

            // code block
            .replaceAll(
                /(^|\n)(([`~]{3,})[^\n]*\n(?:.|\n)*?\3)\n/g,
                '$1<span style="background-color: rgb(224, 224, 224); display: block;">$2</span>\n',
            )

            // bold, or both bold and italic
            .replaceAll(
                /((\*\*\*|___|\*\*|__)\S(?:[^\n]*?\S)?\2)/g,
                '<span style="color: rgb(6, 117, 15)">$1</span>',
            )
    );
    // Text that is only italic is not highlighted. Otherwise, many characters that
    // are not italic would also be highlighted since URLs often have at least one
    // underscore. There's no easy way to prevent that when using regex in this way.
    // Highlighting italic text isn't really important anyways.
}

let notepadSaveTimeout = 0;
function saveNotepad() {
    clearTimeout(notepadSaveTimeout);
    notepadSaveTimeout = setTimeout(() => {
        const content = jar.toString().trim();

        try {
            switch (notepadStorageLocation) {
                case "sync":
                    const byteLimit = getByteLimit();
                    const isOverByteLimit =
                        getJsonByteCount(content) > byteLimit;
                    if (isOverByteLimit) {
                        const limitedChars = getSubstringByJsonBytes(
                            content,
                            byteLimit,
                        );
                        browser.storage.sync.set({
                            notepadContent: limitedChars,
                        });
                        browser.storage.local.set({ notepadContent: content });
                    } else {
                        browser.storage.sync.set({ notepadContent: content });
                        browser.storage.local.set({ notepadContent: "" });
                    }
                    break;
                case "local":
                    browser.storage.local.set({ notepadContent: content });
                    break;
                default:
                    console.error(
                        `Unknown notepadStorageLocation: ${notepadStorageLocation}`,
                    );
                    throw new Error(
                        `Unknown notepadStorageLocation: ${notepadStorageLocation}`,
                    );
            }
        } catch (err) {
            saveErrorIconEl.style.visibility = "visible";
            setTimeout(() => {
                saveErrorIconEl.style.visibility = "hidden";
            }, 5000);

            throw err;
        }
    }, SYNC_SAVE_DELAY);
}

let scrollPosTimeout = 0;
function saveScrollPosition() {
    clearTimeout(scrollPosTimeout);
    scrollPosTimeout = setTimeout(() => {
        browser.storage.sync.set({
            notepadScrollPosition: notepadEl.scrollTop,
        });
    }, SYNC_SAVE_DELAY);
}

/**
 * @returns {number}
 */
function getByteLimit() {
    switch (notepadStorageLocation) {
        case "sync":
            return MAX_SYNC_BYTES;
        case "local":
            return MAX_LOCAL_BYTES;
        default:
            console.error(
                `Unknown notepadStorageLocation: ${notepadStorageLocation}`,
            );
            throw new Error(
                `Unknown notepadStorageLocation: ${notepadStorageLocation}`,
            );
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
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
        // there isn't even a caret
        return;
    }

    const range = selection.getRangeAt(0);
    const span = document.createElement("span");
    range.insertNode(span);
    span.scrollIntoView({ block: "center" });
    span.remove();
}

/**
 * @param {string} newText
 * @returns {Promise<void>}
 */
async function receiveToNotepad(newText) {
    const notepadAppendOrInsert = await getSetting("notepadAppendOrInsert");
    if (notepadAppendOrInsert === "append") {
        jar.updateCode((jar.toString().trim() + "\n\n" + newText).trim());
        // scroll to the end
        notepadEl.scrollTop = notepadEl.scrollHeight;
        // move the cursor to the end
        jar.restore({
            start: notepadEl.textContent.length,
            end: notepadEl.textContent.length,
        });
    } else if (notepadAppendOrInsert === "insert") {
        let cursorPos;
        try {
            cursorPos = jar.save();
        } catch (err) {
            cursorPos = { start: 0, end: 0, dir: undefined };
        }
        const before = jar.toString().slice(0, cursorPos.start).trim();
        const after = jar.toString().slice(cursorPos.end).trim();
        jar.updateCode((before + "\n\n" + newText + "\n\n" + after).trim());

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
        console.error(
            `Unknown notepadAppendOrInsert: "${notepadAppendOrInsert}"`,
        );
        throw new Error(
            `Unknown notepadAppendOrInsert: "${notepadAppendOrInsert}"`,
        );
    }

    saveNotepad();
}

/**
 * @returns {Promise<void>}
 */
async function changeNotepadStorageLocation() {
    // save the notepad's content to the new storage location
    saveNotepad();

    // if the notepad's content is within the new storage location's
    // byte limit, remove the content from the old storage location
    const isWithinByteLimit =
        getJsonByteCount(jar.toString()) <= getByteLimit();
    if (isWithinByteLimit) {
        // remove the notepad content from its current storage location
        switch (notepadStorageLocation) {
            case "sync":
                browser.storage.local.set({ notepadContent: "" });
                break;
            case "local":
                browser.storage.sync.set({ notepadContent: "" });
                break;
            default:
                console.error(
                    `Unknown notepadStorageLocation: ${notepadStorageLocation}`,
                );
                throw new Error(
                    `Unknown notepadStorageLocation: ${notepadStorageLocation}`,
                );
        }
    }

    // update the byte limit display
    codejarHighlight(notepadEl, { start: 0, end: 0, dir: "->" });
}

const defaultLocalSettings = {
    notepadContent: "",
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
    while (validByteLength > 0 && (encoded[validByteLength] & 0xc0) === 0x80) {
        validByteLength--;
    }

    // decode the valid portion
    return JSON.parse(
        '"' + decoder.decode(encoded.subarray(0, validByteLength)) + '"',
    );
}

main();
