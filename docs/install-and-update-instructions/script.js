// Copyright 2024 Chris Wheeler and Jonathan Chua
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

const latestVersionEl = document.querySelector('#latestVersion');

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
if (!chromiumEl.checked && !firefoxEl.checked && !safariEl.checked) {
    chromiumEl.checked = true;
}

chromiumEl.addEventListener('change', buildAndShowInstructionsAndScroll);
firefoxEl.addEventListener('change', buildAndShowInstructionsAndScroll);
safariEl.addEventListener('change', buildAndShowInstructionsAndScroll);
installingEl.addEventListener('change', buildAndShowInstructionsAndScroll);
updatingEl.addEventListener('change', buildAndShowInstructionsAndScroll);
installedWithStoreEl.addEventListener('change', buildAndShowInstructionsAndScroll);
installedWithZipEl.addEventListener('change', buildAndShowInstructionsAndScroll);
installedWithTerminalEl.addEventListener('change', buildAndShowInstructionsAndScroll);
willInstallWithStoreEl.addEventListener('change', buildAndShowInstructionsAndScroll);
willInstallWithZipEl.addEventListener('change', buildAndShowInstructionsAndScroll);
willInstallWithTerminalEl.addEventListener('change', buildAndShowInstructionsAndScroll);
yesNodeV14PlusEl.addEventListener('change', buildAndShowInstructionsAndScroll);
noNodeV14PlusEl.addEventListener('change', buildAndShowInstructionsAndScroll);

class Instructions {
    constructor() {
        this.text = '';
        this.steps = [];
    }
}

async function main() {
    await fetchLatestReleaseTags();

    // if this page's URL ends with `/?updating=true`
    const isUpdating = new URLSearchParams(window.location.search).get('updating') === 'true';
    if (isUpdating) {
        updatingEl.checked = true;
    }

    buildAndShowInstructions();
}

async function fetchLatestReleaseTags() {
    const stableReleaseTagPattern = /^v\d+\.\d+\.\d+$/;
    const prereleaseTagPattern = /^v\d+\.\d+\.\d+-(?:alpha|beta)\.\d{10}$/; // the last 10 digits are YYMMDDhhmm

    let latestStableVersionStr = '';
    let latestPrereleaseVersionStr = '';

    let page = 1;
    while (!latestStableVersionStr) {
        // request a page of Git tags from the GitHub API
        let response;
        try {
            response = await fetch(`https://api.github.com/repos/Stardown-app/Stardown/tags?page=${page}`); // https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28#list-repository-tags
        } catch (err) {
            console.error(`fetch error: ${err.message}`);
            return;
        }
        if (!response.ok) {
            console.error(`The GitHub API responded with error status ${response.status}`);
            return;
        }

        // Find the latest stable release tag, and the latest prerelease tag if there is
        // at least one newer than the latest stable release.
        const tags = await response.json();
        for (const tag of tags) {
            const isStable = stableReleaseTagPattern.test(tag.name);
            const isPrerelease = prereleaseTagPattern.test(tag.name);
            if (isStable) {
                latestStableVersionStr = tag.name;
                break;
            } else if (isPrerelease) {
                if (!latestPrereleaseVersionStr) {
                    latestPrereleaseVersionStr = tag.name;
                }
            } else {
                console.log(`Ignoring non-release tag: ${tag.name}`);
            }
        }

        if (!latestStableVersionStr) {
            if (page === 10) {
                console.error('Failed to find the latest stable release tag after 10 attempts. Stopping.');
                return;
            }

            console.warn('Failed to find the latest stable release tag. Trying again in half a second.');
            page++;
            await sleep(500);
        }
    }

    if (latestPrereleaseVersionStr) {
        latestVersionEl.innerHTML = `Latest stable version: ${latestStableVersionStr}<br>Latest prerelease version: ${latestPrereleaseVersionStr}`;
    } else { // if the latest release is a stable version
        latestVersionEl.innerHTML = `Latest version: ${latestStableVersionStr}<br>There are no newer prerelease versions.`;
    }
}

function buildAndShowInstructionsAndScroll() {
    buildAndShowInstructions();

    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
    });
}

function buildAndShowInstructions() {
    const instructions = new Instructions();

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
            '<a class="chrome" target="_blank">Download the zip file</a>',
            'Unzip the zip file',
            'In your browser, open <code>chrome://extensions/</code>',
            'Turn on developer mode',
            'Click "Load unpacked"',
            'Select the unzipped copy of Stardown',
        );
    } else if (firefoxEl.checked) {
        instructions.steps.push(
            '<a class="firefox" target="_blank">Download the zip file</a>',
            'Unzip the zip file',
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

    if (isWindows) {
        instructions.steps.push(
            '<a href="https://git-scm.com">Install Git</a> if you haven\'t already'
        );
    }
    instructions.steps.push(
        `In a terminal, run <code>git clone https://github.com/Stardown-app/Stardown.git
        && cd Stardown</code>`
    );

    if (noNodeV14PlusEl.checked) {
        instructions.steps.push(`
            Install Node v14+ from <a href="https://nodejs.org">nodejs.org</a> or with a dev tool manager like
            <a href="https://github.com/jdx/mise">
                mise</a>
            (<code>mise use node@lts</code>)
            or
            <a href="https://github.com/nvm-sh/nvm">
                nvm</a>
            (<code>nvm install node</code>)
        `);
        // v14+ because Stardown uses Rollup for bundling, and Rollup uses features only
        // available in Node v14+.
    }

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
            '<a class="chrome" target="_blank">Download a new zip file</a>',
            'Unzip the zip file',
            'In your browser, open <code>chrome://extensions/</code>',
            'Remove Stardown',
            'Click "Load unpacked"',
            'Select the newly unzipped copy of Stardown',
        );
    } else if (firefoxEl.checked) {
        instructions.steps.push(
            '<a class="firefox" target="_blank">Download a new zip file</a>',
            'Unzip the zip file',
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

/**
 * sleep pauses the execution of the current async function for a number of
 * milliseconds.
 * @param {number} ms - the number of milliseconds to sleep.
 * @returns {Promise<void>}
 */
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

main();
