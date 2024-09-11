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

import { getSetting } from '../common.js';
import * as tables from './utils/tables.js';
import { absolutize } from './utils/urls.js';
import { removeHiddenElements, isInlineText } from './utils/html.js';

// [CommonMark Spec](https://spec.commonmark.org/)
// [commonmark.js demo](https://spec.commonmark.org/dingus/)

/**
 * htmlToMd converts an HTML fragment to pure markdown without any HTML. This function
 * otherwise supports a superset of the CommonMark specification. In rare cases, the
 * output may contain HTML because some sites put sample HTML in code blocks created
 * without <pre> or <code> elements, such as
 * https://www.w3schools.com/html/html_iframe.asp
 * @param {DocumentFragment} frag
 * @returns {Promise<string>}
 */
export async function htmlToMd(frag) {
    const omitHidden = await getSetting('omitHidden');
    if (omitHidden) {
        removeHiddenElements(frag, document);
    }

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

    if (isInlineText(frag.childNodes)) {
        ctx.dontTrimText = true;
    }

    return mdConverter
        .convertNodes(ctx, frag.childNodes)
        .trim()
        .replaceAll(/\n{3,}/g, '\n\n')
        + '\n';
}

/**
 * mdEncodeUri encodes a URI by replacing certain characters with their percent-encoded
 * equivalents.
 * @param {string} uri
 * @returns {string}
 */
export function mdEncodeUri(uri) {
    return uri.replaceAll('(', '%28').replaceAll(')', '%29').replaceAll(' ', '%20');
}

/**
 * newEscape creates a new function for escaping characters.
 * @param {string} mdSubBrackets - the setting for what to substitute any square
 * brackets with.
 * @returns {function(string): string}
 */
export function newEscape(mdSubBrackets) {
    let openSqrRepl, closeSqrRepl;
    switch (mdSubBrackets) {
        case 'underlined':
            openSqrRepl = '⦋';
            closeSqrRepl = '⦌';
            break;
        case 'escaped':
            openSqrRepl = '\\[';
            closeSqrRepl = '\\]';
            break;
        case 'original':
            openSqrRepl = '[';
            closeSqrRepl = ']';
            break;
    }

    /**
     * escape escapes markdown characters in text.
     * @param {string} text
     * @returns {string}
     */
    return function escape(text) {
        return text
            .replaceAll('\\', '\\\\')
            .replaceAll('#', '\\#') // tag, issue, atx header
            .replaceAll('_', '\\_') // italic, horizontal rule
            .replaceAll('*', '\\*') // bullet point, bold, italic, horizontal rule
            .replaceAll('`', '\\`') // code, code fence
            .replaceAll('~', '\\~') // strikethrough, code fence
            .replaceAll(/^> /g, '\\> ') // quote
            .replaceAll(/^(=+)/g, '\\$1') // setext header
            .replaceAll(/^-/g, '\\-') // bullet point, horizontal rule, setext header, YAML front matter fence
            .replaceAll(/^\+/g, '\\+') // bullet point, TOML front matter fence
            .replaceAll(/^(\d+)\. /g, '$1\\. ') // ordered list item
            .replaceAll('[', openSqrRepl) // link, task list item
            .replaceAll(']', closeSqrRepl) // link, task list item
    }
}

// [Node: nodeType property | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType)
const ELEMENT_NODE = 1;
const ATTRIBUTE_NODE = 2;
const TEXT_NODE = 3;
const CDATA_SECTION_NODE = 4;
const ENTITY_REFERENCE_NODE = 5;
const ENTITY_NODE = 6;
const PROCESSING_INSTRUCTION_NODE = 7;
const COMMENT_NODE = 8;
const DOCUMENT_NODE = 9;
const DOCUMENT_TYPE_NODE = 10;
const DOCUMENT_FRAGMENT_NODE = 11;
const NOTATION_NODE = 12;
// `Node.ELEMENT_NODE`, `Node.ATTRIBUTE_NODE`, etc. are not used here because `Node` is
// not defined by Node.js, which is used when running tests.

/**
 * @typedef {function(object, Node): string} NodeConverter
 */

/**
 * @typedef {function(object, Element): string} ElementConverter
 */

export class MdConverter {
    // [HTML elements reference | MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element)

    /**
     * @param {object} ctx
     * @param {Node[]|NodeList|HTMLCollection} nodes
     * @returns {string}
     */
    convertNodes(ctx, nodes) {
        /** @type {string[]} */
        const result = [];
        for (let i = 0; i < nodes.length; i++) {
            result.push(this.convertNode(ctx, nodes[i]));
        }
        return result.join('');
    }

