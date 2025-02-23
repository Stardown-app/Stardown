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

import { getSetting } from '../getSetting.js';
import { mdEncodeUri, newEscape } from '../converters/md.js';

/**
 * createLink creates a markdown link.
 * @param {string|null} title - the title of the link. Square brackets are replaced,
 * escaped, or unchanged depending on the settings. Some other markdown characters are
 * escaped. If the given title is null, it is replaced with 'link'.
 * @param {string} uri - the URI of the link. Parentheses are URL-encoded.
 * @param {string|null} mdSubBrackets - the setting for what to substitute any square
 * brackets with. If not given, the setting is read from storage.
 * @returns {Promise<string>}
 */
export async function createLink(title, uri, mdSubBrackets = null) {
    if (!title) {
        title = uri;
    }
    title = await createLinkTitle(title, mdSubBrackets);

    uri = mdEncodeUri(uri);

    return '[' + title + '](' + uri + ')';
}

/**
 * createLinkTitle creates a markdown link title.
 * @param {string|null} title - the title of the link. Any square brackets are replaced,
 * escaped, or unchanged depending on the settings. Some other markdown characters are
 * escaped. If the given title is null, it is replaced with 'link'.
 * @param {string|null} mdSubBrackets - the setting for what to substitute any square
 * brackets with. If not given, the setting is read from storage.
 * @returns {Promise<string>}
 */
export async function createLinkTitle(title, mdSubBrackets = null) {
    if (mdSubBrackets === null) {
        mdSubBrackets = await getSetting('mdSubBrackets');
    }

    if (title === null) {
        title = 'link';
    } else {
        const escape = newEscape(mdSubBrackets);
        title = escape(title);
    }

    return title;
}

/**
 * createAlert creates a markdown alert (a.k.a. callout). More details:
 * - https://github.com/orgs/community/discussions/16925
 * - https://gohugo.io/render-hooks/blockquotes/#alerts
 * - https://help.obsidian.md/Editing+and+formatting/Callouts
 * @param {'note'|'tip'|'important'|'warning'|'caution'} type - the alert's type.
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
    body = body.trim().replaceAll('\n', '\n> ');
    const link = await createLink(title, url);
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    return `> ${body}\n> \n> — ${link} on ${year}/${month}/${day}`;
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
    const mdYoutube = await getSetting('mdYoutube');

    if (isYoutube && mdYoutube === 'GitHub') {
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
 * @param {string} mdSubBrackets - the setting for what to substitute any square
 * brackets with.
 * @returns {Promise<string>} - a Promise that resolves to the markdown link.
 */
export async function createTabLink(tab, mdSubBrackets) {
    if (tab.title === undefined) {
        console.error('tab.title is undefined');
        throw new Error('tab.title is undefined');
        // Were the necessary permissions granted?
    }

    return await createLink(tab.title, tab.url, mdSubBrackets);
}
