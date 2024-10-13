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
    let newFrag = null;
    if (location.href.match(/^https:\/\/(?:[^\.]+\.)?wikipedia\.org\/wiki\/.*/)) {
        newFrag = extractWikipediaArticle(frag);
    } else if (location.href.match(/^https:\/\/github\.com\/[^/]+\/[^/]+\/issues\/\d+/)) {
        newFrag = extractGithubIssue(frag);
    }
    if (newFrag) {
        return newFrag;
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

    console.error('Failed to extract the main content of the page');
    frag.append(doc.body);
    return frag;
}

/**
 * @param {DocumentFragment} frag
 * @returns {DocumentFragment|null}
 */
function extractWikipediaArticle(frag) {
    console.log('Extracting Wikipedia article');
    const firstHeading = frag.querySelector('#firstHeading');
    const content = frag.querySelector('#mw-content-text');
    if (!firstHeading || !content) {
        console.error('Wikipedia article extractor outdated');
        return null;
    }

    content.querySelectorAll('.navbox,.mw-editsection').forEach(el => el.remove());

    const newFrag = new DocumentFragment();
    newFrag.append(firstHeading, content);
    return newFrag;
}

/**
 * @param {DocumentFragment} frag
 * @returns {DocumentFragment|null}
 */
function extractGithubIssue(frag) {
    console.log('Extracting GitHub issue');
    const title = frag.querySelector('.gh-header-title');
    const content = frag.querySelector('.js-quote-selection-container');
    if (!title || !content) {
        console.error('GitHub issue extractor outdated');
        return null;
    }

    const toRemove = [
        'img',
        'form',
        'button',
        'reactions-menu',
        '.js-minimize-comment',
        'tool-tip',
        '.tooltipped',
        'dialog',
        'dialog-helper',
        '.js-comment-edit-history',
        '.Details-content--hidden',
        '.discussion-timeline-actions',
        'div.text-right code',
    ];
    content.querySelectorAll(toRemove.join(',')).forEach(el => el.remove());

    content.querySelectorAll('table.d-block').forEach(table => {
        table.setAttribute('role', 'presentation');
    });
    content.querySelectorAll('code a').forEach(a => {
        const code = a.parentElement;
        const p = document.createElement('p');
        p.append(a);
        code.replaceWith(p);
    });

    const newFrag = new DocumentFragment();
    newFrag.append(title, content);
    return newFrag;
}
