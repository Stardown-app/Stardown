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

import { Readability } from './Readability.js';
import { isProbablyReaderable } from './Readability-readerable.js'

/**
 * extractMainContent attempts to remove from a document fragment all elements that are
 * not part of the main content.
 * @param {DocumentFragment} frag
 * @param {Location} location
 * @returns {Promise<DocumentFragment>}
 */
export async function extractMainContent(frag, location) {
    if (location.href.match(/^https:\/\/(?:[^\.]+\.)?wikipedia\.org\/wiki\/.*/)) {
        console.log('Extracting the main content of the Wikipedia page');
        const firstHeading = frag.querySelector('#firstHeading');
        const content = frag.querySelector('#mw-content-text');
        if (firstHeading && content) {
            content.querySelector('.navbox')?.remove();

            frag = new DocumentFragment();
            frag.append(firstHeading, content);
            return frag;
        }
    }

    const doc = document.implementation.createHTMLDocument();
    doc.body.append(frag); // this empties frag

    // https://github.com/mozilla/readability
    if (isProbablyReaderable(doc)) {
        console.log('Using Readability.js to extract the main content of the page');

        const article = new Readability(doc).parse();
        const htmlStr = article.content;

        const div = document.createElement('div');
        div.innerHTML = htmlStr;

        frag.append(div);
        return frag;
    }

    console.log('Not attempting to extract the main content of the page');
    frag.append(doc.body);
    return frag;
}