    /** @type {NodeConverter} */
    convertNode(ctx, node) {
        // [Node: nodeType property | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType)
        switch (node.nodeType) {
            case ELEMENT_NODE:
                return this.convertElement(ctx, node);
            case ATTRIBUTE_NODE:
                return '';
            case TEXT_NODE:
                return this.convertText(ctx, node);
            case CDATA_SECTION_NODE:
                return '';
            case ENTITY_REFERENCE_NODE: // deprecated
                return '';
            case ENTITY_NODE: // deprecated
                return '';
            case PROCESSING_INSTRUCTION_NODE:
                return '';
            case COMMENT_NODE:
                return '';
            case DOCUMENT_NODE:
                return this.convertDocument(ctx, node);
            case DOCUMENT_TYPE_NODE:
                return '';
            case DOCUMENT_FRAGMENT_NODE:
                return this.convertDocumentFragment(ctx, node);
            case NOTATION_NODE: // deprecated
                return '';
            default:
                return this.convertNodes(ctx, node.childNodes);
        }
    }

    /** @type {ElementConverter} */
    convertElement(ctx, el) {
        // [Element: tagName property | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/tagName)

        /** @type {ElementConverter} */
        const convert = this['convert' + el.tagName];
        if (convert === undefined) {
            return this.convertNodes(ctx, el.childNodes);
        }
        return convert.call(this, ctx, el);
    }

    /** @type {ElementConverter} */
    convertBlockElement(ctx, el) {
        const newCtx = { ...ctx, dontTrimText: true };

        /** @type {string[]} */
        const result = ['\n\n'];
        result.push(
            this.convertNodes(newCtx, el.childNodes).trim().replaceAll(/\n\s*\n\s*/g, '\n\n')
        );
        if (!ctx.inList) {
            result.push('\n\n');
        }

        return result.join('');
    }

    /** @type {NodeConverter} */
    convertText(ctx, node) {
        if (!node.textContent) {
            return '';
        }

        let content = ctx.escape(node.textContent);
        if (!ctx.dontTrimText) {
            content = content.trim();
        }
        if (!ctx.dontMinimizeWhitespace) {
            content = content.replaceAll(/\s+/g, ' ');
        }

        return content;
    }

    /** @type {NodeConverter} */
    convertDocument(ctx, node) {
        return this.convertNodes(ctx, node.body.childNodes);
    }

    /** @type {NodeConverter} */
    convertDocumentFragment(ctx, node) {
        return this.convertNodes(ctx, node.childNodes);
    }

    /** @type {ElementConverter} */
    convertHTML(ctx, el) {
        const newCtx = { ...ctx }; // prevent mutations of the original context
        return this.convertNodes(newCtx, el.childNodes);
    }

    // document metadata elements

    /** @type {ElementConverter} */
    convertBASE(ctx, el) {
        const href = el.getAttribute('href');
        if (href) {
            ctx.locationHref = href; // mutate the context
        }
    }

    /** @type {ElementConverter} */
    convertHEAD(ctx, el) {
        return '';
    }

    /** @type {ElementConverter} */
    convertLINK(ctx, el) {
        return '';
    }

    /** @type {ElementConverter} */
    convertMETA(ctx, el) {
        return '';
    }

    /** @type {ElementConverter} */
    convertSTYLE(ctx, el) {
        return '';
    }

    /** @type {ElementConverter} */
    convertTITLE(ctx, el) {
        return '';
    }

    // sectioning root elements

    /** @type {ElementConverter} */
    convertBODY(ctx, el) {
        return this.convertNodes(ctx, el.childNodes);
    }

    // content sectioning elements

    /** @type {ElementConverter} */
    convertADDRESS(ctx, el) {
        return this.convertBlockElement(ctx, el);
    }

    /** @type {ElementConverter} */
    convertARTICLE(ctx, el) {
        return this.convertBlockElement(ctx, el);
    }

    /** @type {ElementConverter} */
    convertASIDE(ctx, el) {
        return this.convertBlockElement(ctx, el);
    }

    /** @type {ElementConverter} */
    convertFOOTER(ctx, el) {
        if (ctx.omitFooter) {
            return '';
        }
        return this.convertNodes(ctx, el.childNodes);
    }

    /** @type {ElementConverter} */
    convertHEADER(ctx, el) {
        return this.convertBlockElement(ctx, el);
    }

    /** @type {ElementConverter} */
    newConvertH_(ctx, el) {
        if (ctx.inTable) {
            return this.convertText(ctx, el);
        }

        const newCtx = { ...ctx, dontTrimText: true };

        /** @type {string[]} */
        const result = ['\n\n'];
        for (let i = 0; i < ctx.hn; i++) {
            result.push('#');
        }
        const text = this.convertNodes(newCtx, el.childNodes).trim();
        if (!text) {
            return '';
        }

        result.push(' ' + text.replaceAll('\n', ' '));

        return result.join('') + '\n\n';
    }

    /** @type {ElementConverter} */
    convertH1(ctx, el) {
        const newCtx = { ...ctx, hn: 1 };
        return this.newConvertH_(newCtx, el);
    }

