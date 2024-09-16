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

document.querySelector('#copyButton').addEventListener('click', async () => {
    browser.runtime.sendMessage({ category: 'copyButtonPressed' });
});

document.querySelector('#copyMultipleButton').addEventListener('click', async () => {
    let havePerm;
    try {
        // The permissions request must be the first async function call in the event
        // handler or it will throw an error.
        havePerm = await browser.permissions.request({ permissions: ['tabs'] });
    } catch (err) {
        console.error('browser.permissions.request:', err);
        browser.runtime.sendMessage({
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
    browser.runtime.sendMessage({ category: 'copyMultipleButtonPressed' });
});

document.querySelector('#sidebarButton').addEventListener('click', async () => {
    if (browser.sidebarAction) {
        // Firefox only
        await browser.sidebarAction.toggle();
    } else {
        browser.runtime.sendMessage({ category: 'sidebarButtonPressed' });
    }
});

document.querySelector('#settingsButton').addEventListener('click', async () => {
    browser.runtime.sendMessage({ category: 'settingsButtonPressed' });
});

document.querySelector('#githubButton').addEventListener('click', async () => {
    browser.runtime.sendMessage({ category: 'githubButtonPressed' });
});

async function loadCommands() {
    const cmds = await browser.commands.getAll();

    const copyCmd = cmds.find(cmd => cmd.name === 'copy');
    const copyMultipleCmd = cmds.find(cmd => cmd.name === 'copyMultiple');
    const sidebarCmd = cmds.find(
        cmd => cmd.name === '_execute_sidebar_action' || cmd.name === 'openSidePanel'
    );
    const settingsCmd = cmds.find(cmd => cmd.name === 'openSettings');
    const githubCmd = cmds.find(cmd => cmd.name === 'openGithub');

    if (copyCmd) {
        document.querySelector('#copyShortcut').textContent = copyCmd.shortcut || '';
    }
    if (copyMultipleCmd) {
        document.querySelector('#copyMultipleShortcut').textContent = copyMultipleCmd.shortcut || '';
    }
    if (sidebarCmd) {
        document.querySelector('#sidebarShortcut').textContent = sidebarCmd.shortcut || '';
    }
    if (settingsCmd) {
        document.querySelector('#settingsShortcut').textContent = settingsCmd.shortcut || '';
    }
    if (githubCmd) {
        document.querySelector('#githubShortcut').textContent = githubCmd.shortcut || '';
    }
}

loadCommands();
