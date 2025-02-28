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

import { browser, sleep, getShortcutInstructions } from './browserSpecific.js';
import { getSetting } from './getSetting.js';

/**
 * VERSION is Stardown's version. The value must match one of the regex patterns below.
 * This variable exists because the "version" properties in the manifests only support
 * stable release versions.
 */
const VERSION = 'v2.0.0-alpha.2411120735';
const stableReleaseTagPattern = /^v\d+\.\d+\.\d+$/;
const prereleaseTagPattern = /^v\d+\.\d+\.\d+-(?:alpha|beta)\.\d{10}$/; // the last 10 digits are YYMMDDhhmm

const manifest = browser.runtime.getManifest();
document.querySelector('#versionNumber').innerHTML = VERSION;

document.querySelector('#shortcutInstructions').innerHTML = getShortcutInstructions();

const checkForUpdatesButton = document.querySelector('#checkForUpdates');
const updateCheckResultEl = document.querySelector('#updateCheckResult');
// Unfortunately, the browser APIs don't provide any way to tell whether the browser will
// automatically install available updates. As a result, the update check button must be
// visible even if updates are automatic. For now at least, I don't think it would be
// worth it to create new build commands that remove the button just for the extension
// stores, especially since some browsers let users choose whether each extension
// installed from their extension store updates automatically.
checkForUpdatesButton.addEventListener('click', async () => {
    // check for updates
    updateCheckResultEl.innerText = 'Checking for updates...';
    checkForUpdatesButton.disabled = true;

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
            updateCheckResultEl.innerText = `Error: ${err.message}`;
            checkForUpdatesButton.disabled = false;
            return;
        }
        if (!response.ok) {
            console.error(`The GitHub API responded with error status ${response.status}`);
            updateCheckResultEl.innerText = `The GitHub API responded with error status ${response.status}`;
            checkForUpdatesButton.disabled = false;
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
                updateCheckResultEl.innerText = 'Failed to check for updates after 10 attempts';
                return;
            }

            console.warn('Failed to find the latest stable release tag. Trying again in half a second.');
            updateCheckResultEl.innerText += '.';
            page++;
            await sleep(500);
        }
    }

    console.log(`Current version: ${VERSION}`);
    console.log(`Current version in manifest: v${manifest.version}`);
    console.log(`Latest stable version: ${latestStableVersionStr}`);
    if (latestPrereleaseVersionStr) {
        console.log(`Latest prerelease version: ${latestPrereleaseVersionStr}`);
    } else {
        console.log('There are no prerelease versions newer than the latest stable version');
    }

    const updateInstructionsHtml = `
        <a href="https://stardown-app.github.io/Stardown/docs/install-and-update-instructions">
            Click here for update instructions.</a>
    `;

    if (latestPrereleaseVersionStr) {
        if (VERSION === latestPrereleaseVersionStr) {
            updateCheckResultEl.innerText = 'You have the latest version of Stardown.';
        } else if (VERSION === latestStableVersionStr) {
            updateCheckResultEl.innerText = `
                You have the latest stable version of Stardown. A newer pre-release version is available. ${updateInstructionsHtml}
            `;
        } else {
            updateCheckResultEl.innerText = `An update is available! ${updateInstructionsHtml}`;
        }
    } else { // if the latest release is a stable version
        if (VERSION === latestStableVersionStr) {
            updateCheckResultEl.innerText = 'You have the latest version of Stardown.';
        } else {
            updateCheckResultEl.innerText = `An update is available! ${updateInstructionsHtml}`;
        }
    }
});

const form = document.querySelector('form');

const markupLanguageEl = document.querySelector('#markupLanguage');
const selectionFormatEl = document.querySelector('#selectionFormat');
const copyTabsWindowsEl = document.querySelector('#copyTabsWindows');
const createTextFragmentEl = document.querySelector('#createTextFragment');
const notepadAppendOrInsertEl = document.querySelector('#notepadAppendOrInsert');
const notepadStorageLocationEl = document.querySelector('#notepadStorageLocation');
const extractMainContentEl = document.querySelector('#extractMainContent');
const omitNavEl = document.querySelector('#omitNav');
const omitFooterEl = document.querySelector('#omitFooter');
const omitHiddenEl = document.querySelector('#omitHidden');
const notifyOnWarningEl = document.querySelector('#notifyOnWarning');
const notifyOnSuccessEl = document.querySelector('#notifyOnSuccess');

const mdYoutubeEl = document.querySelector('#mdYoutube');
const templateEl = document.querySelector('#template');
const templateErrorEl = document.querySelector('#templateError');
const mdSubBracketsEl = document.querySelector('#mdSubBrackets');
const mdBulletPointEl = document.querySelector('#mdBulletPoint');

const jsonEmptyCellEl = document.querySelector('#jsonEmptyCell');
const jsonDestinationEl = document.querySelector('#jsonDestination');

const resetButton = document.querySelector('#reset');

