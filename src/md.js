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

import { getSetting, replaceBrackets } from './common.js';

/**
 * escape escapes some (not all!) markdown characters in a string. This function is
 * useful for markdown link titles and blockquotes. It does not escape square brackets,
 * among other characters.
 * @param {string} text - the text to escape markdown characters in.
 * @returns {Promise<string>}
 */
export async function escape(text) {
    return text
        .replaceAll('>', '\\>')
        .replaceAll('<', '\\<')
        .replaceAll('#', '\\#')
        .replaceAll('_', '\\_')
        .replaceAll('*', '\\*')
        .replaceAll('`', '\\`')
}

/**
 * createLink creates a markdown link.
 * @param {string} title - the title of the link.
 * @param {string} url - the URL of the link.
 * @returns {Promise<string>}
 */
export async function createLink(title, url) {
    const subBrackets = await getSetting('subBrackets', 'underlined');
    title = await replaceBrackets(title, subBrackets);
    title = await escape(title);

    url = url.replaceAll('(', '%28').replaceAll(')', '%29');

    return `[${title}](${url})`;
}

/**
 * createBlockquote creates a markdown blockquote with a link at the end.
 * @param {string} text - the text of the blockquote.
 * @param {string} title - the title of the link.
 * @param {string} url - the URL of the link.
 * @returns {Promise<string>}
 */
export async function createBlockquote(text, title, url) {
    text = await escape(text.replaceAll('[', '\\['));
    text = text.replaceAll('\n', '\n> ');

    const subBrackets = await getSetting('subBrackets', 'underlined');
    title = await replaceBrackets(title, subBrackets);
    title = await escape(title);

    url = url.replaceAll('(', '%28').replaceAll(')', '%29');

    return `> ${text}\n> \n> — [${title}](${url})\n`;
}

/**
 * createImage creates markdown of an image.
 * @param {string} url - the URL of the image.
 * @returns {Promise<string>}
 */
export async function createImage(url) {
    let fileName = url.split('/').pop();
    const subBrackets = await getSetting('subBrackets', 'underlined');
    fileName = await replaceBrackets(fileName, subBrackets);
    fileName = await escape(fileName);

    url = url.replaceAll('(', '%28').replaceAll(')', '%29');

    return `![${fileName}](${url})`;
}

/**
 * createMedia creates markdown for video or audio. For rendering purposes, the
 * resulting markdown will only start with an exclamation mark if the page URL is used.
 * @param {string} altText - a description of the media to use in the markdown link.
 * This function assumes the alt text is already markdown-escaped.
 * @param {string} srcUrl - the URL of the media. If this is falsy or starts with
 * `blob:`, the page URL is used instead.
 * @param {string} pageUrl - the URL of the page the media is on. This is used only if
 * the source URL is falsy or starts with `blob:`.
 * @returns {Promise<string>}
 */
export async function createMedia(altText, srcUrl, pageUrl) {
    if (srcUrl && !srcUrl.startsWith('blob:')) {
        srcUrl = srcUrl.replaceAll('(', '%28').replaceAll(')', '%29');
        return `[${altText}](${srcUrl})`;
    } else {
        pageUrl = pageUrl.replaceAll('(', '%28').replaceAll(')', '%29');
        return `![${altText}](${pageUrl})`;
    }
}

/**
 * createTabLink creates a markdown link for a tab. Stardown does not add to, or remove
 * from, the link any HTML element ID or text fragment. The tab title is used as the
 * link title.
 * @param {any} tab - the tab to create the link from.
 * @param {boolean} subBrackets - the setting for what to substitute any square brackets
 * with.
 * @returns {Promise<string>} - a Promise that resolves to the markdown link.
 */
export async function createTabLink(tab, subBrackets) {
    if (tab.title === undefined) {
        console.error('tab.title is undefined');
        throw new Error('tab.title is undefined');
        // Were the necessary permissions granted?
    }

    let title = await replaceBrackets(tab.title, subBrackets);
    title = await escape(title);

    const url = tab.url.replaceAll('(', '%28').replaceAll(')', '%29');

    return `[${title}](${url})`;
}
