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

import * as md from './md.js';

/**
 * createLink creates a link in the given markup language.
 * @param {string} title
 * @param {string} url
 * @param {string} markupLanguage
 * @returns {Promise<string>}
 */
export async function createLink(title, url, markupLanguage) {
    switch (markupLanguage) {
        case 'markdown':
        case 'markdown with some html':
            const mdLink = await md.createLink(title, url);
            return mdLink;
        case 'html':
            title = htmlEncodeText(title);
            const htmlLink = `<a href="${url}">${title}</a>`;
            return htmlLink;
        default:
            console.error(`Unknown markupLanguage: ${markupLanguage}`);
            throw new Error(`Unknown markupLanguage: ${markupLanguage}`);
    }
}

/**
 * htmlEncodeText encodes a string for use in HTML text content.
 * @param {string} str
 * @returns {string}
 */
function htmlEncodeText(str) {
    const div = document.createElement('div');
    div.innerText = div.textContent = str;
    str = div.innerHTML
        .replaceAll(/"/g, '&quot;')
        .replaceAll(/'/g, '&#39;')
    return str;
}
