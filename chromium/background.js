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

let lastClick = new Date(0);
let doubleClickInterval = 500;
getSetting('doubleClickInterval', 500).then(value => doubleClickInterval = value);

browser.action.onClicked.addListener(async (tab) => {
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

    const err = await scriptWriteLinkToClipboard(tab, '');
    if (err === null) {
        await brieflyShowCheckmark(1);
    } else {
        console.error(err);
        await brieflyShowX();
    }
    doubleClickInterval = await getSetting('doubleClickInterval', 500);
});

browser.contextMenus.create({
    id: 'copy-markdown-link',
    title: 'Create markdown of selected text',
    contexts: ['all'],
});

browser.contextMenus.create({
    id: 'copy-image-link',
    title: 'Create markdown of image',
    contexts: ['image']
});

browser.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
        case 'copy-markdown-link':
            sendCopyMessage(info, tab);
            break;
        case 'copy-image-link':
            getImage(info.srcUrl);
            break;
        default:
            console.log('Unknown menu item');
    }
});

async function handleDoubleClick() {
    let tabs = await browser.tabs.query({ currentWindow: true, highlighted: true });
    if (tabs.length === 1) {
        const doubleClickWindows = await getSetting('doubleClickWindows', 'current');
        if (doubleClickWindows === 'current') {
            tabs = await browser.tabs.query({ currentWindow: true });
        } else if (doubleClickWindows === 'all') {
            tabs = await browser.tabs.query({});
        }
    }
    const subBrackets = await getSetting('subBrackets', 'underlined');
    const links = await Promise.all(
        tabs.map(tab => createMarkdownLink(tab, subBrackets))
    );
    const bulletPoint = await getSetting('bulletPoint', '-');
    const text = links.map(link => `${bulletPoint} ${link}\n`).join('');
    const activeTab = tabs.find(tab => tab.active);
    const err = await scriptWriteToClipboard(activeTab, text);
    if (err === null) {
        await brieflyShowCheckmark(tabs.length);
    } else {
        console.error(err);
        await brieflyShowX();
    }
}

function getImage(url) {
    console.log('url of image:', url);
    // pass this to content.js to build the markdown syntax
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
            const err = await scriptWriteLinkToClipboard(tab, clickedElementId);
            if (err === null) {
                await brieflyShowCheckmark(1);
            } else {
                console.error(err);
                await brieflyShowX();
            }
        }
    );
}

/**
 * createMarkdownLink creates a markdown link for a tab. The link does not include any
 * HTML element ID nor text fragment. The tab title is used as the link title.
 * @param {any} tab - the tab to create the link from.
 * @param {boolean} subBrackets - the setting for what to substitute any square brackets
 * with.
 * @returns {Promise<string>} - a Promise that resolves to the markdown link.
 */
async function createMarkdownLink(tab, subBrackets) {
    if (tab.title === undefined) {
        console.error('tab.title is undefined');
        throw new Error('tab.title is undefined');
        // Were the necessary permissions granted?
    }

    const title = await replaceBrackets(tab.title, subBrackets);
    const url = tab.url.replaceAll('(', '%28').replaceAll(')', '%29');

    return `[${title}](${url})`;
}

/**
 * scriptWriteToClipboard writes text to the clipboard in a tab. This function expects
 * the tabs permission and will fail silently if the tabs permission has not been
 * granted and the document is not focused.
 * @param {any} tab - the tab to write text to the clipboard in.
 * @param {string} text - the text to write to the clipboard.
 * @returns {Promise<string|null>} - a Promise that resolves to null if the text was
 * written to the clipboard successfully, or an error message if not.
 */
async function scriptWriteToClipboard(tab, text) {
    let injectionResult;
    try {
        injectionResult = await browser.scripting.executeScript({
            target: { tabId: tab.id },
            args: [text],
            function: (text) => {
                return (async () => {
                    // This script assumes the tabs permission has been granted. If it
                    // has not been granted, `navigator.clipboard.writeText` will fail
                    // silently when the document is not focused.
                    // if (!document.hasFocus()) {
                    //     return 'Cannot copy a markdown link for an unfocused document';
                    // }

                    await navigator.clipboard.writeText(text);
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

/**
 * scriptWriteLinkToClipboard copies to the clipboard a markdown link for a tab,
 * optionally including an HTML element ID, and/or a text fragment, and/or a markdown
 * blockquote depending on the settings and whether text is selected. Browsers that
 * support text fragments will try to use them first, and use the ID as a fallback if
 * necessary.
 * @param {any} tab - the tab to copy the link from.
 * @param {string|undefined} id - the ID of the HTML element to link to. If falsy, no ID
 * is included in the link.
 * @returns {Promise<string|null>} - a Promise that resolves to null if the link was
 * copied successfully, or an error message if not.
 */
async function scriptWriteLinkToClipboard(tab, id) {
    if (!id) {
        id = '';
    }

    const subBrackets = await getSetting('subBrackets', 'underlined');

    let injectionResult;
    try {
        injectionResult = await browser.scripting.executeScript({
            target: { tabId: tab.id },
            args: [id, subBrackets],
            function: (id, subBrackets) => {
                return (async () => {
                    let title = document.title;
                    let url = location.href.replaceAll('(', '%28').replaceAll(')', '%29');

                    let selectedText;
                    let arg;  // the text fragment argument
                    const selection = window.getSelection();
                    if (selection) {
                        selectedText = selection.toString().trim();
                        arg = createTextFragmentArg(selection);
                    }

                    if (id || arg) {
                        url += '#';
                        if (id) {
                            url += id;
                        }
                        if (arg) {
                            url += `:~:text=${arg}`;
                        }
                    }

                    let text;
                    if (!selectedText) {
                        title = await replaceBrackets(title, subBrackets);
                        title = await escapeMarkdown(title);
                        text = `[${title}](${url})`;
                    } else {
                        const linkFormat = await getSetting('linkFormat', 'blockquote');
                        switch (linkFormat) {
                            case 'title':
                                title = await replaceBrackets(title, subBrackets);
                                title = await escapeMarkdown(title);
                                text = `[${title}](${url})`;
                                break;
                            case 'selected':
                                selectedText = await replaceBrackets(selectedText, subBrackets);
                                selectedText = await escapeMarkdown(selectedText);
                                text = `[${selectedText}](${url})`;
                                break;
                            case 'blockquote':
                                title = await replaceBrackets(title, subBrackets);
                                title = await escapeMarkdown(title);
                                selectedText = await escapeMarkdown(selectedText.replaceAll('[', '\\['));
                                text = await createBlockquote(selectedText, title, url);
                                break;
                            default:
                                console.error(`Unknown linkFormat: ${linkFormat}`);
                                throw new Error(`Unknown linkFormat: ${linkFormat}`);
                        }
                    }


                    // `navigator.clipboard.writeText` only works in a script if the
                    // document is focused, or if the tabs permission has been granted.
                    // Probably for security reasons, `document.body.focus()` doesn't
                    // work here. Whether the document is focused doesn't seem to be an
                    // issue in Firefox, unless that's just because the Firefox version
                    // of Stardown doesn't have to inject a script to write to the
                    // clipboard.
                    if (!document.hasFocus()) {
                        return 'Cannot copy text for an unfocused document';
                    }

                    await navigator.clipboard.writeText(text);
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
        browser.action.setBadgeText({ text: '✓' });
    } else {
        browser.action.setBadgeText({ text: `${linkCount} ✓` });
    }
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
