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

import { getSetting } from './common.js';
import * as md from './md.js';

/**
 * createMd creates markdown of the selected part of the page. The markdown format is
 * determined by the user's settings. If no text is selected, a link to the page is
 * created.
 * @param {string} title - the title of the page.
 * @param {string} url - the URL of the page.
 * @param {string} selectedText - the selected text.
 * @returns {Promise<string>}
 */
export async function createMd(title, url, selectedText) {
    if (!selectedText) {
        return await md.createLink(title, url);
    }

    const selectionFormat = await getSetting('selectionFormat');
    switch (selectionFormat) {
        case 'source with link':
            return await getSourceFormatMdWithLink(title, url, selectedText);
        case 'source':
            return await getSourceFormatMd(selectedText);
        case 'blockquote with link':
            return await md.createBlockquote(selectedText, title, url) + '\n';
        case 'link with selection as title':
            selectedText = selectedText.replaceAll('\r\n', ' ').replaceAll('\n', ' ');
            return await md.createLink(selectedText, url);
        case 'link with page title as title':
            return await md.createLink(title, url);
        default:
            console.error(`Unknown selectionFormat: ${selectionFormat}`);
            throw new Error(`Unknown selectionFormat: ${selectionFormat}`);
    }
}

/**
 * getSourceFormatMdWithLink gets markdown of the selected part of the document,
 * attempts to keep the source formatting, and adds a link to the page. The selected
 * text is used as a fallback if the source formatting cannot be obtained.
 * @param {string} title - the page's title.
 * @param {string} url - the page's URL.
 * @param {string} selectedText - the selected text.
 * @returns {Promise<string>}
 */
async function getSourceFormatMdWithLink(title, url, selectedText) {
    const link = await md.createLink(title, url);
    const alert = await md.createAlert('note', `from ${link}`);
    const html = await getSelectionHtml();
    if (html === null) {
        return alert + '\n\n' + selectedText + '\n';
    } else {
        return alert + '\n\n' + await md.htmlToMarkdown(html) + '\n';
    }
}

/**
 * getSourceFormatMd gets markdown of the selected part of the document and attempts to
 * keep the source formatting. The selected text is used as a fallback if the source
 * formatting cannot be obtained.
 * @param {string} selectedText - the selected text.
 * @returns {Promise<string>}
 */
async function getSourceFormatMd(selectedText) {
    const html = await getSelectionHtml();
    if (html === null) {
        return selectedText + '\n';
    } else {
        return await md.htmlToMarkdown(html) + '\n';
    }
}

/**
 * getSelectionHtml gets a selection object and returns its HTML content. If no
 * selection exists, null is returned.
 * @returns {Promise<string|null>}
 */
async function getSelectionHtml() {
    const s = window.getSelection();
    if (s === null) {
        console.error('Failed to get a selection');
        return null;
    } else if (s.rangeCount === 0) {
        console.error('Selection range count is zero');
        return null;
    }

    let startRange = s.getRangeAt(0).cloneRange();
    let startNode = startRange.startContainer;

    // While there is a parent node and either the parent node or its parent node is a
    // header tag...
    while (
        startNode.parentNode && (
            startNode.parentNode.nodeName.startsWith('H') || (
                startNode.parentNode.parentNode &&
                startNode.parentNode.parentNode.nodeName.startsWith('H')
            )
        )
    ) {
        // ...expand the start of the selection to include the header tag. This is
        // necessary because the selection may not include a header tag even if the user
        // selected text within it.
        startNode = startNode.parentNode;
        startRange.setStartBefore(startNode);
    }

    let container = document.createElement('div');
    container.appendChild(startRange.cloneContents());
    for (let i = 1; i < s.rangeCount; i++) {
        container.appendChild(s.getRangeAt(i).cloneContents());
    }

    return await makeUrlsAbsolute(container.innerHTML);
}

/**
 * makeUrlsAbsolute makes all relative URLs in the HTML absolute. If there are no
 * relative URLs, the HTML is returned unchanged. Relative URLs may start with a slash
 * (/) or a number sign (#).
 * @param {string} html - the HTML to make URLs absolute in.
 * @returns {Promise<string>}
 */
async function makeUrlsAbsolute(html) {
    // If a URL starts with a slash, insert the site's base URL before it. If a URL
    // starts with a number sign, insert the page's href before it.
    const href = window.location.href;
    const url = new URL(href);
    const base = url.origin;

    return html
        .replaceAll('href="/', `href="${base}/`)
        .replaceAll('href="#', `href="${href}#`)
}