    /** @type {ElementConverter} */
    convertH2(ctx, el) {
        const newCtx = { ...ctx, hn: 2 };
        return this.newConvertH_(newCtx, el);
    }

    /** @type {ElementConverter} */
    convertH3(ctx, el) {
        const newCtx = { ...ctx, hn: 3 };
        return this.newConvertH_(newCtx, el);
    }

    /** @type {ElementConverter} */
    convertH4(ctx, el) {
        const newCtx = { ...ctx, hn: 4 };
        return this.newConvertH_(newCtx, el);
    }

    /** @type {ElementConverter} */
    convertH5(ctx, el) {
        const newCtx = { ...ctx, hn: 5 };
        return this.newConvertH_(newCtx, el);
    }

    /** @type {ElementConverter} */
    convertH6(ctx, el) {
        const newCtx = { ...ctx, hn: 6 };
        return this.newConvertH_(newCtx, el);
    }

    /** @type {ElementConverter} */
    convertHGROUP(ctx, el) {
        return this.convertBlockElement(ctx, el);
    }

    /** @type {ElementConverter} */
    convertMAIN(ctx, el) {
        return this.convertBlockElement(ctx, el);
    }

    /** @type {ElementConverter} */
    convertNAV(ctx, el) {
        if (ctx.omitNav) {
            return '';
        }
        return this.convertNodes(ctx, el.childNodes) + '\n';
    }

    /** @type {ElementConverter} */
    convertSECTION(ctx, el) {
        return this.convertBlockElement(ctx, el);
    }

    /** @type {ElementConverter} */
    convertSEARCH(ctx, el) {
        return this.convertNodes(ctx, el.childNodes);
    }

    // text content elements

    /** @type {ElementConverter} */
    convertBLOCKQUOTE(ctx, el) {
        const newCtx = { ...ctx, dontTrimText: true };

        /** @type {string[]} */
        const result = ['\n\n'];
        if (ctx.inList) {
            result.push('\n\n' + ctx.indent);
        }
        result.push('> ');
        result.push(
            this.convertNodes(newCtx, el.childNodes)
                .trim().replaceAll('\n', '\n>').replaceAll('> \n>\n>', '> ')
        );
        result.push('\n');
        if (!ctx.inList) {
            result.push('\n');
        }

        return result.join('');
    }

    /** @type {ElementConverter} */
    convertDD(ctx, el) {
        const newCtx = { ...ctx, dontTrimText: true };
        const text = this.convertNodes(newCtx, el.childNodes).trim();
        if (!text) {
            return '';
        }

        return ': ' + text.replaceAll('\n', ' ') + '\n';
    }

    /** @type {ElementConverter} */
    convertDIV(ctx, el) {
        return this.convertNodes(ctx, el.childNodes);
    }

    /** @type {ElementConverter} */
    convertDL(ctx, el) {
        const newCtx = { ...ctx, dontTrimText: true };
        return '\n\n' + this.convertNodes(newCtx, el.childNodes) + '\n\n';
    }

    /** @type {ElementConverter} */
    convertDT(ctx, el) {
        const newCtx = { ...ctx, dontTrimText: true };
        return this.convertNodes(newCtx, el.childNodes).replaceAll('\n', ' ') + '\n';
    }

    /** @type {ElementConverter} */
    convertFIGCAPTION(ctx, el) {
        return this.convertBlockElement(ctx, el);
    }

    /** @type {ElementConverter} */
    convertFIGURE(ctx, el) {
        return this.convertBlockElement(ctx, el);
    }

    /** @type {ElementConverter} */
    convertHR(ctx, el) {
        return '\n\n* * *\n\n';
    }

    /** @type {ElementConverter} */
    convertLI(ctx, el) {
        return '';
    }

    /** @type {ElementConverter} */
    convertMENU(ctx, el) {
        return this.convertUL(ctx, el);
    }

    /** @type {ElementConverter} */
    convertOL(ctx, el) {
        /** @type {string[]} */
        const result = ['\n'];
        if (!ctx.inList) {
            result.push('\n');
        }

        const newCtx = {
            ...ctx, indent: ctx.indent + '    ', inList: true, dontTrimText: true,
        };

        let liNum = Number(el.getAttribute('start') || 1);
        const reversed = Boolean(el.getAttribute('reversed'));

        const children = el.childNodes;
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (
                child.nodeType === TEXT_NODE ||
                child.childNodes.length === 0 ||
                child.textContent?.match(/^\s+$/)
            ) {
                continue;
            }

            result.push(ctx.indent + String(liNum) + '. ');
            result.push(
                this.convertNodes(newCtx, child.childNodes)
                    .replace(/^ /, '')
                    .replace(/^\n+/, '')
                    .replace(/ \n/, '\n')
                    .replace(/ $/, '')
            );
            if (!ctx.inList || i < children.length - 2) {
                result.push('\n');
            }

            if (reversed) {
                liNum--;
            } else {
                liNum++;
            }
        }

