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
import { htmlToMd, encodeUrl } from './converters/md.js';

/**
 * createText creates markdown (or another text format) of the selected part of the
 * page. The format is mostly determined by the user's settings. If no text is selected,
 * a link to the page is created.
 * @param {string} title - the title of the page.
 * @param {string} url - the URL of the page.
 * @param {Selection|null} selection - a selection object.
 * @returns {Promise<string>}
 */
export async function createText(title, url, selection) {
    const selectedText = selection.toString().trim();
    if (!selectedText) {
        return await md.createLink(title, url);
    }

    const selectionFormat = await getSetting('selectionFormat');
    switch (selectionFormat) {
        case 'source with link':
            return await getSourceFormatTextWithLink(title, url, selection, selectedText) + '\n';
        case 'source':
            return await getSourceFormatText(selection, selectedText);
        case 'template':
            return await getTemplatedText(title, url, selection, selectedText);
        case 'blockquote with link':
            const body = await getSourceFormatText(selection, selectedText);
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
 * getSelectionFragment takes a selection object and returns its HTML content as a
 * document fragment. If no selection exists, null is returned. The selection may be
 * expanded to include certain elements that are ancestors of the selection to make
 * copying easier.
 * @param {Selection} selection
 * @returns {Promise<DocumentFragment|null>}
 */
export async function getSelectionFragment(selection) {
    if (selection === null || selection.type === 'None') {
        console.error('Failed to get a selection');
        return null;
    } else if (selection.rangeCount === 0) {
        console.error('Selection range count is zero');
        return null;
    }

    /** @type {DocumentFragment} */
    const frag = document.createDocumentFragment();

    const startRange = getStartRange(selection);
    frag.appendChild(startRange.cloneContents());
    for (let i = 1; i < selection.rangeCount - 1; i++) {
        frag.appendChild(selection.getRangeAt(i).cloneContents());
    }
    if (selection.rangeCount > 1) {
        const endRange = getEndRange(selection);
        frag.appendChild(endRange.cloneContents());
    }

    return frag;
}

/**
 * getSourceFormatText gets markdown (or another text format) of the selected part of
 * the document and attempts to keep the source formatting. The selected text is used as
 * a fallback if the source formatting cannot be obtained.
 * @param {Selection|null} - a selection object.
 * @param {string} selectedText - the selected text.
 * @returns {Promise<string>}
 */
export async function getSourceFormatText(selection, selectedText) {
    /** @type {DocumentFragment} */
    const frag = await getSelectionFragment(selection);
    if (frag === null) {
        return selectedText;
    }
    return await htmlToMd(frag);
}

export async function getTemplatedText(title, url, selection, selectedText) {
    const template = await getSetting('selectionTemplate');

    title = await md.createLinkTitle(title);
    url = encodeUrl(url);

    /** @type {DocumentFragment} */
    const frag = await getSelectionFragment(selection);
    if (frag === null) {
        text = selectedText;
    } else {
        text = await htmlToMd(frag);
    }
    const today = new Date();
    const YYYYMMDD = today.getFullYear() + '/' + (today.getMonth() + 1) + '/' + today.getDate();
    const templateVars = {
        link: { title, url },
        date: { YYYYMMDD },
        text,
    };

    try {
        return template.replaceAll(/{{([\w.]+)}}/g, (match, group) => {
            return group.split('.').reduce((vars, token) => vars[token], templateVars);
        });
    } catch (err) {
        // an error message should have been shown when the user changed the template
        console.error(err);
        throw err;
    }
}

/**
 * getSourceFormatTextWithLink gets markdown of the selected part of the document,
 * attempts to keep the source formatting, and adds a link to the page. The selected
 * text is used as a fallback if the source formatting cannot be obtained.
 * @param {string} title - the page's title.
 * @param {string} url - the page's URL.
 * @param {Selection|null} - a selection object.
 * @param {string} selectedText - the selected text.
 * @returns {Promise<string>}
 */
async function getSourceFormatTextWithLink(title, url, selection, selectedText) {
    const link = await md.createLink(title, url);
    const today = new Date();
    const todayStr = today.getFullYear() + '/' + (today.getMonth() + 1) + '/' + today.getDate();
    const alert = await md.createAlert('note', `from ${link} on ${todayStr}`);

    /** @type {DocumentFragment} */
    const frag = await getSelectionFragment(selection);
    if (frag === null) {
        return alert + '\n\n' + selectedText;
    }

    const text = await htmlToMd(frag);

    return alert + '\n\n' + text;
}

/**
 * getStartRange gets the first range of a selection. The start of the selection may be
 * expanded to include certain elements that are ancestors of the selection to make
 * copying easier.
 * @param {Selection} selection - a selection object.
 * @returns {Range} - the first range of the selection.
 */
function getStartRange(selection) {
    let startRange = selection.getRangeAt(0).cloneRange();
    let startNode = startRange.startContainer;

    startNode = startBeforeAncestorHeader(startRange, startNode);
    startNode = startBeforeAncestorTable(startRange, startNode);
    startNode = startBeforeAncestorCode(startRange, startNode);
    startNode = startBeforeParentPre(startRange, startNode);

    return startRange;
}

/**
 * getEndRange gets the last range of a selection. The end of the selection may be
 * expanded to include certain elements that are ancestors of the selection to make
 * copying easier.
 * @param {Selection} selection - a selection object.
 * @returns {Range} - the last range of the selection.
 */
function getEndRange(selection) {
    let endRange = selection.getRangeAt(selection.rangeCount - 1).cloneRange();
    let endNode = endRange.endContainer;

    endNode = endAfterAncestorCode(endRange, endNode);
    endNode = endAfterParentPre(endRange, endNode);

    return endRange;
}

/**
 * startBeforeAncestorHeader expands a selection to include header elements that are the
 * parent or grandparent of the start of the selection.
 * @param {Range} startRange - a selection's index 0 range.
 * @param {Node} startNode - a selection's index 0 range's start container.
 * @returns {Node} - the new start node.
 */
function startBeforeAncestorHeader(startRange, startNode) {
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
 * startBeforeAncestorTable expands a selection to include table elements that are the
 * parent of the start of the selection.
 * @param {Range} startRange - a selection's index 0 range.
 * @param {Node} startNode - a selection's index 0 range's start container.
 * @returns {Node} - the new start node.
 */
function startBeforeAncestorTable(startRange, startNode) {
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
 * startBeforeAncestorCode expands a selection to include any code element that is an
 * ancestor to the start of the selection as long as any tags between them are span
 * tags.
 * @param {Range} startRange - a selection's index 0 range.
 * @param {Node} startNode - a selection's index 0 range's start container.
 * @returns {Node} - the new start node.
 */
function startBeforeAncestorCode(startRange, startNode) {
    // If there are only span tags between the start node and an ancestor code tag,
    // expand the start of the selection to include the code tag. This makes code blocks
    // easier to copy.
    let temp = startNode;
    if (temp.parentNode && temp.parentNode.nodeName === 'SPAN') {
        temp = temp.parentNode;
    }
    while (temp && temp.nodeName === 'SPAN') {
        temp = temp.parentNode;
    }

    if (temp && temp.nodeName === 'CODE') {
        startNode = temp;
        startRange.setStartBefore(startNode);
    }

    return startNode;
}

/**
 * startBeforeParentPre expands a selection to include pre elements that are the parent
 * of the start of the selection.
 * @param {Range} startRange - a selection's index 0 range.
 * @param {Node} startNode - a selection's index 0 range's start container.
 * @returns {Node} - the new start node.
 */
function startBeforeParentPre(startRange, startNode) {
    // If the parent is a pre tag, expand the start of the selection to include the pre
    // tag. This makes preformatted text including code blocks easier to copy.
    const parent = startNode.parentNode;
    if (parent && parent.nodeName === 'PRE') {
        startNode = parent;
        startRange.setStartBefore(startNode);
    }

    return startNode;
}

/**
 * endAfterAncestorCode expands a selection to include any code element that is an
 * ancestor to the end of the selection as long as any tags between them are span tags.
 * @param {Range} endRange - a selection's last range.
 * @param {Node} endNode - a selection's last range's end container.
 * @returns {Node} - the new end node.
 */
function endAfterAncestorCode(endRange, endNode) {
    // If there are only span tags between the end node and an ancestor code tag, expand
    // the end of the selection to include the code tag. This makes code blocks easier
    // to copy.
    let temp = endNode;
    if (temp.parentNode && temp.parentNode.nodeName === 'SPAN') {
        temp = temp.parentNode;
    }
    while (temp && temp.nodeName === 'SPAN') {
        temp = temp.parentNode;
    }

    if (temp && temp.nodeName === 'CODE') {
        endNode = temp;
        endRange.setEndAfter(endNode);
    }

    return endNode;
}

/**
 * endAfterParentPre expands a selection to include pre elements that are the parent of
 * the end of the selection.
 * @param {Range} endRange - a selection's last range.
 * @param {Node} endNode - a selection's last range's end container.
 * @returns {Node} - the new end node.
 */
function endAfterParentPre(endRange, endNode) {
    // If the parent is a pre tag, expand the end of the selection to include the pre
    // tag. This makes preformatted text including code blocks easier to copy.
    const parent = endNode.parentNode;
    if (parent && parent.nodeName === 'PRE') {
        endNode = parent;
        endRange.setEndAfter(endNode);
    }

    return endNode;
}
