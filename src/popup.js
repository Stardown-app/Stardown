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

const copySelectionButton = document.querySelector('#copySelectionButton');
const copyEntirePageButton = document.querySelector('#copyEntirePageButton');
const copyMultipleTabsButton = document.querySelector('#copyMultipleTabsButton');
const sidebarButton = document.querySelector('#sidebarButton');
const settingsButton = document.querySelector('#settingsButton');
const reportBugButton = document.querySelector('#reportBugButton');
const requestFeatureButton = document.querySelector('#requestFeatureButton');
const discussButton = document.querySelector('#discussButton');
const sourceButton = document.querySelector('#sourceButton');

copySelectionButton.addEventListener('click', async () => {
    browser.runtime.sendMessage({
        destination: 'background',
        category: 'copySelectionButtonPressed',
    });
});

copyEntirePageButton.addEventListener('click', async () => {
    browser.runtime.sendMessage({
        destination: 'background',
        category: 'copyEntirePageButtonPressed',
    });
});

copyMultipleTabsButton.addEventListener('click', async () => {
    let havePerm;
    try {
        // The permissions request must be the first async function call in the event
        // handler or it will throw an error.
        havePerm = await browser.permissions.request({ permissions: ['tabs'] });
    } catch (err) {
        console.error('browser.permissions.request:', err);
        browser.runtime.sendMessage({
            destination: 'background',
            category: 'showStatus',
            status: 0,
            notifTitle: 'Error',
            notifBody: err.message,
        });
        return;
    }
    if (!havePerm) {
        console.log('User denied permission request.');
        return;
    }

    console.log('User granted permission request.');
    browser.runtime.sendMessage({
        destination: 'background',
        category: 'copyMultipleTabsButtonPressed',
    });
});

sidebarButton.addEventListener('click', async () => {
    if (browser.sidebarAction) {
        // Firefox only
        await browser.sidebarAction.toggle();
    } else {
        // Chromium only
        browser.runtime.sendMessage({
            destination: 'background',
            category: 'sidebarButtonPressed',
        });
    }
});

settingsButton.addEventListener('click', async () => {
    browser.runtime.sendMessage({
        destination: 'background',
        category: 'settingsButtonPressed',
    });
});

reportBugButton.addEventListener('click', async () => {
    browser.runtime.sendMessage({
        destination: 'background',
        category: 'reportBugButtonPressed',
    });
});

requestFeatureButton.addEventListener('click', async () => {
    browser.runtime.sendMessage({
        destination: 'background',
        category: 'requestFeatureButtonPressed',
    });
});

discussButton.addEventListener('click', async () => {
    browser.runtime.sendMessage({
        destination: 'background',
        category: 'discussButtonPressed',
    });
});

sourceButton.addEventListener('click', async () => {
    browser.runtime.sendMessage({
        destination: 'background',
        category: 'sourceButtonPressed',
    });
});

async function loadCommands() {
    const cmds = await browser.commands.getAll();

    const copyCmd = cmds.find(cmd => cmd.name === 'copySelection');
    const copyEntirePageCmd = cmds.find(cmd => cmd.name === 'copyEntirePage');
    const copyMultipleTabsCmd = cmds.find(cmd => cmd.name === 'copyMultipleTabs');
    const sidebarCmd = cmds.find(
        cmd => cmd.name === '_execute_sidebar_action' || cmd.name === 'openSidePanel'
    );
    const settingsCmd = cmds.find(cmd => cmd.name === 'openSettings');
    const reportBugCmd = cmds.find(cmd => cmd.name === 'reportBug');
    const requestFeatureCmd = cmds.find(cmd => cmd.name === 'requestFeature');
    const discussCmd = cmds.find(cmd => cmd.name === 'discuss');
    const sourceCmd = cmds.find(cmd => cmd.name === 'openSource');

    if (copyCmd) {
        copySelectionButton.title = copyCmd.shortcut || '(no keyboard shortcut set)';
    }
    if (copyEntirePageCmd) {
        copyEntirePageButton.title = copyEntirePageCmd.shortcut || '(no keyboard shortcut set)';
    }
    if (copyMultipleTabsCmd) {
        copyMultipleTabsButton.title = copyMultipleTabsCmd.shortcut || '(no keyboard shortcut set)';
    }
    if (sidebarCmd) {
        sidebarButton.title = sidebarCmd.shortcut || '(no keyboard shortcut set)';
    }
    if (settingsCmd) {
        settingsButton.title = settingsCmd.shortcut || '(no keyboard shortcut set)';
    }
    if (reportBugCmd) {
        reportBugButton.title = reportBugCmd.shortcut || '(no keyboard shortcut set)';
    }
    if (requestFeatureCmd) {
        requestFeatureButton.title = requestFeatureCmd.shortcut || '(no keyboard shortcut set)';
    }
    if (discussCmd) {
        discussButton.title = discussCmd.shortcut || '(no keyboard shortcut set)';
    }
    if (sourceCmd) {
        sourceButton.title = sourceCmd.shortcut || '(no keyboard shortcut set)';
    }
}

loadCommands();
