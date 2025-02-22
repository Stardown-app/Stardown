/*
   Copyright 2024 Chris Wheeler and Jonathan Chua

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

import { getSetting } from './getSetting.js';
import { sendToNotepad, applyTemplate } from './contentUtils.js';
import { absolutizeNodeUrls } from './converters/utils/urls.js';
import { nodeTypes, improveConvertibility } from './converters/utils/html.js';
import { createLink } from './generators/all.js';
import * as md from './generators/md.js';
import { htmlToMd, mdEncodeUri } from './converters/md.js';
import { htmlToMdAndHtml } from './converters/mdAndHtml.js';

/**
 * createText creates text of the selected part of the page. The output markup language
 * is determined by the user's settings. If there is no selection, a link to the page is
 * created.
 * @param {string} title - the title of the page.
 * @param {string} sourceUrl - the URL of the source.
 * @param {Selection|null} selection - a selection object.
 * @param {string} messageCategory
 * @returns {Promise<string>}
 */
export async function createText(title, sourceUrl, selection, messageCategory) {
    const markupLanguage = await getSetting('markupLanguage');

    const selectedText = selection?.toString().trim();
    if (!selectedText) {
        const link = await createLink(title, sourceUrl, markupLanguage);
        await sendToNotepad(link);
        return link;
    }

    if (markupLanguage === 'html') {
        /** @type {DocumentFragment|null} */
        const frag = await getSelectionFragment(selection);
        if (frag === null) {
            await sendToNotepad(selectedText);
            return selectedText;
        }

        await improveConvertibility(frag, location);

        absolutizeNodeUrls(frag, sourceUrl);

        // convert the fragment to a string
        const div = document.createElement('div');
        div.appendChild(frag.cloneNode(true));
        const result = div.innerHTML || selectedText;

        await sendToNotepad(result);
        return result;
    }

    if (markupLanguage !== 'markdown' && markupLanguage !== 'markdown with some html') {
        console.error(`Unknown markupLanguage: ${markupLanguage}`);
        throw new Error(`Unknown markupLanguage: ${markupLanguage}`);
    }

    switch (messageCategory) {
        case 'copySelectionShortcut':
        case 'selectionRightClick':
        case 'markdownTableRightClick':
            const srcMd = await getSourceFormatMd(selection, selectedText, markupLanguage);
            await sendToNotepad(srcMd);
            return srcMd;
        case 'selectionWithSourceRightClick':
            const templateMd = await getTemplatedMd(
                title, sourceUrl, selection, selectedText, markupLanguage,
            );
            await sendToNotepad(templateMd);
            return templateMd;
        case 'selectionQuoteRightClick':
            const body = await getSourceFormatMd(selection, selectedText, markupLanguage);
            const blockquote = await md.createBlockquote(body, title, sourceUrl) + '\n';
            await sendToNotepad(blockquote);
            return blockquote;
        default:
            console.error(`Unknown messageCategory: ${messageCategory}`);
            throw new Error(`Unknown messageCategory: ${messageCategory}`);
    }
}

/**
 * getSelectionFragment takes a selection object and returns its HTML content as a
 * document fragment. If no selection exists, null is returned. The selection may be
 * expanded to include certain elements that are ancestors of the selection to make
 * copying easier.
 * @param {Selection|null} selection
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

    combineRanges(selection);

    /** @type {DocumentFragment} */
    let frag = document.createDocumentFragment();
    const startRange = getStartRange(selection);
    frag.appendChild(startRange.cloneContents());

    if (isSelectionInList(frag)) {
        // The fragment is used to detect a list because the fragment of a range of part
        // of a list tends to start with an LI, unlike that range. However, the range
        // must then be used to get the list because the fragment contains no ancestors
        // of the LI elements.

        /** @type {Element|null} */
        const list = getList(startRange); // either an OL, UL, or MENU element
        if (list !== null) {
            frag = wrapRangeContentWithList(startRange, list);
        }
    }

    return frag;
}

