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

const notepad = document.getElementById('notepad');

browser.commands.getAll().then(cmds => {
    const copyShortcut = cmds.find(cmd => cmd.name === 'copy')?.shortcut || 'Alt+C';
    notepad.placeholder = `Press ${copyShortcut} to copy to here...`;
});

// load the notepad content when the page loads
getSetting('notepadContent').then(content => {
    notepad.value = content || '';
});

// save the notepad content when it changes
notepad.addEventListener('input', () => {
    browser.storage.sync.set({ notepadContent: notepad.value });
});

browser.runtime.onMessage.addListener(message => {
    switch (message.category) {
        case 'sendToNotepad':
            const newText = '\n\n' + message.text.trim() + '\n\n';

            const before = notepad.value.slice(0, notepad.selectionStart).trimEnd();
            const after = notepad.value.slice(notepad.selectionEnd).trimStart();

            notepad.value = (before + newText + after).trim();
            browser.storage.sync.set({ notepadContent: notepad.value });
            break;
        default:
            console.error(`Unknown message category: ${message.category}`);
            throw new Error(`Unknown message category: ${message.category}`);
    }
});

const defaultSettings = {
    notepadContent: '',
};

/**
 * getSetting gets a setting from the browser's sync storage. If the setting does not
 * exist there, its default value is returned.
 * @param {string} name - the name of the setting.
 * @returns {Promise<any>}
 */
async function getSetting(name) {
    let obj;
    try {
        obj = await browser.storage?.sync.get(name);
    } catch (err) {
        console.error(err);
        return defaultSettings[name];
    }
    if (obj === undefined) {
        return defaultSettings[name];
    }

    const value = obj[name];
    if (value === undefined) {
        return defaultSettings[name];
    }

    return value;
}
