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

import { getSetting } from './common.js';
import { TurndownService } from './turndown.js';
import { newTurndownService, replaceBrackets } from './newTurndownService.js';

/**
 * turndownService is a TurndownService instance used to convert HTML to markdown (or
 * another plaintext format). Use the exported htmlToPlaintext async function to convert
 * HTML to markdown (or another plaintext format).
 * @type {TurndownService|null}
 */
let turndownService = null;

/**
 * The current* variables are used by the htmlToPlaintext function to detect changes to
 * the settings to update the TurndownService instance when needed.
 */
let currentBulletPoint = '-';
let currentSubBrackets = 'underlined';
let currentSelectionFormat = 'source with link';
let currentOmitNav = true;
let currentOmitFooter = true;

/**
 * escape escapes many markdown patterns, but not square brackets.
 * @param {string} text - the text to escape markdown characters in.
 * @returns {string}
 */
export function escape(text) {
    return text
        .replaceAll('\\', '\\\\')
        .replaceAll('#', '\\#')
        .replaceAll('_', '\\_')
        .replaceAll('*', '\\*')
        .replaceAll('`', '\\`')
        .replaceAll(/^>/g, '\\>')
        .replaceAll(/^-/g, '\\-')
        .replaceAll(/^\+ /g, '\\+ ')
        .replaceAll(/^(=+)/g, '\\$1')
        .replaceAll(/^~~~/g, '\\~~~')
        .replaceAll(/^(\d+)\. /g, '$1\\. ')
}

/**
 * htmlToPlaintext converts HTML to markdown (or another plaintext format).
 * @param {string|HTMLElement} html - the HTML to convert to markdown.
 * @returns {Promise<string>}
 */
export async function htmlToPlaintext(html) {
    const newBulletPoint = await getSetting('bulletPoint');
    const newSubBrackets = await getSetting('subBrackets');
    const newSelectionFormat = await getSetting('selectionFormat');
    const newOmitNav = await getSetting('omitNav');
    const newOmitFooter = await getSetting('omitFooter');

    if (
        !turndownService ||
        newBulletPoint !== currentBulletPoint ||
        newSubBrackets !== currentSubBrackets ||
        newSelectionFormat !== currentSelectionFormat ||
        newOmitNav !== currentOmitNav ||
        newOmitFooter !== currentOmitFooter
    ) {
        currentBulletPoint = newBulletPoint;
        currentSubBrackets = newSubBrackets;
        currentSelectionFormat = newSelectionFormat;
        currentOmitNav = newOmitNav;
        currentOmitFooter = newOmitFooter;

        turndownService = newTurndownService(
            currentBulletPoint,
            currentSubBrackets,
            currentSelectionFormat,
            currentOmitNav,
            currentOmitFooter,
            escape,
        );
    }

    return turndownService.turndown(html);
}

/**
 * createLink creates a markdown link.
 * @param {string|null} title - the title of the link. Square brackets are replaced,
 * escaped, or unchanged depending on the settings. Some other markdown characters are
 * escaped. If the given title is null, it is replaced with 'link'.
 * @param {string} url - the URL of the link. Parentheses are URL-encoded.
 * @param {string|null} subBrackets - the setting for what to substitute any square
 * brackets with. If not given, the setting is read from storage.
 * @returns {Promise<string>}
 */
export async function createLink(title, url, subBrackets = null) {
    title = await createLinkTitle(title, subBrackets);

    url = url.replaceAll('(', '%28').replaceAll(')', '%29');

    return `[${title}](${url})`;
}

/**
 * createLinkTitle creates a markdown link title.
 * @param {string|null} title - the title of the link. Square brackets are replaced,
 * escaped, or unchanged depending on the settings. Some other markdown characters are
 * escaped. If the given title is null, it is replaced with 'link'.
 * @param {string|null} subBrackets - the setting for what to substitute any square
 * brackets with. If not given, the setting is read from storage.
 * @returns {Promise<string>}
 */
