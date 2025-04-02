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

import { Readability } from "./Readability.js";
import { isProbablyReaderable } from "./Readability-readerable.js";

/**
 * extractMainContent attempts to remove from a document fragment all elements that are
 * not part of the main content.
 * @param {DocumentFragment} frag
 * @param {Location} location
 * @returns {Promise<DocumentFragment>}
 */
export async function extractMainContent(frag, location) {
    // prevent extraction of main content for certain sites
    if (location.hostname === "news.ycombinator.com") {
        // Readability.js would remove all HN comments
        return frag;
    }

    let newFrag = null;
    if (
        location.href.match(/^https:\/\/(?:[^\/]+\.)?wikipedia\.org\/wiki\/.*/)
    ) {
        newFrag = extractWikipediaArticle(frag);
    } else if (
        location.href.match(/^https:\/\/github\.com\/[^/]+\/[^/]+\/issues\/\d+/)
    ) {
        newFrag = extractGithubIssue(frag);
    } else if (location.href.match(/^https:\/\/mastodon.social\/.+/)) {
        newFrag = extractMastodonPage(frag);
    } else if (location.href.match(/^https:\/\/discord.com\/channels\/.+/)) {
        newFrag = extractDiscordPage(frag);
    } else if (location.href.match(/^https:\/\/www.reddit.com(?:\/.+)?/)) {
        newFrag = extractRedditPage(frag);
    }
    if (newFrag) {
        return newFrag;
    }

    const doc = document.implementation.createHTMLDocument();
    doc.body.append(frag); // this empties frag

    // https://github.com/mozilla/readability
    if (isProbablyReaderable(doc)) {
        console.log(
            "Using Readability.js to extract the main content of the page",
        );

        const article = new Readability(doc, { keepClasses: true }).parse();
        const htmlStr = article.content;

        const div = document.createElement("div");
        div.innerHTML = htmlStr;

        frag.append(div);
        return frag;
    }

    console.warn("Failed to extract the main content of the page");
    frag.append(doc.body);
    return frag;
}

/**
 * @param {DocumentFragment} frag
 * @returns {DocumentFragment|null}
 */
function extractWikipediaArticle(frag) {
    console.log("Extracting Wikipedia article");
    const firstHeading = frag.querySelector("#firstHeading");
    const content = frag.querySelector("#mw-content-text");
    if (!firstHeading || !content) {
        console.error("Wikipedia article extractor outdated");
        return null;
    }

    const toRemove = [
        ".navbox",
        ".mw-editsection",
        "span.citation-comment",
    ];
    content.querySelectorAll(toRemove.join(",")).forEach((el) => el.remove());

    const newFrag = new DocumentFragment();
    newFrag.append(firstHeading, content);
    return newFrag;
}

/**
 * @param {DocumentFragment} frag
 * @returns {DocumentFragment|null}
 */
function extractGithubIssue(frag) {
    console.log("Extracting GitHub issue");
    const title = frag.querySelector("div[data-testid=issue-header]");
    const content = frag.querySelector("div[data-testid=issue-viewer-issue-container]").parentElement;
    if (!title || !content) {
        console.error("GitHub issue extractor outdated");
        return null;
    }

    const toRemove = [
        "img",
        "form",
        "button",
        "tool-tip",
        "dialog",
        "dialog-helper",
    ];
    content.querySelectorAll(toRemove.join(",")).forEach((el) => el.remove());

    content.querySelectorAll("table.d-block").forEach((table) => {
        table.setAttribute("role", "presentation");
    });

    const newFrag = new DocumentFragment();
    newFrag.append(title, content);
    return newFrag;
}

/**
 * @param {DocumentFragment} frag
 * @returns {DocumentFragment|null}
 */
function extractMastodonPage(frag) {
    console.log("Extracting Mastodon page");
    const content = frag.querySelector("div.scrollable");
    if (!content) {
        console.error("Mastodon extractor outdated");
        return null;
    }

    const newFrag = new DocumentFragment();
    newFrag.append(content);
    return newFrag;
}

/**
 * @param {DocumentFragment} frag
 * @returns {DocumentFragment|null}
 */
function extractDiscordPage(frag) {
    console.log("Extracting Discord page");
    const content = frag.querySelector('ol[data-list-id="chat-messages"]');
    if (!content) {
        console.warn(
            "Discord page extractor outdated, or this isn't a chat messages channel",
        );
        return null;
    }

    const newFrag = new DocumentFragment();
    for (let i = 0; i < content.childNodes.length; i++) {
        newFrag.appendChild(content.childNodes[i].cloneNode(true));
    }

    return newFrag;
}

/**
 * @param {DocumentFragment} frag
 * @returns {DocumentFragment|null}
 */
function extractRedditPage(frag) {
    console.log("Extracting Reddit page");
    const content = frag.querySelector("main");

    const toRemove = [
        "button",
        "shreddit-async-loader",
        "img[role=presentation]",
        "zoomable-img",
    ];
    content.querySelectorAll(toRemove.join(",")).forEach((el) => el.remove());

    const newFrag = new DocumentFragment();
    newFrag.append(content);
    return newFrag;
}
