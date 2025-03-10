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

/**
 * absolutize makes a URL absolute. If the URL is already absolute, it is returned
 * unchanged.
 * @param {string} url
 * @param {string} locationHref
 * @returns {string}
 */
export function absolutize(url, locationHref) {
    if (url === "" || url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }
    const locationUrl = new URL(locationHref);
    return new URL(url, locationUrl).toString();
}

/**
 * absolutizeNodeUrls makes URLs in a node and its children absolute.
 * @param {Node} node
 * @param {string} locationHref
 * @returns {void}
 */
export function absolutizeNodeUrls(node, locationHref) {
    const hrefEls = node.querySelectorAll("[href]");
    for (let i = 0; i < hrefEls.length; i++) {
        const hrefEl = hrefEls[i];
        if (hrefEl.href) {
            hrefEl.href = absolutize(hrefEl.href, locationHref);
        }
    }

    const srcEls = node.querySelectorAll("[src]");
    for (let i = 0; i < srcEls.length; i++) {
        const srcEl = srcEls[i];
        if (srcEl.src) {
            srcEl.src = absolutize(srcEl.src, locationHref);
        }
    }
}
