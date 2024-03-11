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
    const title = tab.title;
    const url = tab.url;
    await navigator.clipboard.writeText(`[${title}](${url})`);

    await brieflyShowCheckmark();
});

browser.contextMenus.create({
    id: 'copy-markdown-link',
    title: 'Copy markdown link to here',
    contexts: ['all'],
});

browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'copy-markdown-link') {
        browser.tabs.sendMessage(
            tab.id,
            "getClickedElementId",
            { frameId: info.frameId },
            function (clickedElementId) {
                if (!clickedElementId) {
                    console.error('No clickedElementId received from sendMessage callback');
                    return;
                }

                const id = clickedElementId;
                const title = tab.title;
                const url = tab.url;

                let link = `[${title}](${url}`;
                if (id) {
                    link += `#${id}`;
                }
                link += ')';

                navigator.clipboard.writeText(link);
                brieflyShowCheckmark();
            },
        );
    }
});

async function brieflyShowCheckmark() {
    browser.browserAction.setBadgeText({ text: '✓' });
    browser.browserAction.setBadgeBackgroundColor({ color: 'green' });
    await sleep(1000);  // 1 second
    browser.browserAction.setBadgeText({ text: '' });
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
