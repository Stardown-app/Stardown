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

const browser = chrome || browser;

browser.action.onClicked.addListener(async (tab) => {
    const err = await scriptWriteLinkToClipboard(tab, '');
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
        async function (clickedElementId) {
            // clickedElementId may be undefined, an empty string, or a non-empty string
            const err = await scriptWriteLinkToClipboard(tab, clickedElementId);
            if (err === null) {
                await brieflyShowCheckmark();
            } else {
                console.error(err);
                await brieflyShowX();
            }
        }
    );
}

/**
 * scriptWriteLinkToClipboard copies a markdown link to the clipboard. The link may
 * contain an HTML element ID, a text fragment, or both. Browsers that support text
 * fragments will try to use them first, and use the ID as a fallback if necessary.
 * @param {any} tab - The tab to copy the link from.
 * @param {string|undefined} id - The ID of the HTML element to link to. If falsy, no ID
 * is included in the link.
 * @returns {Promise<string|null>} - A Promise that resolves to null if the link was
 * copied successfully, or an error message if not.
 */
async function scriptWriteLinkToClipboard(tab, id) {
    if (!id) {
        id = '';
    }

    let injectionResult;
    try {
        injectionResult = await browser.scripting.executeScript({
            target: { tabId: tab.id },
            args: [id],
            function: (id) => {
                return (async () => {
                    const title = document.title;
                    const url = location.href;
                    const selection = window.getSelection();
                    const selectedText = selection.toString();
                    const arg = createTextFragmentArg(selection);

                    let link = '[';
                    const linkFormat = await getSetting('link_format', 'selected');
                    if (selectedText && linkFormat === 'selected') {
                        link += await replaceBrackets(selectedText.trim());
                    } else if (linkFormat === 'title') {
                        link += await replaceBrackets(title);
                    } else {
                        throw `Link format option "${linkFormat}" not implemented`;
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

                    // `navigator.clipboard.writeText` only works in a script if the
                    // document is focused. For some reason, `document.body.focus()`
                    // doesn't work here. This doesn't seem to be necessary in Firefox.
                    if (!document.hasFocus()) {
                        return 'Cannot copy a markdown link for an unfocused document';
                    }

                    navigator.clipboard.writeText(link);
                    return null;
                })();
            },
        });
    } catch (err) {
        return err;
    }

    // `injectionResult[0].result` is whatever the injected script returned.
    return injectionResult[0].result;
}

async function brieflyShowCheckmark() {
    browser.action.setBadgeText({ text: '✓' });
    browser.action.setBadgeBackgroundColor({ color: 'green' });
    await sleep(1000);  // 1 second
    browser.action.setBadgeText({ text: '' });
}

async function brieflyShowX() {
    browser.action.setBadgeText({ text: '✗' });
    browser.action.setBadgeBackgroundColor({ color: 'red' });
    await sleep(1000);  // 1 second
    browser.action.setBadgeText({ text: '' });
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
