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

import { browser } from './browserSpecific.js';
import { Readability } from './Readability.js';
import { isProbablyReaderable } from './Readability-readerable.js'

/**
 * sendToNotepad sends text to Stardown's sidebar notepad to be inserted.
 * @param {string} text
 * @returns {Promise<void>}
 */
export async function sendToNotepad(text) {
    browser.runtime.sendMessage({
        destination: 'sidebar',
        category: 'sendToNotepad',
        text: text,
    });
}

/**
 * applyTemplate applies a template to a title, URL, and text.
 * @param {string} template
 * @param {string} title
 * @param {string} url
 * @param {string} text
 * @returns {Promise<string>}
 */
export async function applyTemplate(template, title, url, text) {
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
 * readabilitize attempts to remove from a document fragment all elements that are not
 * part of the main content.
 * @param {DocumentFragment} frag
 * @returns {Promise<DocumentFragment>}
 */
export async function readabilitize(frag) {
    const doc = document.implementation.createHTMLDocument();
    doc.body.append(frag); // this empties frag

    if (!isProbablyReaderable(doc)) {
        console.log('This page is probably not readerable, so Readability.js will not be used.');
        frag = doc.createDocumentFragment();
        frag.append(doc.body);
        return frag;
    }

    const article = new Readability(doc).parse();
    const htmlStr = article.content;

    const div = document.createElement('div');
    div.innerHTML = htmlStr;

    frag = document.createDocumentFragment();
    frag.append(div);

    return frag;
}
