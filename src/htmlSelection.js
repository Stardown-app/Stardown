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
 * @param {Selection|null} selection - a selection object.
 * @returns {Promise<string>}
 */
export async function createMd(title, url, selection) {
    const selectedText = selection.toString().trim();
    if (!selectedText) {
        return await md.createLink(title, url);
    }

    const selectionFormat = await getSetting('selectionFormat');
    switch (selectionFormat) {
        case 'source with link':
            return await getSourceFormatMdWithLink(title, url, selection, selectedText) + '\n';
        case 'source':
            return await getSourceFormatMd(selection, selectedText);
        case 'blockquote with link':
            const body = await getSourceFormatMd(selection, selectedText);
            return await md.createBlockquote(body, title, url) + '\n';
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
 * @param {Selection|null} - a selection object.
 * @param {string} selectedText - the selected text.
 * @returns {Promise<string>}
 */
async function getSourceFormatMdWithLink(title, url, selection, selectedText) {
    const link = await md.createLink(title, url);
    const today = new Date();
    const todayStr = today.getFullYear() + '/' + (today.getMonth() + 1) + '/' + today.getDate();
    const alert = await md.createAlert('note', `from ${link} on ${todayStr}`);
    const html = await getSelectionHtml(selection);
    if (html === null) {
        return alert + '\n\n' + selectedText;
    } else {
        return alert + '\n\n' + await md.htmlToMarkdown(html);
    }
}

/**
 * getSourceFormatMd gets markdown of the selected part of the document and attempts to
 * keep the source formatting. The selected text is used as a fallback if the source
 * formatting cannot be obtained.
 * @param {Selection|null} - a selection object.
 * @param {string} selectedText - the selected text.
 * @returns {Promise<string>}
 */
async function getSourceFormatMd(selection, selectedText) {
    const html = await getSelectionHtml(selection);
    if (html === null) {
        return selectedText;
    } else {
        return await md.htmlToMarkdown(html);
    }
}

/**
 * getSelectionHtml gets a selection object and returns its HTML content. If no
 * selection exists, null is returned.
 * @param {Selection|null} - a selection object.
 * @returns {Promise<string|null>}
 */
async function getSelectionHtml(selection) {
    if (selection === null || selection.type === 'None') {
        console.error('Failed to get a selection');
        return null;
    } else if (selection.rangeCount === 0) {
        console.error('Selection range count is zero');
        return null;
    }

    let startRange = selection.getRangeAt(0).cloneRange();
    let startNode = startRange.startContainer;

    startNode = selectAncestorHeader(startRange, startNode);
    startNode = selectParentTable(startRange, startNode);
    startNode = selectAncestorCode(startRange, startNode);
    startNode = selectParentPre(startRange, startNode);

    let container = document.createElement('div');
    container.appendChild(startRange.cloneContents());
    for (let i = 1; i < selection.rangeCount; i++) {
        container.appendChild(selection.getRangeAt(i).cloneContents());
    }

    return container.innerHTML;
}

/**
 * selectAncestorHeader expands a selection to include header elements that are the
 * parent or grandparent of the start of the selection.
 * @param {Range} startRange - a selection's index 0 range.
 * @param {Node} startNode - a selection's index 0 range's start container.
 * @returns {Node} - the new start node.
 */
function selectAncestorHeader(startRange, startNode) {
    // If the parent or grandparent is a header tag, expand the start of the selection
    // to include the header tag. This is important because the selection may not
    // include a header tag even if the user selected text within it.
    const parent = startNode.parentNode;
    if (parent) {
        const grandparent = parent.parentNode;
        if (grandparent && grandparent.nodeName.startsWith('H')) {
            startNode = grandparent;
            startRange.setStartBefore(startNode);
        } else if (parent.nodeName.startsWith('H')) {
            startNode = parent;
            startRange.setStartBefore(startNode);
        }
    }

    return startNode;
}

/**
 * selectParentTable expands a selection to include table elements that are the parent
 * of the start of the selection.
 * @param {Range} startRange - a selection's index 0 range.
 * @param {Node} startNode - a selection's index 0 range's start container.
 * @returns {Node} - the new start node.
 */
function selectParentTable(startRange, startNode) {
    const tags = ['TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD'];

    // While there is a parent node and it's a table tag...
    while (
        startNode.nodeName !== 'TABLE' &&
        startNode.parentNode &&
        tags.includes(startNode.parentNode.nodeName)
    ) {
        // ...expand the start of the selection to include the table tag. This makes
        // tables easier to copy.
        startNode = startNode.parentNode;
        startRange.setStartBefore(startNode);
    }

    return startNode;
}

/**
 * selectAncestorCode expands a selection to include any code element that is an
 * ancestor to the start of the selection as long as any tags between them are span
 * tags.
 * @param {Range} startRange - a selection's index 0 range.
 * @param {Node} startNode - a selection's index 0 range's start container.
 * @returns {Node} - the new start node.
 */
function selectAncestorCode(startRange, startNode) {
    // If there are only span tags between the start node and an ancestor code tag,
    // expand the start of the selection to include the code tag. This makes code blocks
    // easier to copy.
    let temp = startNode;
    if (temp.parentNode && temp.parentNode.nodeName === 'SPAN') {
        temp = temp.parentNode;
    }
    while (temp.nodeName === 'SPAN') {
        temp = temp.parentNode;
    }

    if (temp.nodeName === 'CODE') {
        startNode = temp;
        startRange.setStartBefore(startNode);
    }

    return startNode;
}

/**
 * selectParentPre expands a selection to include pre elements that are the parent of
 * the start of the selection.
 * @param {Range} startRange - a selection's index 0 range.
 * @param {Node} startNode - a selection's index 0 range's start container.
 * @returns {Node} - the new start node.
 */
function selectParentPre(startRange, startNode) {
    // If the parent is a pre tag, expand the start of the selection to include the pre
    // tag. This makes preformatted text including code blocks easier to copy.
    const parent = startNode.parentNode;
    if (parent && parent.nodeName === 'PRE') {
        startNode = parent;
        startRange.setStartBefore(startNode);
    }

    return startNode;
}
