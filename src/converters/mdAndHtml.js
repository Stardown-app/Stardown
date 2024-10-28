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

import { getSetting } from '../getSetting.js';
import { absolutizeNodeUrls } from './utils/urls.js';
import { removeHiddenElements, removeStyles, isInlineNodes } from './utils/html.js';
import { newEscape, MdConverter } from './md.js';

/**
 * htmlToMdAndHtml converts an HTML fragment to markdown and HTML. Anything that renders
 * well as markdown is converted, and the rest is left as HTML.
 * @param {DocumentFragment} frag
 * @returns {Promise<string>}
 */
export async function htmlToMdAndHtml(frag) {
    const omitHidden = await getSetting('omitHidden');
    if (omitHidden) {
        removeHiddenElements(frag, document);
    }
    removeStyles(frag);
    absolutizeNodeUrls(frag, location.href);

    const ctx = {
        locationHref: location.href,
        document: document,
        omitNav: await getSetting('omitNav'),
        omitFooter: await getSetting('omitFooter'),
        indent: '',

        mdSubBrackets: await getSetting('mdSubBrackets'),
        mdBulletPoint: await getSetting('mdBulletPoint'),
        mdYoutube: await getSetting('mdYoutube'),
    };

    /** @type {function(string): string} */
    ctx.escape = newEscape(ctx.mdSubBrackets);

    if (isInlineNodes(frag.childNodes)) {
        ctx.dontTrimText = true;
    }

    return mdAndHtmlConverter
        .convertNodes(ctx, frag.childNodes)
        .trim()
        .replaceAll(/\n{3,}/g, '\n\n')
        + '\n';
}

/**
 * @typedef {function(object, Element): string} ElementConverter
 */

export class MdAndHtmlConverter extends MdConverter {
    // [HTML elements reference | MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element)

    constructor() {
        super();
    }

    /** @type {ElementConverter} */
    convertFIGURE(ctx, el) {
        return '\n\n' + el.outerHTML + '\n\n';
    }

    /** @type {ElementConverter} */
    convertCITE(ctx, el) {
        return el.outerHTML;
    }

    /** @type {ElementConverter} */
    convertSMALL(ctx, el) {
        return el.outerHTML;
    }

    /** @type {ElementConverter} */
    convertSUB(ctx, el) {
        return el.outerHTML;
    }

    /** @type {ElementConverter} */
    convertSUP(ctx, el) {
        return el.outerHTML;
    }

    /** @type {ElementConverter} */
    convertU(ctx, el) {
        return el.outerHTML;
    }

    /** @type {ElementConverter} */
    convertAUDIO(ctx, el) {
        return '\n\n' + el.outerHTML + '\n\n';
    }

    /** @type {ElementConverter} */
    convertIMG(ctx, el) {
        return '\n\n' + el.outerHTML + '\n\n';
    }

    /** @type {ElementConverter} */
    convertVIDEO(ctx, el) {
        return '\n\n' + el.outerHTML + '\n\n';
    }

    /** @type {ElementConverter} */
    convertEMBED(ctx, el) {
        return '\n\n' + el.outerHTML + '\n\n';
    }

    // GitHub Flavored Markdown does not render iframes and Readability.js removes
    // iframes. Sample iframe: https://www.w3schools.com/html/html_iframe.asp
    // /** @type {ElementConverter} */
    // convertIFRAME(ctx, el) {
    //     return '\n\n' + el.outerHTML + '\n\n';
    // }

    /** @type {ElementConverter} */
    convertOBJECT(ctx, el) {
        return '\n\n' + el.outerHTML + '\n\n';
    }

    /** @type {ElementConverter} */
    convertPICTURE(ctx, el) {
        return '\n\n' + el.outerHTML + '\n\n';
    }

    /** @type {ElementConverter} */
    convertPORTAL(ctx, el) {
        return '\n\n' + el.outerHTML + '\n\n';
    }

    /** @type {ElementConverter} */
    convertSVG(ctx, el) {
        return '\n\n' + el.outerHTML + '\n\n';
    }

    /** @type {ElementConverter} */
    convertMATH(ctx, el) {
        return el.outerHTML;
    }

    /** @type {ElementConverter} */
    convertCANVAS(ctx, el) {
        return '\n\n' + el.outerHTML + '\n\n';
    }

    /** @type {ElementConverter} */
    convertTABLE(ctx, el) {
        return '\n\n' + el.outerHTML + '\n\n';
    }

    /** @type {ElementConverter} */
    convertMETER(ctx, el) {
        return '\n\n' + el.outerHTML + '\n\n';
    }

    /** @type {ElementConverter} */
    convertDETAILS(ctx, el) {
        return '\n\n' + el.outerHTML + '\n\n';
    }
}

const mdAndHtmlConverter = new MdAndHtmlConverter();
