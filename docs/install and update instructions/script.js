// Copyright 2024 Chris Wheeler
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const instructionsEl = document.querySelector('#instructions');

// fieldsets that start hidden
const installedWithEl = document.querySelector('#installedWith');
const willInstallWithEl = document.querySelector('#willInstallWith');
const hasNodeV14PlusEl = document.querySelector('#hasNodeV14Plus');

// radio inputs
const chromiumEl = document.querySelector('#chromium');
const firefoxEl = document.querySelector('#firefox');
const safariEl = document.querySelector('#safari');
const installingEl = document.querySelector('#installing');
const updatingEl = document.querySelector('#updating');
const installedWithStoreEl = document.querySelector('#installedWithStore');
const installedWithZipEl = document.querySelector('#installedWithZip');
const installedWithTerminalEl = document.querySelector('#installedWithTerminal');
const willInstallWithStoreEl = document.querySelector('#willInstallWithStore');
const willInstallWithZipEl = document.querySelector('#willInstallWithZip');
const willInstallWithTerminalEl = document.querySelector('#willInstallWithTerminal');
const yesNodeV14PlusEl = document.querySelector('#yesNodeV14Plus');
const noNodeV14PlusEl = document.querySelector('#noNodeV14Plus');

instructionsEl.setAttribute('hidden', 'hidden');
installedWithEl.setAttribute('hidden', 'hidden');
willInstallWithEl.setAttribute('hidden', 'hidden');
hasNodeV14PlusEl.setAttribute('hidden', 'hidden');

const isWindows = navigator.userAgent.includes('Windows');

// [How to determine the current browser](https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browsers#answer-9851769)
// There is no completely reliable way, so users should be able to select their browser.
chromiumEl.checked = Boolean(window.chrome);
firefoxEl.checked = typeof InstallTrigger !== 'undefined' && !chromiumEl.checked;
safariEl.checked = (
    navigator.vendor &&
    /Apple Computer, Inc\./i.test(navigator.vendor) &&
    !chromiumEl.checked &&
    !firefoxEl.checked
);

chromiumEl.addEventListener('change', main);
firefoxEl.addEventListener('change', main);
safariEl.addEventListener('change', main);
installingEl.addEventListener('change', main);
updatingEl.addEventListener('change', main);
installedWithStoreEl.addEventListener('change', main);
installedWithZipEl.addEventListener('change', main);
installedWithTerminalEl.addEventListener('change', main);
willInstallWithStoreEl.addEventListener('change', main);
willInstallWithZipEl.addEventListener('change', main);
willInstallWithTerminalEl.addEventListener('change', main);
yesNodeV14PlusEl.addEventListener('change', main);
noNodeV14PlusEl.addEventListener('change', main);

class Instructions {
    constructor() {
        this.text = '';
        this.steps = [];
    }
}

function main() {
    const instructions = new Instructions();

    if (chromiumEl.checked || firefoxEl.checked || safariEl.checked) {
        if (safariEl.checked) {
            instructions.text = 'Safari support coming soon!';
            willInstallWithEl.setAttribute('hidden', 'hidden');
            installedWithEl.setAttribute('hidden', 'hidden');
            hasNodeV14PlusEl.setAttribute('hidden', 'hidden');
        } else if (installingEl.checked) {
            install(instructions);
        } else if (updatingEl.checked) {
            update(instructions);
        } else {
            throw new Error('Neither installing nor updating');
        }
    }

    if (instructions.text || instructions.steps.length > 0) {
        showInstructions(instructions);
    } else {
        instructionsEl.setAttribute('hidden', 'hidden');
    }
}

function install(instructions) {
    willInstallWithEl.removeAttribute('hidden');
    installedWithEl.setAttribute('hidden', 'hidden');

    if (willInstallWithStoreEl.checked) {
        installedWithStoreEl.checked = true;
        hasNodeV14PlusEl.setAttribute('hidden', 'hidden');
        installWithStore(instructions);
    } else if (willInstallWithZipEl.checked) {
        installedWithZipEl.checked = true;
        hasNodeV14PlusEl.setAttribute('hidden', 'hidden');
        installWithZip(instructions);
    } else if (willInstallWithTerminalEl.checked) {
        installedWithTerminalEl.checked = true;
        hasNodeV14PlusEl.removeAttribute('hidden');
        installWithTerminal(instructions);
    } else {
        return;
    }
}

function update(instructions) {
    installedWithEl.removeAttribute('hidden');
    willInstallWithEl.setAttribute('hidden', 'hidden');
    hasNodeV14PlusEl.setAttribute('hidden', 'hidden');

    if (installedWithStoreEl.checked) {
        willInstallWithStoreEl.checked = true;
        updateWithStore(instructions);
    } else if (installedWithZipEl.checked) {
        willInstallWithZipEl.checked = true;
        updateWithZip(instructions);
    } else if (installedWithTerminalEl.checked) {
        willInstallWithTerminalEl.checked = true;
        updateWithTerminal(instructions);
    } else {
        return;
    }
}

function installWithStore(instructions) {
    if (chromiumEl.checked) {
        instructions.text = `
            <a href="https://chrome.google.com/webstore/detail/clicknohlhfdlfjfkaeongkbdgbmkbhb" target="_blank">
                Install Stardown from the Chrome Web Store</a>
        `;
    } else if (firefoxEl.checked) {
        instructions.text = `
            <a href="https://addons.mozilla.org/en-US/firefox/addon/stardown/" target="_blank">
                Install Stardown from Add-ons for Firefox</a>
        `;
    } else {
        throw new Error(`Unknown browser`);
    }
}