        if (!ctx.inList) {
            result.push('\n');
        }

        return result.join('');
    }

    /** @type {ElementConverter} */
    convertP(ctx, el) {
        const newCtx = { ...ctx, dontTrimText: true, dontMinimizeWhitespace: true };

        /** @type {string[]} */
        const result = ['\n\n'];
        result.push(
            this.convertNodes(newCtx, el.childNodes).trim().replaceAll(/\n\s+/g, '\n')
        );
        if (!ctx.inList) {
            result.push('\n\n');
        }

        return result.join('');
    }

    /** @type {ElementConverter} */
    convertPRE(ctx, el) {
        if (el.childNodes.length === 0) {
            return '';
        }

        let text = '';
        let language = '';
        if (el.childNodes.length > 1) {
            const result = [];
            for (let i = 0; i < el.childNodes.length; i++) {
                const child = el.childNodes[i];
                const t = child.textContent;
                if (!t) {
                    continue;
                }
                result.push(t.replaceAll('\n\n', ' '));
            }
            if (result.length === 0) {
                return '';
            }
            text = result.join('');
        } else { // if there is only one child
            /** @type {Node} */
            const child = el.firstChild;
            if (child.nodeName === 'SAMP' || child.nodeName === 'KBD') {
                return this.convertCODE(ctx, child);
            }

            text = child.textContent;
            if (!text) {
                return '';
            }

            if (child.getAttribute) { // if the child is not a text node
                const class_ = child.getAttribute('class') || '';
                const languageMatch = class_.match(/language-(\S+)/);
                if (languageMatch) {
                    language = languageMatch[1];
                }
            }
        }

        const result = ['\n\n'];

        if (ctx.inList) {
            result.push('\n\n' + ctx.indent);
        }

        let backtickCount = 3;
        const match = text.match(/(`{3,})/);
        if (match) {
            backtickCount = match[1].length + 1;
        }

        for (let i = 0; i < backtickCount; i++) {
            result.push('`');
        }

        result.push(language + '\n');

        text = text.replaceAll('\n', '\n' + ctx.indent);
        result.push(ctx.indent + text + '\n' + ctx.indent);

        for (let i = 0; i < backtickCount; i++) {
            result.push('`');
        }
        result.push('\n');
        if (!ctx.inList) {
            result.push('\n');
        }

        return result.join('');
    }

    /** @type {ElementConverter} */
    convertUL(ctx, el) {
        /** @type {string[]} */
        const result = ['\n'];
        if (!ctx.inList) {
            result.push('\n');
        }

        const newCtx = {
            ...ctx, indent: ctx.indent + '    ', inList: true, dontTrimText: true,
        };

        const children = el.childNodes;
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (
                child.nodeType === TEXT_NODE ||
                child.childNodes.length === 0 ||
                child.textContent?.match(/^\s+$/)
            ) {
                continue;
            }

            result.push(ctx.indent + ctx.mdBulletPoint + ' ');
            result.push(
                this.convertNodes(newCtx, child.childNodes)
                    .replace(/^ /, '')
                    .replace(/^\n+/, '')
                    .replace(/ \n/, '\n')
                    .replace(/ $/, '')
            );
            if (!ctx.inList || i < children.length - 2) {
                result.push('\n');
            }
        }

        if (!ctx.inList) {
            result.push('\n');
        }

        return result.join('');
    }

    // inline text semantics elements

    /** @type {ElementConverter} */
    convertA(ctx, el) {
        let href = el.getAttribute('href') || '';
        href = absolutize(href, ctx.locationHref);
        href = mdEncodeUri(href);

        let text = this.convertNodes(ctx, el.childNodes).trim().replaceAll('\n', ' ');
        if (!text) {
            return '';
        } else if (!href) {
            return text;
        } else if (text.startsWith('^')) {
            text = '\\^' + text.slice(1);
        }

        const title = ctx.escape(el.getAttribute('title') || '').replaceAll('"', '\\"');

        if (title) {
            return '[' + text + '](' + href + ' "' + title + '")';
        }
        return '[' + text + '](' + href + ')';
    }

    /** @type {ElementConverter} */
    convertABBR(ctx, el) {
        return this.convertNodes(ctx, el.childNodes);
    }

    /** @type {ElementConverter} */
    convertB(ctx, el) {
        return this.convertSTRONG(ctx, el);
    }

    /** @type {ElementConverter} */
    convertBDI(ctx, el) {
        return this.convertNodes(ctx, el.childNodes);
    }

    /** @type {ElementConverter} */
    convertBDO(ctx, el) {
        return this.convertNodes(ctx, el.childNodes);
    }

    /** @type {ElementConverter} */
    convertBR(ctx, el) {
        return '\n';
    }

    /** @type {ElementConverter} */
    convertCITE(ctx, el) {
        return this.convertNodes(ctx, el.childNodes);
    }

    /** @type {ElementConverter} */
    convertCODE(ctx, el) {
        let text = el.textContent;
        if (!text) {
            return '';
        }
        text = text.replaceAll('\n', ' ');

        const result = [];

        let backtickCount = 1;
        const match = text.match(/(`+)/);
        if (match) {
            backtickCount = match[1].length + 1;
        }

        for (let i = 0; i < backtickCount; i++) {
            result.push('`');
        }
        result.push(text);
        for (let i = 0; i < backtickCount; i++) {
            result.push('`');
        }

        return result.join('');
    }

    /** @type {ElementConverter} */
    convertDATA(ctx, el) {
        return this.convertNodes(ctx, el.childNodes);
    }

    /** @type {ElementConverter} */
    convertDFN(ctx, el) {
        return this.convertNodes(ctx, el.childNodes);
    }

    /** @type {ElementConverter} */
    convertEM(ctx, el) {
        if (ctx.inEm) {
            return this.convertNodes(ctx, el.childNodes);
        }
        const newCtx = { ...ctx, inEm: true };

        const text = this.convertNodes(newCtx, el.childNodes).trim();
        if (!text) {
            return '';
        }

        return '*' + text.replaceAll('\n', ' ') + '*';
    }

    /** @type {ElementConverter} */
    convertI(ctx, el) {
        return this.convertEM(ctx, el);
    }

    /** @type {ElementConverter} */
    convertKBD(ctx, el) {
        return this.convertCODE(ctx, el);
    }

    /** @type {ElementConverter} */
    convertMARK(ctx, el) {
        const text = this.convertNodes(ctx, el.childNodes).trim();
        if (!text) {
            return '';
        }

        return '==' + text.replaceAll('\n', ' ') + '==';
    }

    /** @type {ElementConverter} */
    convertQ(ctx, el) {
        if (ctx.inEm) {
            const text = this.convertNodes(ctx, el.childNodes)
                .trim()
                .replaceAll('\n', ' ')
                .replaceAll('"', '\\"')
            return '"' + text + '"';
        }
        const newCtx = { ...ctx, inEm: true };

        const text = this.convertNodes(newCtx, el.childNodes).trim();
        if (!text) {
            return '';
        }

        return '*"' + text.replaceAll('\n', ' ').replaceAll('"', '\\"') + '"*';
    }

    /** @type {ElementConverter} */
    convertRP(ctx, el) {
        return el.textContent;
    }

    /** @type {ElementConverter} */
    convertRT(ctx, el) {
        return el.textContent;
    }

    /** @type {ElementConverter} */
    convertRUBY(ctx, el) {
        return this.convertNodes(ctx, el.childNodes);
    }

    /** @type {ElementConverter} */
    convertS(ctx, el) {
        if (ctx.inS) {
            return this.convertNodes(ctx, el.childNodes);
        }
        const newCtx = { ...ctx, inS: true };

        const text = this.convertNodes(newCtx, el.childNodes).trim();
        if (!text) {
            return '';
        }

        return '~~' + text.replaceAll('\n', ' ').replaceAll('~', '\\~') + '~~';
    }

    /** @type {ElementConverter} */
    convertSAMP(ctx, el) {
        return this.convertCODE(ctx, el);
    }

    /** @type {ElementConverter} */
    convertSMALL(ctx, el) {
        return this.convertNodes(ctx, el.childNodes);
    }

    /** @type {ElementConverter} */
    convertSPAN(ctx, el) {
        return this.convertNodes(ctx, el.childNodes);
    }

    /** @type {ElementConverter} */
    convertSTRONG(ctx, el) {
        if (ctx.inStrong) {
            return this.convertNodes(ctx, el.childNodes);
        }
        const newCtx = { ...ctx, inStrong: true };

        const text = this.convertNodes(newCtx, el.childNodes).trim();
        if (!text) {
            return '';
        }

        return '**' + text.replaceAll('\n', ' ') + '**';
    }

    /** @type {ElementConverter} */
    convertSUB(ctx, el) {
        return this.convertNodes(ctx, el.childNodes);
    }

    /** @type {ElementConverter} */
    convertSUP(ctx, el) {
        return this.convertNodes(ctx, el.childNodes);
    }

    /** @type {ElementConverter} */
    convertTIME(ctx, el) {
        return this.convertNodes(ctx, el.childNodes);
    }

    /** @type {ElementConverter} */
    convertU(ctx, el) {
        return this.convertNodes(ctx, el.childNodes);
    }

    /** @type {ElementConverter} */
    convertVAR(ctx, el) {
        /** @type {string[]} */
        const result = [];

        if (!ctx.inEm) {
            result.push('*');
        }
        if (!ctx.inB) {
            result.push('**');
        }

        const newCtx = { ...ctx, inEm: true, inB: true };
        const text = this.convertNodes(newCtx, el.childNodes).trim();
        if (!text) {
            return '';
        }

        result.push(text.replaceAll('\n', ' '));

        if (!ctx.inB) {
            result.push('**');
        }
        if (!ctx.inEm) {
            result.push('*');
        }

        return result.join('');
    }

    /** @type {ElementConverter} */
    convertWBR(ctx, el) {
        return '';
    }

    // image and multimedia elements

    /** @type {ElementConverter} */
    convertAREA(ctx, el) {
        return '';
    }

    /** @type {ElementConverter} */
    convertAUDIO(ctx, el) {
        let src = el.getAttribute('src');
        if (!src || src.startsWith('blob:')) {
            const sourceEl = el.querySelector('source');
            if (sourceEl) {
                src = sourceEl.getAttribute('src');
            }
        }
        if (!src || src.startsWith('blob:')) {
            if (el.childNodes.length > 0) {
                return this.convertNodes(ctx, el.childNodes);
            }
            src = ctx.locationHref;
        }
        src = absolutize(src, ctx.locationHref);
        src = mdEncodeUri(src);

        return '[audio](' + src + ')';
    }

    /** @type {ElementConverter} */
    convertIMG(ctx, el) {
        const alt = ctx.escape(el.getAttribute('alt') || '').replaceAll('\n', ' ');

        let src = el.getAttribute('src') || '';
        if (!src || src.startsWith('data:')) {
            src = el.getAttribute('data-srcset') || '';
            if (!src) {
                return alt;
            }
        }
        src = absolutize(src, ctx.locationHref);
        src = mdEncodeUri(src);

        const title = ctx.escape(el.getAttribute('title') || '').replaceAll('"', '\\"');

        /** @type {string[]} */
        const result = [];
        if (ctx.inList) {
            result.push('\n\n' + ctx.indent);
        }
        result.push('![' + alt + '](' + src);
        if (title) {
            result.push(' "' + title + '"');
        }
        result.push(')');
        if (ctx.inList) {
            result.push('\n');
        }

        return result.join('');
    }

    /** @type {ElementConverter} */
    convertMAP(ctx, el) {
        return '';
    }

    /** @type {ElementConverter} */
    convertTRACK(ctx, el) {
        const label = ctx.escape(el.getAttribute('label') || 'track');

        let src = el.getAttribute('src');
        if (!src) {
            return label;
        }
        src = absolutize(src, ctx.locationHref);
        src = mdEncodeUri(src);

        return '[' + label + '](' + src + ')';
    }

    /** @type {ElementConverter} */
    convertVIDEO(ctx, el) {
        const src = el.getAttribute('src');
        const usingSrcUrl = src && !src.startsWith('blob:');
        let url = usingSrcUrl ? src : ctx.locationHref;
        url = absolutize(url, ctx.locationHref);
        url = mdEncodeUri(url);

        let youtubeId; // TODO
        let isYoutube = false; // TODO

        if (isYoutube && ctx.mdYoutube === 'GitHub') {
            // TODO: use fwd-microservice
        } else {
            if (usingSrcUrl) {
                return '[video](' + url + ')';
            } else {
                return '![video](' + url + ')';
            }
        }
    }

    // embedded content elements

    /** @type {ElementConverter} */
    convertEMBED(ctx, el) {
        let src = el.getAttribute('src');
        if (!src) {
            return '';
        }
        src = absolutize(src, ctx.locationHref);
        src = mdEncodeUri(src);
        const type = ctx.escape(el.getAttribute('type') || 'embed');
        return '[' + type + '](' + src + ')';
    }

    /** @type {ElementConverter} */
    convertIFRAME(ctx, el) {
        const srcdoc = el.getAttribute('srcdoc');
        if (srcdoc && DOMParser) {
            const doc = new DOMParser().parseFromString(srcdoc, 'text/html');
            // The iframe uses the embedding document's URL as its base URL when
            // resolving any relative URLs.
            return this.convertDocument(ctx, doc);
        }

        let src = el.getAttribute('src');
        if (src && src !== 'about:blank') {
            src = absolutize(src, ctx.locationHref);
            src = mdEncodeUri(src);
            const title = ctx.escape(
                el.getAttribute('title') ||
                el.getAttribute('name') ||
                el.getAttribute('id') ||
                'iframe'
            );
            return '[' + title + '](' + src + ')';
        }

        return '';
    }

    /** @type {ElementConverter} */
    convertOBJECT(ctx, el) {
        let data = el.getAttribute('data');
        if (data) {
            data = absolutize(data, ctx.locationHref);
            data = mdEncodeUri(data);
            const type = ctx.escape(el.getAttribute('type') || 'object');
            return '[' + type + '](' + data + ')';
        }
        return this.convertNodes(ctx, el.childNodes);
    }

    /** @type {ElementConverter} */
    convertPICTURE(ctx, el) {
        return this.convertNodes(ctx, el.childNodes);
    }

    /** @type {ElementConverter} */
    convertPORTAL(ctx, el) {
        let src = el.getAttribute('src');
        if (!src) {
            return '';
        }
        src = absolutize(src, ctx.locationHref);
        src = mdEncodeUri(src);
        const id = ctx.escape(el.getAttribute('id') || 'portal');
        return '[' + id + '](' + src + ')';
    }

    /** @type {ElementConverter} */
    convertSOURCE(ctx, el) {
        return '';
    }

    // SVG and MathMl elements

    /** @type {ElementConverter} */
    convertSVG(ctx, el) {
        return '';
    }

    /** @type {ElementConverter} */
    convertMATH(ctx, el) {
        return '';
    }

    // scripting elements

    /** @type {ElementConverter} */
    convertCANVAS(ctx, el) {
        return '';
    }

    /** @type {ElementConverter} */
    convertNOSCRIPT(ctx, el) {
        return '';
    }

    /** @type {ElementConverter} */
    convertSCRIPT(ctx, el) {
        return '';
    }

    // demarcating edits elements

    /** @type {ElementConverter} */
    convertDEL(ctx, el) {
        return this.convertS(ctx, el);
    }

    /** @type {ElementConverter} */
    convertINS(ctx, el) {
        return this.convertNodes(ctx, el.childNodes);
    }

    // table content elements

    /** @type {ElementConverter} */
    convertCAPTION(ctx, el) {
        return this.convertBlockElement(ctx, el);
    }

    /** @type {ElementConverter} */
    convertCOL(ctx, el) {
        return '';
    }

    /** @type {ElementConverter} */
    convertCOLGROUP(ctx, el) {
        return '';
    }

    /** @type {ElementConverter} */
    convertTABLE(ctx, el) {
        if (ctx.inTable) {
            return this.convertText(ctx, el);
        } else if (el.getAttribute('role') === 'presentation') {
            return this.convertNodes(ctx, el.childNodes);
        }
        const newCtx = { ...ctx, inTable: true, dontTrimText: true };

        /** @type {string[]} */
        let result = ['\n\n'];

        const caption = el.querySelector('caption');
        if (caption) {
            result.push(this.convertSTRONG(ctx, caption) + '\n\n');
        }

        /** @type {Element[][]} */
        let table2d = tables.to2dArray(el, ctx.document);
        table2d = tables.removeEmptyRows(table2d);
        table2d = tables.rectangularize(table2d, ctx.document);

        // for each row
        for (let y = 0; y < table2d.length; y++) {
            const row = table2d[y];
            result.push('|');

            // for each cell
            for (let x = 0; x < row.length; x++) {
                const cell = row[x]; // a `<th>` or `<td>` element
                const cellStr = this.convertNodes(newCtx, cell.childNodes)
                    .trim().replaceAll(/\s+/g, ' ').replaceAll('|', '\\|');
                result.push(` ${cellStr} |`);
            }

            result.push('\n');

            // if this is the first row, add a separator row
            if (y === 0) {
                result.push('|');
                for (let x = 0; x < row.length; x++) {
                    result.push(' --- |');
                }
                result.push('\n');
            }
        }

        return result.join('') + '\n';
    }

    /** @type {ElementConverter} */
    convertTBODY(ctx, el) {
        return this.convertNodes(ctx, el.childNodes);
    }

    /** @type {ElementConverter} */
    convertTD(ctx, el) {
        return this.convertNodes(ctx, el.childNodes);
    }

    /** @type {ElementConverter} */
    convertTFOOT(ctx, el) {
        return this.convertNodes(ctx, el.childNodes);
    }

    /** @type {ElementConverter} */
    convertTH(ctx, el) {
        return this.convertNodes(ctx, el.childNodes);
    }

    /** @type {ElementConverter} */
    convertTHEAD(ctx, el) {
        return this.convertNodes(ctx, el.childNodes);
    }

    /** @type {ElementConverter} */
    convertTR(ctx, el) {
        return this.convertNodes(ctx, el.childNodes);
    }

    // form elements

    /** @type {ElementConverter} */
    convertBUTTON(ctx, el) {
        return this.convertNodes(ctx, el.childNodes);
    }

    /** @type {ElementConverter} */
    convertDATALIST(ctx, el) {
        return this.convertNodes(ctx, el.childNodes);
    }

    /** @type {ElementConverter} */
    convertFIELDSET(ctx, el) {
        return this.convertBlockElement(ctx, el);
    }

    /** @type {ElementConverter} */
    convertFORM(ctx, el) {
        return this.convertBlockElement(ctx, el);
    }

    /** @type {ElementConverter} */
    convertINPUT(ctx, el) {
        const type = el.getAttribute('type');
        if (type !== 'checkbox') {
            return '';
        }
        const ariaHasPopup = el.getAttribute('aria-haspopup');
        if (ariaHasPopup) {
            return '';
        }

        const checked = el.getAttribute('checked') !== null;

        /** @type {string[]} */
        const result = [];

        if (!ctx.inList) {
            result.push(ctx.mdBulletPoint + ' ');
        }
        if (checked) {
            result.push('[x] ');
        } else {
            result.push('[ ] ');
        }

        return result.join('');
    }

    /** @type {ElementConverter} */
    convertLABEL(ctx, el) {
        return this.convertNodes(ctx, el.childNodes);
    }

    /** @type {ElementConverter} */
    convertLEGEND(ctx, el) {
        return this.convertSTRONG(ctx, el);
    }

    /** @type {ElementConverter} */
    convertMETER(ctx, el) {
        return this.convertNodes(ctx, el.childNodes);
    }

    /** @type {ElementConverter} */
    convertOPTGROUP(ctx, el) {
        return this.convertNodes(ctx, el.childNodes);
    }

    /** @type {ElementConverter} */
    convertOPTION(ctx, el) {
        return this.convertNodes(ctx, el.childNodes);
    }

    /** @type {ElementConverter} */
    convertOUTPUT(ctx, el) {
        return this.convertBlockElement(ctx, el);
    }

    /** @type {ElementConverter} */
    convertPROGRESS(ctx, el) {
        return this.convertNodes(ctx, el.childNodes);
    }

    /** @type {ElementConverter} */
    convertSELECT(ctx, el) {
        return this.convertNodes(ctx, el.childNodes);
    }

    /** @type {ElementConverter} */
    convertTEXTAREA(ctx, el) {
        return this.convertNodes(ctx, el.childNodes);
    }

    // interactive elements

    /** @type {ElementConverter} */
    convertDETAILS(ctx, el) {
        return this.convertBlockElement(ctx, el);
    }

    /** @type {ElementConverter} */
    convertDIALOG(ctx, el) {
        return this.convertBlockElement(ctx, el);
    }

    /** @type {ElementConverter} */
    convertSUMMARY(ctx, el) {
        return this.convertNodes(ctx, el.childNodes);
    }

    // web component elements

    /** @type {ElementConverter} */
    convertSLOT(ctx, el) {
        return this.convertNodes(ctx, el.childNodes);
    }

    /** @type {ElementConverter} */
    convertTEMPLATE(ctx, el) {
        return '';
    }

    // deprecated elements

    /** @type {ElementConverter} */
    convertACRONYM(ctx, el) {
        return this.convertABBR(ctx, el);
    }

    /** @type {ElementConverter} */
    convertBIG(ctx, el) {
        return this.convertSTRONG(ctx, el);
    }

    /** @type {ElementConverter} */
    convertCENTER(ctx, el) {
        return this.convertNodes(ctx, el.childNodes);
    }

    /** @type {ElementConverter} */
    convertCONTENT(ctx, el) {
        return this.convertNodes(ctx, el.childNodes);
    }

    /** @type {ElementConverter} */
    convertDIR(ctx, el) {
        return '';
    }

    /** @type {ElementConverter} */
    convertFONT(ctx, el) {
        return '';
    }

    /** @type {ElementConverter} */
    convertFRAME(ctx, el) {
        return '';
    }

    /** @type {ElementConverter} */
    convertFRAMESET(ctx, el) {
        return '';
    }

    /** @type {ElementConverter} */
    convertIMAGE(ctx, el) {
        return '';
    }

    /** @type {ElementConverter} */
    convertMARQUEE(ctx, el) {
        return '';
    }

    /** @type {ElementConverter} */
    convertMENUITEM(ctx, el) {
        return '';
    }

    /** @type {ElementConverter} */
    convertNOBR(ctx, el) {
        return '';
    }

    /** @type {ElementConverter} */
    convertNOEMBED(ctx, el) {
        return '';
    }

    /** @type {ElementConverter} */
    convertNOFRAMES(ctx, el) {
        return '';
    }

    /** @type {ElementConverter} */
    convertPARAM(ctx, el) {
        return '';
    }

    /** @type {ElementConverter} */
    convertPLAINTEXT(ctx, el) {
        return '';
    }

    /** @type {ElementConverter} */
    convertRB(ctx, el) {
        return '';
    }

    /** @type {ElementConverter} */
    convertRTC(ctx, el) {
        return '';
    }

    /** @type {ElementConverter} */
    convertSHADOW(ctx, el) {
        return '';
    }

    /** @type {ElementConverter} */
    convertSTRIKE(ctx, el) {
        return this.convertS(ctx, el);
    }

    /** @type {ElementConverter} */
    convertTT(ctx, el) {
        return '';
    }

    /** @type {ElementConverter} */
    convertXMP(ctx, el) {
        return '';
    }
}

const mdConverter = new MdConverter();
