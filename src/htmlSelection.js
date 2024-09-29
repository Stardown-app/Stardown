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

import { getSetting, sendToNotepad, applyTemplate } from './utils.js';
import { preprocessFragment } from './converters/utils/html.js';
import * as md from './generators/md.js';
import { htmlToMd, mdEncodeUri } from './converters/md.js';
import { htmlToMdAndHtml } from './converters/mdAndHtml.js';

/**
 * createText creates text of the selected part of the page. The language and format are
 * determined by the user's settings. If there is no selection, a link to the page is
 * created.
 * @param {string} title - the title of the page.
 * @param {string} url - the URL of the page.
 * @param {Selection|null} selection - a selection object.
 * @returns {Promise<string>}
 */
export async function createText(title, url, selection) {
    const markupLanguage = await getSetting('markupLanguage');

    const selectedText = selection?.toString().trim() || '';
    if (!selectedText) {
        switch (markupLanguage) {
            case 'markdown':
            case 'markdown with some html':
                const mdLink = await md.createLink(title, url);
                await sendToNotepad(mdLink);
                return mdLink;
            case 'html':
                const htmlLink = `<a href="${url}">${title}</a>`;
                await sendToNotepad(htmlLink);
                return htmlLink;
            default:
                console.error(`Unknown markupLanguage: ${markupLanguage}`);
                throw new Error(`Unknown markupLanguage: ${markupLanguage}`);
        }
    }

    if (markupLanguage === 'html') {
        /** @type {DocumentFragment|null} */
        const frag = await getSelectionFragment(selection);
        if (frag === null) {
            await sendToNotepad(selectedText);
            return selectedText;
        }

        absolutizeNodeUrls(frag, url);

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

    const mdSelectionFormat = await getSetting('mdSelectionFormat');
    switch (mdSelectionFormat) {
        case 'source with link':
            return await getSourceFormatMdWithLink(
                title, url, selection, selectedText, markupLanguage,
            ) + '\n';
        case 'source':
            const srcMd = await getSourceFormatMd(selection, selectedText, markupLanguage);
            await sendToNotepad(srcMd);
            return srcMd;
        case 'template':
            const templateMd = await getTemplatedMd(
                title, url, selection, selectedText, markupLanguage,
            );
            await sendToNotepad(templateMd);
            return templateMd;
        case 'blockquote with link':
            const body = await getSourceFormatMd(selection, selectedText, markupLanguage);
            const blockquote = await md.createBlockquote(body, title, url) + '\n';
            await sendToNotepad(blockquote);
            return blockquote;
        case 'link with selection as title':
            const text = selectedText.replaceAll('\r\n', ' ').replaceAll('\n', ' ');
            const link = await md.createLink(text, url);
            await sendToNotepad(link);
            return link;
        case 'link with page title as title':
            const link2 = await md.createLink(title, url);
            await sendToNotepad(link2);
            return link2;
        default:
            console.error(`Unknown mdSelectionFormat: ${mdSelectionFormat}`);
            throw new Error(`Unknown mdSelectionFormat: ${mdSelectionFormat}`);
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

    if (selection.rangeCount > 1) {
        combineRanges(selection);
    }

    /** @type {DocumentFragment} */
    const frag = document.createDocumentFragment();
    const startRange = getStartRange(selection);
    frag.appendChild(startRange.cloneContents());

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

    await preprocessFragment(frag);

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
 * @param {string} url - the URL of the page.
 * @param {Selection|null} selection - a selection object.
 * @param {string} selectedText - the selected text.
 * @param {string} markupLanguage - the user's chosen markup language.
 * @returns {Promise<string>}
 */
async function getTemplatedMd(title, url, selection, selectedText, markupLanguage) {
    title = await md.createLinkTitle(title);
    url = mdEncodeUri(url);
    const text = await getSourceFormatMd(selection, selectedText, markupLanguage);
    const template = await getSetting('mdSelectionTemplate');

    return await applyTemplate(template, title, url, text);
}

/**
 * getSourceFormatMdWithLink gets markdown of the selected part of the document,
 * attempts to keep the source formatting, and adds a link to the page. The selected
 * text is used as a fallback if the source formatting cannot be obtained.
 * @param {string} title - the page's title.
 * @param {string} url - the page's URL.
 * @param {Selection|null} selection - a selection object.
 * @param {string} selectedText - the selected text.
 * @param {string} markupLanguage - the user's chosen markup language.
 * @returns {Promise<string>}
 */
async function getSourceFormatMdWithLink(title, url, selection, selectedText, markupLanguage) {
    const link = await md.createLink(title, url);
    const today = new Date();
    const todayStr = today.getFullYear() + '/' + (today.getMonth() + 1) + '/' + today.getDate();
    const alert = await md.createAlert('note', `from ${link} on ${todayStr}`);

    const text = await getSourceFormatMd(selection, selectedText, markupLanguage);

    await sendToNotepad(text);
    return alert + '\n\n' + text;
}

/**
 * combineRanges combines the ranges of a selection into one range, modifying the
 * selection in place.
 * @param {Selection} selection
 * @returns {void}
 */
function combineRanges(selection) {
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
    startNode = startBeforeParentPre(startRange, startNode);

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
