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
    await writeLinkToClipboard(tab, '');
    await brieflyShowCheckmark();
});

browser.contextMenus.create({
    id: 'copy-markdown-link',
    title: 'Copy markdown link to here',
    contexts: ['all'],
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
            // clickedElementId may be an empty string
            writeLinkToClipboard(tab, clickedElementId);
            brieflyShowCheckmark();
        },
    );
}

/**
 * writeLinkToClipboard copies a markdown link to the clipboard. The link may contain an
 * HTML element ID.
 * @param {any} tab - The tab to copy the link from.
 * @param {string|undefined} id - The ID of the HTML element to link to. If falsy, no ID
 * is included in the link.
 */
async function writeLinkToClipboard(tab, id) {
    if (!id) {
        id = '';
    }

    const title = tab.title;
    const url = tab.url;

    let link = `[${title}](${url}`;
    if (id) {
        link += `#${id}`;
    }
    link += ')';

    await navigator.clipboard.writeText(link);
}

async function brieflyShowCheckmark() {
    browser.browserAction.setBadgeText({ text: '✓' });
    browser.browserAction.setBadgeBackgroundColor({ color: 'green' });
    await sleep(1000);  // 1 second
    browser.browserAction.setBadgeText({ text: '' });
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