/**
 * getSourceFormatMd gets markdown of the selected part of the document and attempts to
 * keep the source formatting. The selected text is used as a fallback if the source
 * formatting cannot be obtained.
 * @param {Selection|null} selection - a selection object.
 * @param {string} selectedText - the selected text.
 * @param {string} markupLanguage - the user's chosen markup language.
 * @returns {Promise<string>}
 */
async function getSourceFormatMd(selection, selectedText, markupLanguage) {
    /** @type {DocumentFragment} */
    const frag = await getSelectionFragment(selection);
    if (frag === null) {
        return selectedText;
    }

    await improveConvertibility(frag, location);

    switch (markupLanguage) {
        case 'markdown':
            return await htmlToMd(frag);
        case 'markdown with some html':
            return await htmlToMdAndHtml(frag);
        default:
            console.error(`Unknown markupLanguage: ${markupLanguage}`);
            throw new Error(`Unknown markupLanguage: ${markupLanguage}`);
    }
}

/**
 * getTemplatedMd gets markdown of the selected part of the document and uses a template
 * to format it. The selected text is used as a fallback if the source formatting cannot
 * be obtained.
 * @param {string} title - the title of the page.
 * @param {string} sourceUrl - the URL of the source.
 * @param {Selection|null} selection - a selection object.
 * @param {string} selectedText - the selected text.
 * @param {string} markupLanguage - the user's chosen markup language.
 * @returns {Promise<string>}
 */
async function getTemplatedMd(title, sourceUrl, selection, selectedText, markupLanguage) {
    title = await md.createLinkTitle(title);
    sourceUrl = mdEncodeUri(sourceUrl);
    const text = await getSourceFormatMd(selection, selectedText, markupLanguage);
    const template = await getSetting('mdSelectionWithSourceTemplate');

    return await applyTemplate(template, title, sourceUrl, text);
}

/**
 * combineRanges combines the ranges of a selection into one range, modifying the
 * selection in place. This function has no effect on selections with 0 or 1 ranges.
 * Most browsers put only one range in each selection, but Firefox's selections usually
 * have multiple ranges. These ranges tend to overlap, and working with multiple ranges
 * is more difficult than working with one range.
 * @param {Selection} selection
 * @returns {void}
 */
