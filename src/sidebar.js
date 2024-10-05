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

import { browser } from './browserSpecific.js';
import { getSetting } from './getSetting.js';

const notepad = document.getElementById('notepad');

browser.commands.getAll().then(cmds => {
    const copySelectionShortcut = cmds.find(
        cmd => cmd.name === 'copySelection'
    )?.shortcut || 'Alt+C';
    notepad.placeholder = `Press ${copySelectionShortcut} to copy and paste.`;
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
    if (message.destination !== 'sidebar') {
        return;
    }

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