function installWithZip(instructions) {
    if (chromiumEl.checked) {
        instructions.steps.push(
            `<a href="https://github.com/Stardown-app/Stardown/releases/latest" target="_blank">
                Download the chrome.zip file</a>`,
            'Unzip the .zip file',
            'In your browser, open <code>chrome://extensions/</code>',
            'Turn on developer mode',
            'Click "Load unpacked"',
            'Select the unzipped copy of Stardown',
        );
    } else if (firefoxEl.checked) {
        instructions.steps.push(
            `<a href="https://github.com/Stardown-app/Stardown/releases/latest" target="_blank">
                Download the firefox.zip file</a>`,
            'Unzip the .zip file',
            'In your browser, open <code>about:debugging#/runtime/this-firefox</code>',
            'Click "Load Temporary Add-on..."',
            'Select the manifest.json in the unzipped copy of Stardown',
        );
    } else {
        throw new Error(`Unknown browser`);
    }
}

function installWithTerminal(instructions) {
    if (!yesNodeV14PlusEl.checked && !noNodeV14PlusEl.checked) {
        return;
    }

    if (noNodeV14PlusEl.checked) {
        instructions.steps.push(`
            Install Node v14+ from <a href="https://nodejs.org">nodejs.org</a> or with
            <a href="https://github.com/nvm-sh/nvm">nvm</a>
            (e.g. <code>nvm install 22</code>)
        `);
        // v14+ because Stardown uses Rollup for bundling, and Rollup uses features only
        // available in Node v14+.
    }
    if (isWindows) {
        instructions.steps.push(
            '<a href="https://git-scm.com">Install Git</a> if you haven\'t already'
        );
    }
    instructions.steps.push(
        `In a terminal, run <code>git clone https://github.com/Stardown-app/Stardown.git
        && cd Stardown</code>`
    );

    if (chromiumEl.checked) {
        instructions.steps.push(
            'Then run <code>npm install && npm run build-chrome</code>',
            'In your browser, open <code>chrome://extensions/</code>',
            'Turn on developer mode',
            'Click "Load unpacked"',
            'Select Stardown\'s <code>chrome</code> folder',
        );
    } else if (firefoxEl.checked) {
        instructions.steps.push(
            'Then run <code>npm install && npm run build-firefox</code>',
            'In your browser, open <code>about:debugging#/runtime/this-firefox</code>',
            'Click "Load Temporary Add-on..."',
            'Select Stardown\'s <code>firefox/manifest.json</code> file',
        );
    } else {
        throw new Error(`Unknown browser`);
    }
}

function updateWithStore(instructions) {
    if (chromiumEl.checked) {
        instructions.text = `
            You're up to date! Extensions installed from the store update
            automatically.
        `;
    } else if (firefoxEl.checked) {
        instructions.text = `
            Extensions installed from the store normally update automatically. If
            you might have automatic updates turned off, see
            <a href="https://support.mozilla.org/en-US/kb/how-update-add-ons#w_updating-add-ons">
                How to update add-ons</a>.
        `;
    } else {
        throw new Error(`Unknown browser`);
    }
}

function updateWithZip(instructions) {
    if (chromiumEl.checked) {
        instructions.steps.push(
            `<a href="https://github.com/Stardown-app/Stardown/releases/latest" target="_blank">
                Download a new chrome.zip file</a>`,
            'Unzip the .zip file',
            'In your browser, open <code>chrome://extensions/</code>',
            'Remove Stardown',
            'Click "Load unpacked"',
            'Select the newly unzipped copy of Stardown',
        );
    } else if (firefoxEl.checked) {
        instructions.steps.push(
            `<a href="https://github.com/Stardown-app/Stardown/releases/latest" target="_blank">
                Download a new firefox.zip file</a>`,
            'Unzip the .zip file',
            'In your browser, open <code>about:debugging#/runtime/this-firefox</code>',
            'Remove Stardown',
            'Click "Load Temporary Add-on..."',
            'Select the manifest.json in the newly unzipped copy of Stardown',
        );
    } else {
        throw new Error(`Unknown browser`);
    }
}

function updateWithTerminal(instructions) {
    if (chromiumEl.checked) {
        instructions.steps.push(
            'In a terminal, navigate into Stardown\'s folder',
            'Run <code>git pull && npm install && npm run build-chrome</code>',
            'In your browser, open <code>chrome://extensions/</code>',
            'Click Stardown\'s reload button',
        );
    } else if (firefoxEl.checked) {
        instructions.steps.push(
            'In a terminal, navigate into Stardown\'s folder',
            'Run <code>git pull && npm install && npm run build-firefox</code>',
            'In your browser, open <code>about:debugging#/runtime/this-firefox</code>',
            'Click Stardown\'s reload button',
        );
    } else {
        throw new Error(`Unknown browser`);
    }
}

function showInstructions(instructions) {
    instructionsEl.removeAttribute('hidden');

    let html = [];
    if (instructions.text) {
        html.push('<p>' + instructions.text + '</p>');
    }
    if (instructions.steps.length > 0) {
        html.push('<ol><li>' + instructions.steps.join('</li><li>') + '</li></ol>');
    }

    instructionsEl.innerHTML = html.join('') + `
        <br />
        <a href="https://github.com/Stardown-app/Stardown">Return to GitHub</a>
    `;
}

main();
