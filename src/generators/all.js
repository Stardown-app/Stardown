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
            return await md.createLink(title, url);
        case 'html':
            title = htmlEncodeText(title);
            return `<a href="${url}">${title}</a>`;
        default:
            console.error(`Unknown markupLanguage: ${markupLanguage}`);
            throw new Error(`Unknown markupLanguage: ${markupLanguage}`);
    }
}

/**
 * createImage creates an image in the given markup language.
 * @param {string} url
 * @param {string} markupLanguage
 * @returns {Promise<string>}
 */
export async function createImage(url, markupLanguage) {
    switch (markupLanguage) {
        case 'markdown':
        case 'markdown with some html':
            return await md.createImage(url) + '\n';
        case 'html':
            return `<img src="${url}">`;
        default:
            console.error('Unknown markup language:', markupLanguage);
            throw new Error('Unknown markup language:', markupLanguage);
    }
}

/**
 * createVideo creates a video in the given markup language.
 * @param {string} srcUrl
 * @param {string} pageUrl
 * @param {string} markupLanguage
 * @returns {Promise<string>}
 */
export async function createVideo(srcUrl, pageUrl, markupLanguage) {
    switch (markupLanguage) {
        case 'markdown':
        case 'markdown with some html':
            return await md.createVideo(srcUrl, pageUrl) + '\n';
        case 'html':
            const usingSrcUrl = srcUrl && !srcUrl.startsWith('blob:');
            const url = usingSrcUrl ? srcUrl : pageUrl;
            return `<video src="${url}">`;
        default:
            console.error('Unknown markup language:', markupLanguage);
            throw new Error('Unknown markup language:', markupLanguage);
    }
}

/**
 * createAudio creates audio in the given markup language.
 * @param {string} srcUrl
 * @param {string} pageUrl
 * @param {string} markupLanguage
 * @returns {Promise<string>}
 */
export async function createAudio(srcUrl, pageUrl, markupLanguage) {
    switch (markupLanguage) {
        case 'markdown':
        case 'markdown with some html':
            return await md.createAudio(srcUrl, pageUrl) + '\n';
        case 'html':
            const usingSrcUrl = srcUrl && !srcUrl.startsWith('blob:');
            const url = usingSrcUrl ? srcUrl : pageUrl;
            return `<audio controls src="${url}">`;
        default:
            console.error('Unknown markup language:', markupLanguage);
            throw new Error('Unknown markup language:', markupLanguage);
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