export async function createLinkTitle(title, subBrackets = null) {
    if (subBrackets === null) {
        subBrackets = await getSetting('subBrackets');
    }

    if (title === null) {
        title = 'link';
    } else {
        title = replaceBrackets(title, subBrackets);
        title = title
            .replaceAll('\\', '\\\\')
            .replaceAll('#', '\\#')
            .replaceAll('_', '\\_')
            .replaceAll('*', '\\*')
            .replaceAll('`', '\\`')
            .replaceAll('>', '\\>')
            .replaceAll(' ', '')
    }

    return title;
}

/**
 * createAlert creates a markdown alert. GitHub and Obsidian use the same format, but
 * GitHub supports only specific alert types: note, tip, important, warning, and
 * caution. More details here: https://github.com/orgs/community/discussions/16925.
 * Obsidian calls these callouts
 * https://help.obsidian.md/Editing+and+formatting/Callouts.
 * @param {string} type - the alert's type.
 * @param {string} text - the alert's text.
 * @returns {Promise<string>}
 */
export async function createAlert(type, text) {
    let alert = '> [!' + type + ']';
    if (text) {
        alert += '\n> ' + text.replaceAll('\n', '\n> ');
    }

    return alert;
}

/**
 * createBlockquote creates a markdown blockquote with a link at the end.
 * @param {string} body - the body of the blockquote.
 * @param {string} title - the title of the link.
 * @param {string} url - the URL of the link.
 * @returns {Promise<string>}
 */
export async function createBlockquote(body, title, url) {
    body = body.replaceAll('\n', '\n> ');
    const link = await createLink(title, url);
    return `> ${body}\n> \n> — ${link}`;
}

/**
 * createImage creates markdown of an image.
 * @param {string} url - the URL of the image.
 * @returns {Promise<string>}
 */
export async function createImage(url) {
    const fileName = url.split('/').pop() || 'image';
    const link = await createLink(fileName, url);
    return '!' + link;
}

/**
 * createVideo creates markdown of a video. The source URL is used if and only if it's
 * truthy and does not start with `blob:`. For rendering purposes, the resulting
 * markdown will only start with an exclamation mark if the page URL is used.
 * @param {string} srcUrl - the URL of the video.
 * @param {string} pageUrl - the URL of the page the video is on.
 * @returns {Promise<string>}
 */
export async function createVideo(srcUrl, pageUrl) {
    const usingSrcUrl = srcUrl && !srcUrl.startsWith('blob:');
    const url = usingSrcUrl ? srcUrl : pageUrl;

    let youtubeId; // TODO
    let isYoutube = false; // TODO
    const youtubeMd = await getSetting('youtubeMd');

    if (isYoutube && youtubeMd === 'GitHub') {
        // TODO: use fwd-microservice
    } else {
        const link = await createLink('video', url);
        if (usingSrcUrl) {
            return link;
        } else {
            return '!' + link;
        }
    }
}

/**
 * createAudio creates markdown of audio. The source URL is used if and only if it's
 * truthy and does not start with `blob:`.
 * @param {string} srcUrl - the URL of the audio.
 * @param {string} pageUrl - the URL of the page the audio is on.
 * @returns {Promise<string>}
 */
export async function createAudio(srcUrl, pageUrl) {
    const usingSrcUrl = srcUrl && !srcUrl.startsWith('blob:');
    const url = usingSrcUrl ? srcUrl : pageUrl;
    return await createLink('audio', url);
}

/**
 * createTabLink creates a markdown link for a tab. Stardown does not add to, or remove
 * from, the link any HTML element ID or text fragment. The tab title is used as the
 * link title.
 * @param {any} tab - the tab to create the link from.
 * @param {string} subBrackets - the setting for what to substitute any square brackets
 * with.
 * @returns {Promise<string>} - a Promise that resolves to the markdown link.
 */
export async function createTabLink(tab, subBrackets) {
    if (tab.title === undefined) {
        console.error('tab.title is undefined');
        throw new Error('tab.title is undefined');
        // Were the necessary permissions granted?
    }

    return await createLink(tab.title, tab.url, subBrackets);
}
