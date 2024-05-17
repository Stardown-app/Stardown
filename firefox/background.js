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
    const linkFormat = await getSetting('linkFormat', 'blockquote');
    const subBrackets = await getSetting('subBrackets', 'underlined');
    const link = await createMarkdownLink(tab, '', linkFormat, subBrackets, false);
    await navigator.clipboard.writeText(link);
    await brieflyShowCheckmark(1);
    doubleClickInterval = await getSetting('doubleClickInterval', 500);
});

browser.contextMenus.create({
    id: 'copy-markdown-link',
    title: 'Create markdown of selected text',
    contexts: ['page', 'editable', 'selection', 'video', 'audio'],
});

browser.contextMenus.create({
    id: 'image',
    title: 'Create markdown of image',
    contexts: ['image'],
});

browser.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
        case 'copy-markdown-link':
            sendCopyMessage(info, tab, 'all');
            break;
        case 'image':
            buildImageMarkdown(info, tab);
            break;
        default:
            console.error(`Unknown context menu item: ${info.menuItemId}`);
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
    const linkFormat = await getSetting('linkFormat', 'blockquote');
    const subBrackets = await getSetting('subBrackets', 'underlined');
    const links = await Promise.all(
        tabs.map(tab => createMarkdownLink(tab, '', linkFormat, subBrackets, false))
    );
    const bulletPoint = await getSetting('bulletPoint', '-');
    const text = links.map(link => `${bulletPoint} ${link}\n`).join('');
    await navigator.clipboard.writeText(text);
    await brieflyShowCheckmark(tabs.length);
}

function buildImageMarkdown(info, tab) {
    const url = info.srcUrl;
    const { filename, filetype } = (() => {
        const endingPath = url.split('/').pop(); // converts string into a list object & removes the last element
        const lastDot = endingPath.lastIndexOf('.');
        console.log('endingPath: ', endingPath);
        console.log('lastDot index: ', lastDot);
        if (lastDot > 0) {
            const filename = endingPath.substring(0, lastDot); // substring of all characters before the '.'
            const extension = endingPath.substring(lastDot); // substring of all characters after the '.'
            return { filename, extension };
        } else {
            return {
                filename: endingPath,
                extension: '',
            };
        }
    })();

    const markdown = `![${filename}](${url})`;
    const message = { category: 'image', markdown: markdown, filename: filename };
    browser.tabs.sendMessage(tab.id, message, null, notifier);
}

function notifier(id) {
    browser.notifications.create(id, {
        type: 'basic',
        iconUrl: 'images/icon-128.png',
        title: 'Markdown created',
        message: `Your markdown of ${id} can now be pasted`
    }, function (notificationId) {
        console.log('Notification created with ID:', notificationId);
    });
}

/**
 * sendCopyMessage sends a message to the content script to get the ID of the
 * right-clicked HTML element and then writes a markdown link to the clipboard.
 * @param {any} info - the context menu info.
 * @param {any} tab - the tab that the context menu was clicked in.
 * @param {string} category - the category of the content to copy.
 */
function sendCopyMessage(info, tab, category) {
    browser.tabs.sendMessage(
        tab.id,
        { category: category },  // this will be the first input to the onMessage listener
        { frameId: info.frameId },
        async function (clickedElementId) {
            // clickedElementId may be undefined, an empty string, or a non-empty string
            const linkFormat = await getSetting('linkFormat', 'blockquote');
            const subBrackets = await getSetting('subBrackets', 'underlined');
            const text = await createMarkdownLink(tab, clickedElementId, linkFormat, subBrackets, true);
            await navigator.clipboard.writeText(text);
            brieflyShowCheckmark(1);
        },
    );
}

/**
 * createMarkdownLink creates a markdown link for a tab, optionally including an HTML
 * element ID, and/or a text fragment, and/or a markdown blockquote depending on the
 * settings, whether checkSelected is true, and whether text is selected. Browsers that
 * support text fragments will try to use them first, and use the ID as a fallback if
 * necessary.
 * @param {any} tab - the tab to create the link from.
 * @param {string|undefined} id - the ID of the HTML element to link to. If falsy, no ID
 * is included in the link.
 * @param {string} linkFormat - the format of the link to create; from the settings.
 * @param {boolean} subBrackets - the setting for what to substitute any square brackets
 * with.
 * @param {boolean} checkSelected - whether to check if text is selected.
 * @returns {Promise<string>} - the markdown text.
 */
async function createMarkdownLink(tab, id, linkFormat, subBrackets, checkSelected) {
    if (tab.title === undefined) {
        console.error('tab.title is undefined');
        throw new Error('tab.title is undefined');
        // Were the necessary permissions granted?
    }

    let title = tab.title;
    let url = tab.url.replaceAll('(', '%28').replaceAll(')', '%29');

    // Remove any preexisting HTML element ID and/or text fragment from the URL. If the
    // URL has an HTML element ID, any text fragment will also be in the `hash`
    // attribute of its URL object. However, if the URL has a text fragment but no HTML
    // element ID, the text fragment may be in the `pathname` attribute of its URL
    // object along with part of the URL that should not be removed.
    const urlObj = new URL(url);
    urlObj.hash = '';  // remove HTML element ID and maybe text fragment
    if (urlObj.pathname.includes(':~:text=')) {
        urlObj.pathname = urlObj.pathname.split(':~:text=')[0];
    }
    url = urlObj.toString();

    let selectedText;
    let arg;  // the text fragment argument
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
            selectedText = results[0].slice(-1)[0].trim();
        }
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

    return text;
}

/**
 * createBlockquote creates a markdown blockquote with a link at the end. Any character
 * escaping or replacements should have already been done before calling this function.
 * @param {string} text - the text of the blockquote.
 * @param {string} title - the title of the link.
 * @param {string} url - the URL of the link.
 * @returns {Promise<string>}
 */
async function createBlockquote(text, title, url) {
    text = text.replaceAll('\n', '\n> ');
    return `> ${text}\n> \n> — [${title}](${url})\n`;
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

/**
 * escapeMarkdown escapes some (not all!) markdown characters in a string. This function
 * is useful for markdown link titles and blockquotes. It does not escape square
 * brackets, among other characters.
 * @param {string} text - the text to escape markdown characters in.
 * @returns {Promise<string>}
 */
async function escapeMarkdown(text) {
    return text
        .replaceAll('>', '\\>')
        .replaceAll('<', '\\<')
        .replaceAll('#', '\\#')
        .replaceAll('_', '\\_')
        .replaceAll('*', '\\*')
        .replaceAll('-', '\\-')
        .replaceAll('+', '\\+')
        .replaceAll('=', '\\=')
        .replaceAll('`', '\\`')
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
