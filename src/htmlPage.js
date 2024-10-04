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

import { getSetting } from './getSetting.js';
import { sendToNotepad, applyTemplate, readabilitize } from './contentUtils.js';
import { preprocessFragment } from './converters/utils/html.js';
import { absolutizeNodeUrls, removeIdAndTextFragment } from './converters/utils/urls.js';
import * as md from './generators/md.js';
import { htmlToMd } from './converters/md.js';
import { htmlToMdAndHtml } from './converters/mdAndHtml.js';
import { handleCopyRequest } from './browserSpecific.js';

/**
 * @typedef {import('./content.js').ContentResponse} ContentResponse
 */

/**
 * handleCopyPageRequest handles a request to copy the entire current page.
 * @returns {Promise<ContentResponse>}
 */
export async function handleCopyPageRequest() {
    const text = await createPageText();
    return await handleCopyRequest(text);
}

/**
 * createPageText creates a text representation of the entire current page.
 * @returns {Promise<string>}
 */
async function createPageText() {
    const markupLanguage = await getSetting('markupLanguage');
    if (markupLanguage === 'html') {
        const frag = document.createDocumentFragment();
        frag.append(document.documentElement.cloneNode(true));

        absolutizeNodeUrls(frag, location.href);

        // convert the fragment to a string
        const div = document.createElement('div');
        div.appendChild(frag.cloneNode(true));
        const html = div.innerHTML || selectedText;

        await sendToNotepad(html);
        return html;
    }

    if (markupLanguage !== 'markdown' && markupLanguage !== 'markdown with some html') {
        console.error(`Unknown markupLanguage: ${markupLanguage}`);
        throw new Error(`Unknown markupLanguage: ${markupLanguage}`);
    }

    const title = document.title;
    const url = removeIdAndTextFragment(location.href);

    const mdSelectionFormat = await getSetting('mdSelectionFormat');
    switch (mdSelectionFormat) {
        case 'source with link':
            return await getSourceFormatMdWithLink(title, url, markupLanguage) + '\n';
        case 'source':
            const srcMd = await getSourceFormatMd(markupLanguage);
            await sendToNotepad(srcMd);
            return srcMd;
        case 'template':
            const templateMd = await getTemplateMd(title, url, markupLanguage);
            await sendToNotepad(templateMd);
            return templateMd;
        case 'blockquote with link':
            const body = await getSourceFormatMd(markupLanguage);
            const blockquote = await md.createBlockquote(body, title, url) + '\n';
            await sendToNotepad(blockquote);
            return blockquote;
        case 'link with selection as title':
            const text = document.textContent.trim().replaceAll('\r\n', ' ').replaceAll('\n', ' ');
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

async function getSourceFormatMdWithLink(title, url, markupLanguage) {
    const link = await md.createLink(title, url);
    const today = new Date();
    const todayStr = today.getFullYear() + '/' + (today.getMonth() + 1) + '/' + today.getDate();
    const alert = await md.createAlert('note', `from ${link} on ${todayStr}`);

    const text = await getSourceFormatMd(markupLanguage);

    await sendToNotepad(text);
    return alert + '\n\n' + text;
}

/**
 * getSourceFormatMd returns source-formatted markdown of the current page in the user's
 * chosen markup language.
 * @param {string} markupLanguage - the user's chosen markup language.
 * @returns {Promise<string>}
 */
async function getSourceFormatMd(markupLanguage) {
    // Clone the body so we don't modify the original.
    /** @type {DocumentFragment} */
    let frag = document.createDocumentFragment();
    frag.append(document.body.cloneNode(true));

    const readabilityJs = await getSetting('readabilityJs');
    if (readabilityJs) {
        frag = await readabilitize(frag);
    }

    await preprocessFragment(frag, location.hostname);

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
 * getTemplateMd gets markdown of the current page in the user's chosen markup language
 * and uses a template to format it.
 * @param {string} title - the title of the page.
 * @param {string} url - the URL of the page.
 * @param {string} markupLanguage - the user's chosen markup language.
 * @returns {Promise<string>}
 */
async function getTemplateMd(title, url, markupLanguage) {
    title = await md.createLinkTitle(title);
    url = mdEncodeUri(url);
    const text = getSourceFormatMd(markupLanguage);
    const template = await getSetting('mdSelectionTemplate');

    return await applyTemplate(template, title, url, text);
}
