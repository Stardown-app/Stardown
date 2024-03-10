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

chrome.action.onClicked.addListener(async (tab) => {
    await writeLinkToClipboard(tab, '');
    await brieflyShowCheckmark();
});

chrome.contextMenus.create({
    id: 'copy-markdown-link',
    title: 'Copy markdown link to here',
    contexts: ['all'],
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'copy-markdown-link') {
        chrome.tabs.sendMessage(
            tab.id,
            "getClickedElementId",
            { frameId: info.frameId },
            function (data) {
                if (data) {
                    const id = data.clickedElementId;
                    writeLinkToClipboard(tab, id);
                    brieflyShowCheckmark();
                }
            },
        );
    }
});

/**
 * writeLinkToClipboard copies a markdown link to the clipboard.
 * @param {chrome.tabs.Tab} tab - The tab to copy the link from.
 * @param {string} id - The ID of the element to link to. If empty, no ID is included in
 * the link.
 */
async function writeLinkToClipboard(tab, id) {
    if (id === undefined) {
        id = '';
    }
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: (id) => {
            const title = document.title;
            const url = location.href;

            let link = `[${title}](${url}`;
            if (id) {
                link += `#${id}`;
            }
            link += ')';

            navigator.clipboard.writeText(link);
        },
        args: [id],
    });
}

async function brieflyShowCheckmark() {
    chrome.action.setBadgeText({ text: '✓' });
    chrome.action.setBadgeBackgroundColor({ color: 'green' });
    await sleep(1000);  // 1 second
    chrome.action.setBadgeText({ text: '' });
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