function combineRanges(selection) {
    if (selection.rangeCount <= 1) {
        return;
    }

    const combinedRange = document.createRange();
    const originalRanges = [];
    for (let i = 0; i < selection.rangeCount; i++) {
        originalRanges.push(selection.getRangeAt(i));
    }

    if (originalRanges.length > 0) {
        combinedRange.setStart(
            originalRanges[0].startContainer,
            originalRanges[0].startOffset,
        );

        for (let i = 1; i < originalRanges.length; i++) {
            const currentRange = originalRanges[i];

            const rangesOverlap = Boolean(
                currentRange.compareBoundaryPoints(
                    currentRange.START_TO_END,
                    combinedRange,
                ) >= 0 &&
                currentRange.compareBoundaryPoints(
                    currentRange.END_TO_START,
                    combinedRange,
                ) <= 0
            );

            if (rangesOverlap) {
                const combinedEnd = combinedRange.endContainer;
                const combinedEndOffset = combinedRange.endOffset;

                const isStartEqualToEnd = Boolean(
                    currentRange.startContainer === combinedEnd &&
                    currentRange.startOffset === combinedEndOffset
                );

                if (isStartEqualToEnd) {
                    combinedRange.setEnd(currentRange.endContainer, currentRange.endOffset);
                } else {
                    combinedRange.setEnd(currentRange.startContainer, currentRange.startOffset);
                }
            } else { // if the ranges don't overlap
                combinedRange.setEnd(currentRange.endContainer, currentRange.endOffset);
            }
        }
    }

    selection.removeAllRanges();
    selection.addRange(combinedRange);
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
    startNode = startBeforeAncestorPre(startRange, startNode);

    return startRange;
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
    const tableTags = ['TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD'];

    // While there is a parent node and it's a table tag...
    while (
        startNode.nodeName !== 'TABLE' &&
        startNode.parentNode &&
        tableTags.includes(startNode.parentNode.nodeName)
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
    const parent = startNode.parentNode;
    if (!parent) {
        return startNode;
    }

    if (parent.nodeName === 'CODE') {
        startRange.setStartBefore(parent);
        return parent;
    }

    // If there are only span tags between the start node and an ancestor code tag, expand
    // the start of the selection to include the code tag. This makes code blocks easier
    // to copy.
    let temp = parent;
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
 * startBeforeAncestorPre expands a selection to include span and pre elements that are
 * ancestors to the start of the selection.
 * @param {Range} startRange - a selection's index 0 range.
 * @param {Node} startNode - a selection's index 0 range's start container.
 * @returns {Node} - the new start node.
 */
function startBeforeAncestorPre(startRange, startNode) {
    const parent = startNode.parentNode;
    if (!parent) {
        return startNode;
    }

    if (parent.nodeName === 'PRE') {
        startRange.setStartBefore(parent);
        return parent;
    }

    let temp = parent;
    while (temp && temp.nodeName === 'SPAN') {
        temp = temp.parentNode;
    }

    if (temp && temp.nodeName === 'PRE') {
        startNode = temp;
        startRange.setStartBefore(startNode);
    }

    return startNode;
}

/**
 * isSelectionInList checks if the fragment of a selection is in a list. False is
 * returned if the selection is entirely in one LI element.
 * @param {DocumentFragment} frag
 * @returns {boolean}
 */
function isSelectionInList(frag) {
    for (let i = 0; i < frag.childNodes.length; i++) {
        const node = frag.childNodes[i];

        if (node.nodeType === nodeTypes.COMMENT_NODE) {
            continue;
        } else if (node.nodeName === 'LI') {
            return true;
        }
    }

    return false;
}

/**
 * getList attempts to get the list element that contains the selected text. This
 * function assumes the selected text is in a list element. If the selection starts in a
 * node that is nested too deeply away from the list element, null is returned.
 * @param {Range} startRange
 * @returns {Element|null}
 */
function getList(startRange) {
    /** @type {Element} */
    let list = startRange.startContainer.parentNode;
    for (let i = 0; i < 10 && list && !['OL', 'UL', 'MENU'].includes(list.nodeName); i++) {
        list = list.parentNode;
    }
    if (!['OL', 'UL', 'MENU'].includes(list.nodeName)) {
        return null;
    }
    return list;
}

/**
 * wrapRangeContentWithList wraps the selection range with a new list element based on
 * the existing one. This function assumes the given range is in a list element.
 * @param {Range} startRange
 * @param {HTMLOListElement|HTMLUListElement|HTMLMenuElement} list
 * @returns {DocumentFragment}
 */
function wrapRangeContentWithList(startRange, list) {
    /** @type {Element} */
    let firstSelectedLi = startRange.startContainer;
    while (firstSelectedLi.nodeName !== 'LI') {
        firstSelectedLi = firstSelectedLi.parentNode;
    }

    let newList;
    if (list.nodeName === 'OL') {
        newList = document.createElement('ol');

        const originalId = firstSelectedLi.getAttribute('id');
        firstSelectedLi.setAttribute('id', 'list-selection-start');

        let startAttr = list.getAttribute('start') || '1';
        for (let i = 0; i < list.children.length; i++) {
            const child = list.children[i];
            if (
                child.nodeType === nodeTypes.ELEMENT_NODE &&
                child.getAttribute('id') === 'list-selection-start'
            ) {
                startAttr = String(i + 1);
                break;
            }
        }
        if (originalId !== null) {
            firstSelectedLi.setAttribute('id', originalId);
        } else {
            firstSelectedLi.removeAttribute('id');
        }

        newList.setAttribute('start', startAttr);
        newList.setAttribute('reversed', list.getAttribute('reversed') || 'false');
        newList.setAttribute('type', list.getAttribute('type') || '1');
    } else if (list.nodeName === 'UL') {
        newList = document.createElement('ul');
    } else if (list.nodeName === 'MENU') {
        newList = document.createElement('menu');
    } else {
        throw new Error('Unknown list type');
    }

    startRange.setStartBefore(firstSelectedLi);
    newList.appendChild(startRange.cloneContents());
    const frag = document.createDocumentFragment();
    frag.appendChild(newList);

    return frag;
}
