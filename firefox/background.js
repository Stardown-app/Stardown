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

let lastClick = new Date(0);
let doubleClickInterval = 500;
getSetting('doubleClickInterval', 500).then(value => doubleClickInterval = value);

browser.browserAction.onClicked.addListener(async () => {
    const now = new Date();
    if (now - lastClick < doubleClickInterval) {
        // it's a double-click
        let havePerm;
        try {
            // The permissions request must be the first async function call in the
            // event handler or it will throw an error. That's why the value for the
            // doubleClickInterval setting is retrieved later.
            havePerm = await browser.permissions.request({ permissions: ['tabs'] });
        } catch (err) {
            console.error(err);
            brieflyShowX();
            return;
        }
        if (!havePerm) {
            return;
        }

        lastClick = new Date(0);
        await handleDoubleClick();
        return;
    }
    // it's a single-click
    lastClick = now;

    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    const linkFormat = await getSetting('link_format', 'selected');
    const subBrackets = await getSetting('sub_brackets', 'underlined');
    const link = await createMarkdownLink(tab, '', linkFormat, subBrackets, false);
    await navigator.clipboard.writeText(link);
    await brieflyShowCheckmark(1);
    doubleClickInterval = await getSetting('doubleClickInterval', 500);
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

async function handleDoubleClick() {
    let tabs = await browser.tabs.query({ currentWindow: true, highlighted: true });
    if (tabs.length === 1) {
        tabs = await browser.tabs.query({ currentWindow: true });
    }
    const linkFormat = await getSetting('link_format', 'selected');
    const subBrackets = await getSetting('sub_brackets', 'underlined');
    const links = await Promise.all(
        tabs.map(tab => createMarkdownLink(tab, '', linkFormat, subBrackets, false))
    );
    const bulletPoint = await getSetting('bulletPoint', '-');
    const text = links.map(link => `${bulletPoint} ${link}\n`).join('');
    await navigator.clipboard.writeText(text);
    await brieflyShowCheckmark(tabs.length);
}

/**
 * sendCopyMessage sends a message to the content script to get the ID of the
 * right-clicked HTML element and then writes a markdown link to the clipboard.
 * @param {any} info - the context menu info.
 * @param {any} tab - the tab that the context menu was clicked in.
 */
function sendCopyMessage(info, tab) {
    browser.tabs.sendMessage(
        tab.id,
        "getClickedElementId",
        { frameId: info.frameId },
        async function (clickedElementId) {
            // clickedElementId may be undefined, an empty string, or a non-empty string
            const linkFormat = getSetting('link_format', 'selected');
            const subBrackets = await getSetting('sub_brackets', 'underlined');
            const link = await createMarkdownLink(tab, clickedElementId, linkFormat, subBrackets, true);
            await navigator.clipboard.writeText(link);
            brieflyShowCheckmark(1);
        },
    );
}

/**
 * createMarkdownLink creates a markdown link for a tab, optionally including an HTML
 * element ID and/or a text fragment. A text fragment is automatically included if
 * checkSelected is true and text is selected. Browsers that support text fragments will
 * try to use them first, and use the ID as a fallback if necessary. If the link format
 * setting is set to "selected" and selected text is retrieved, the selected text will
 * be used as the link title; otherwise, the tab title will be used as the link title.
 * @param {any} tab - the tab to create the link from.
 * @param {string|undefined} id - the ID of the HTML element to link to. If falsy, no ID
 * is included in the link.
 * @param {string} linkFormat - the format of the link to create; from the settings.
 * @param {boolean} subBrackets - the setting for what to substitute any square brackets
 * with.
 * @param {boolean} checkSelected - whether to check if text is selected.
 * @returns {Promise<string>} - a Promise that resolves to the markdown link.
 */
async function createMarkdownLink(tab, id, linkFormat, subBrackets, checkSelected) {
    if (tab.title === undefined) {
        console.error('tab.title is undefined');
        throw new Error('tab.title is undefined');
        // Were the necessary permissions granted?
    }

    const title = tab.title;
    const url = tab.url;

    let arg;  // the text fragment argument
    let selectedText;
    if (checkSelected) {
        let results;
        try {
            results = await browser.tabs.executeScript(tab.id, {
                file: 'create-text-fragment-arg.js',
            });
        } catch (err) {
            console.log(`(Creating text fragment) ${err}`);
        }
        if (results) {
            arg = results[0].slice(0, -1)[0];
            selectedText = results[0].slice(-1)[0];
        }
    }

    let link = '[';
    if (selectedText && linkFormat === 'selected') {
        link += await replaceBrackets(selectedText.trim(), subBrackets);
    } else {
        link += await replaceBrackets(title, subBrackets);
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

    return link;
}

/**
 * replaceBrackets replaces square brackets in a link title with the character or escape
 * sequence chosen in settings.
 * @param {string} title - the raw link title.
 * @param {string} subBrackets - the setting for what to substitute any square brackets
 * with.
 * @returns {Promise<string>}
 */
async function replaceBrackets(title, subBrackets) {
    if (subBrackets === 'underlined') {
        return title.replaceAll('[', '⦋').replaceAll(']', '⦌');
    } else if (subBrackets === 'escaped') {
        return title.replaceAll('[', '\\[').replaceAll(']', '\\]');
    }
    return title;
}

async function brieflyShowCheckmark(linkCount) {
    if (linkCount === 0) {
        await brieflyShowX();
        return;
    } else if (linkCount === 1) {
        browser.browserAction.setBadgeText({ text: '✓' });
    } else {
        browser.browserAction.setBadgeText({ text: `${linkCount} ✓` });
    }
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
        if (v === undefined) {
            return default_;
        }
        return v;
    } catch (err) {
        console.error(err);
        return default_;
    }
}
