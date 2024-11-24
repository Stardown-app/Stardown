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
import { sendToNotepad, handleCopyRequest } from './contentUtils.js';
import { extractMainContent } from './extractMainContent.js';
import { improveConvertibility } from './converters/utils/html.js';
import { absolutizeNodeUrls } from './converters/utils/urls.js';
import { htmlToMd } from './converters/md.js';
import { htmlToMdAndHtml } from './converters/mdAndHtml.js';

/**
 * @typedef {import('./contentUtils.js').ContentResponse} ContentResponse
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
        let frag = document.createDocumentFragment();
        frag.append(document.documentElement.cloneNode(true));

        if (await getSetting('extractMainContent')) {
            frag = await extractMainContent(frag, location);
        }

        await improveConvertibility(frag, location);

        absolutizeNodeUrls(frag, location.href);

        // convert the fragment to a string
        const div = document.createElement('div');
        div.appendChild(frag.cloneNode(true));
        const html = div.innerHTML;

        await sendToNotepad(html);
        return html;
    }

    if (markupLanguage !== 'markdown' && markupLanguage !== 'markdown with some html') {
        console.error(`Unknown markupLanguage: ${markupLanguage}`);
        throw new Error(`Unknown markupLanguage: ${markupLanguage}`);
    }

    const srcMd = await getSourceFormatMd(markupLanguage);
    await sendToNotepad(srcMd);
    return srcMd;
}

/**
 * getSourceFormatMd returns source-formatted markdown of the current page in the user's
 * chosen markup language.
 * @param {string} markupLanguage
 * @returns {Promise<string>}
 */
async function getSourceFormatMd(markupLanguage) {
    // Clone the body so we don't modify the original.
    /** @type {DocumentFragment} */
    let frag = document.createDocumentFragment();
    frag.append(document.body.cloneNode(true));

    if (await getSetting('extractMainContent')) {
        frag = await extractMainContent(frag, location);
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