// set up setting autosaving
initAutosave('markupLanguage', markupLanguageEl, 'value');
initAutosave('selectionFormat', selectionFormatEl, 'value');
initAutosave('copyTabsWindows', copyTabsWindowsEl, 'value');
initAutosave('createTextFragment', createTextFragmentEl, 'checked');
initAutosave('notepadAppendOrInsert', notepadAppendOrInsertEl, 'value');
initAutosave('notepadStorageLocation', notepadStorageLocationEl, 'value', () => {
    browser.runtime.sendMessage({
        destination: 'sidebar',
        category: 'notepadStorageLocation',
        notepadStorageLocation: notepadStorageLocationEl.value,
    });
});
initAutosave('extractMainContent', extractMainContentEl, 'checked');
initAutosave('omitNav', omitNavEl, 'checked');
initAutosave('omitFooter', omitFooterEl, 'checked');
initAutosave('omitHidden', omitHiddenEl, 'checked');
initAutosave('notifyOnWarning', notifyOnWarningEl, 'checked');
initAutosave('notifyOnSuccess', notifyOnSuccessEl, 'checked');

initAutosave('mdYoutube', mdYoutubeEl, 'value');
initAutosave('mdSelectionWithSourceTemplate', templateEl, 'value');
initAutosave('mdSubBrackets', mdSubBracketsEl, 'value');
initAutosave('mdBulletPoint', mdBulletPointEl, 'value');

initAutosave('jsonEmptyCell', jsonEmptyCellEl, 'value');
initAutosave('jsonDestination', jsonDestinationEl, 'value', () => {
    browser.runtime.sendMessage({
        destination: 'background',
        category: 'jsonDestination',
        jsonDestination: jsonDestinationEl.value,
    });
});

/**
 * initAutosave initializes autosaving for a setting.
 * @param {string} settingName - the name of the setting.
 * @param {HTMLElement} el - the HTML element of the setting's input field.
 * @param {string} valueProperty - the HTML element's property that holds the setting's
 * value.
 * @param {function|undefined} then - an optional function to run after applying the
 * setting completes.
 */
function initAutosave(settingName, el, valueProperty, then) {
    el.addEventListener('input', async (event) => {
        const obj = {};
        obj[settingName] = el[valueProperty];
        await browser.storage.sync.set(obj).then(then);
    });
}

/**
 * loadSettings loads the settings from browser storage into the settings page.
 */
async function loadSettings() {
    try {
        markupLanguageEl.value = await getSetting('markupLanguage');
        selectionFormatEl.value = await getSetting('selectionFormat');
        copyTabsWindowsEl.value = await getSetting('copyTabsWindows');
        createTextFragmentEl.checked = await getSetting('createTextFragment');
        notepadAppendOrInsertEl.value = await getSetting('notepadAppendOrInsert');
        notepadStorageLocationEl.value = await getSetting('notepadStorageLocation');
        extractMainContentEl.checked = await getSetting('extractMainContent');
        omitNavEl.checked = await getSetting('omitNav');
        omitFooterEl.checked = await getSetting('omitFooter');
        omitHiddenEl.checked = await getSetting('omitHidden');
        notifyOnWarningEl.checked = await getSetting('notifyOnWarning');
        notifyOnSuccessEl.checked = await getSetting('notifyOnSuccess');

        mdYoutubeEl.value = await getSetting('mdYoutube');
        templateEl.value = await getSetting('mdSelectionWithSourceTemplate');
        mdSubBracketsEl.value = await getSetting('mdSubBrackets');
        mdBulletPointEl.value = await getSetting('mdBulletPoint');

        jsonEmptyCellEl.value = await getSetting('jsonEmptyCell') || 'null';
        jsonDestinationEl.value = await getSetting('jsonDestination');
    } catch (err) {
        console.error(err);
        throw err;
    }
}

/**
 * resetSettings deletes all settings from browser storage and indicates success. It
 * assumes it's being used as a form event listener for the 'reset' event so that it
 * doesn't have to reset the settings page.
 */
async function resetSettings() {
    await browser.storage.sync.clear();

    resetButton.value = 'Reset all ✔';
    resetButton.style.backgroundColor = '#aadafa';
    setTimeout(() => {
        resetButton.value = 'Reset all';
        resetButton.style.backgroundColor = '';
    }, 750);
}

/**
 * validateTemplateVariables validates the selection template's variables. If any are
 * invalid, an error message is displayed.
 * @returns {Promise<void>}
 */
async function validateTemplateVariables() {
    const title = 'page title';
    const sourceUrl = 'https://example.com';
    const YYYYMMDD = '2024-01-01';
    const text = 'converted text';
    const templateVars = {
        page: { title: title },
        source: { url: sourceUrl },
        date: { YYYYMMDD: YYYYMMDD },
        text: text.trim(),
    };

    const matches = templateEl.value.matchAll(/{{([^{}]+)}}/g);
    if (!matches) {
        return;
    }

    for (const match of matches) {
        const [full, group] = match;
        const tokens = group.split('.');

        let value = templateVars;
        for (const token of tokens) {
            if (token.includes(' ')) {
                value = undefined;
                break;
            }
            value = value[token];
            if (value === undefined) {
                break;
            }
        }

        if (value === undefined) {
            templateErrorEl.textContent = `Unknown variable "${group}"`;
            templateErrorEl.style.display = 'inline-block';
            return;
        }
    }

    templateErrorEl.textContent = '';
    templateErrorEl.style.display = 'none';
}

templateEl.addEventListener('input', async function () {
    await validateTemplateVariables();
});

document.addEventListener('DOMContentLoaded', loadSettings);
form.addEventListener('reset', resetSettings);
