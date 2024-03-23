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

browser.browserAction.onClicked.addListener(async () => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

    const err = await writeLinkToClipboard(tab, '');
    if (err === null) {
        await brieflyShowCheckmark();
    } else {
        console.error(err);
        await brieflyShowX();
    }
});

browser.contextMenus.create({
    id: 'copy-markdown-link',
    title: 'Copy markdown link to here',
    contexts: ['all', 'tab'],
});

browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'copy-markdown-link') {
        sendCopyMessage(info, tab);
    }
});

/**
 * sendCopyMessage sends a message to the content script to get the ID of the
 * right-clicked HTML element and then writes a markdown link to the clipboard.
 * @param {any} info - The context menu info.
 * @param {any} tab - The tab that the context menu was clicked in.
 */
function sendCopyMessage(info, tab) {
    browser.tabs.sendMessage(
        tab.id,
        "getClickedElementId",
        { frameId: info.frameId },
        function (clickedElementId) {
            // clickedElementId may be undefined, an empty string, or a non-empty string
            writeLinkToClipboard(tab, clickedElementId);
            brieflyShowCheckmark();
        },
    );
}

/**
 * writeLinkToClipboard copies a markdown link to the clipboard. The link may contain an
 * HTML element ID, a text fragment, or both. Browsers that support text fragments will
 * try to use them first, and use the ID as a fallback if necessary.
 * @param {any} tab - The tab to copy the link from.
 * @param {string|undefined} id - The ID of the HTML element to link to. If falsy, no ID
 * is included in the link.
 * @returns {Promise<string|null>} - A Promise that resolves to null if the link was
 * copied successfully, or an error message if not.
 */
async function writeLinkToClipboard(tab, id) {
    const title = tab.title;
    const url = tab.url;

    let arg;  // the text fragment argument
    let selectedText;
    try {
        const results = await browser.tabs.executeScript(tab.id, {
            file: 'create-text-fragment-arg.js',
        });
        arg = results[0].slice(0, -1)[0];
        selectedText = results[0].slice(-1)[0];
    } catch (err) {
        console.log(`(Creating text fragment) ${err}`);
    }

    let link = '[';
    const useSelected = await getSetting('use_selected', true);
    if (selectedText && useSelected) {
        link += await replaceBrackets(selectedText.trim());
    } else {
        link += await replaceBrackets(title);
    }
    link += `](${url}`;
    if (id || arg) {
        link += '#';
        if (id) {
            link += id;
        }
        if (arg) {
            link += `:~:text=${arg}`;
        }
    }
    link += ')';

    await navigator.clipboard.writeText(link);
    return null;
}

/**
 * replaceBrackets replaces square brackets in a link title with the character or escape
 * sequence chosen in settings.
 * @param {string} title - the raw link title.
 * @returns {Promise<string>}
 */
async function replaceBrackets(title) {
    let sub_brackets = await getSetting('sub_brackets', 'underlined');
    if (sub_brackets === 'underlined') {
        return title.replaceAll('[', '⦋').replaceAll(']', '⦌');
    } else if (sub_brackets === 'escaped') {
        return title.replaceAll('[', '\\[').replaceAll(']', '\\]');
    }
    return title;
}

async function brieflyShowCheckmark() {
    browser.browserAction.setBadgeText({ text: '✓' });
    browser.browserAction.setBadgeBackgroundColor({ color: 'green' });
    await sleep(1000);  // 1 second
    browser.browserAction.setBadgeText({ text: '' });
}

async function brieflyShowX() {
    browser.browserAction.setBadgeText({ text: '✗' });
    browser.browserAction.setBadgeBackgroundColor({ color: 'red' });
    await sleep(1000);  // 1 second
    browser.browserAction.setBadgeText({ text: '' });
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * getSetting gets a setting from the browser's sync storage.
 * @param {string} name - the name of the setting.
 * @param {any} default_ - the default value of the setting.
 * @returns {any}
 */
async function getSetting(name, default_) {
    try {
        const v = (await browser.storage.sync.get(name))[name];
        if (v !== undefined) {
            return v;
        }
        return default_;
    } catch (err) {
        console.error(err);
        return default_;
    }
}
