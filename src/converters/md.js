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
    removeHiddenElements(frag, document);

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

    return this.convertNodes(ctx, frag.childNodes).trim().replaceAll(/\n{3,}/g, '\n\n') + '\n';
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

/** @type {Map<number, function(object, Node): string>} */
const nodeConverters = new Map([
    // [Node: nodeType property | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType)

    [ELEMENT_NODE, convertElement],
    [ATTRIBUTE_NODE, (ctx, node) => ''],
    [TEXT_NODE, convertText],
    [CDATA_SECTION_NODE, (ctx, node) => ''],
    [ENTITY_REFERENCE_NODE, (ctx, node) => ''], // deprecated
    [ENTITY_NODE, (ctx, node) => ''], // deprecated
    [PROCESSING_INSTRUCTION_NODE, (ctx, node) => ''],
    [COMMENT_NODE, (ctx, node) => ''],
    [DOCUMENT_NODE, convertDOCUMENT],
    [DOCUMENT_TYPE_NODE, (ctx, node) => ''],
    [DOCUMENT_FRAGMENT_NODE, convertDOCUMENTFRAGMENT],
    [NOTATION_NODE, (ctx, node) => ''], // deprecated
]);

/** @type {Map<string, function(object, Element): string>} */
const elementConverters = new Map([
    // [Element: tagName property | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/tagName)
    // [HTML elements reference | MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element)

    ['HTML', convertHTML],

    // document metadata elements
    ['BASE', convertBASE],
    ['HEAD', convertHEAD],
    ['LINK', (ctx, node) => ''],
    ['META', (ctx, node) => ''],
    ['STYLE', (ctx, node) => ''],
    ['TITLE', (ctx, node) => ''],

    // sectioning root elements
    ['BODY', convertChildNodes],

    // content sectioning elements
    ['ADDRESS', convertBlockElement],
    ['ARTICLE', convertBlockElement],
    ['ASIDE', convertBlockElement],
    ['FOOTER', convertFOOTER],
    ['HEADER', convertBlockElement],
    ['H1', newConvertHN(1)],
    ['H2', newConvertHN(2)],
    ['H3', newConvertHN(3)],
    ['H4', newConvertHN(4)],
    ['H5', newConvertHN(5)],
    ['H6', newConvertHN(6)],
    ['HGROUP', convertBlockElement],
    ['MAIN', convertBlockElement],
    ['NAV', convertNAV],
    ['SECTION', convertBlockElement],
    ['SEARCH', convertChildNodes],

    // text content elements
    ['BLOCKQUOTE', convertBlockquote],
    ['DD', convertDd],
    ['DIV', convertChildNodes],
    ['DL', convertDl],
    ['DT', convertDt],
    ['FIGCAPTION', convertBlockElement],
    ['FIGURE', convertBlockElement],
    ['HR', (ctx, el) => '\n\n* * *\n\n'],
    ['LI', (ctx, el) => ''],
    ['MENU', convertUl],
    ['OL', convertOl],
    ['P', convertP],
    ['PRE', convertPre],
    ['UL', convertUl],

    // inline text semantics elements
    ['A', convertA],
    ['ABBR', convertChildNodes],
    ['B', convertB],
    ['BDI', convertChildNodes],
    ['BDO', convertChildNodes],
    ['BR', (ctx, el) => '\n'],
    ['CITE', convertChildNodes],
    ['CODE', convertCode],
    ['DATA', convertChildNodes],
    ['DFN', convertChildNodes],
    ['EM', convertEm],
    ['I', convertEm],
    ['KBD', convertCode],
    ['MARK', convertMark],
    ['Q', convertQ],
    ['RP', (ctx, el) => el.textContent],
    ['RT', (ctx, el) => el.textContent],
    ['RUBY', convertChildNodes],
    ['S', convertS],
    ['SAMP', convertCode],
    ['SMALL', convertChildNodes],
    ['SPAN', convertChildNodes],
    ['STRONG', convertB],
    ['SUB', convertChildNodes],
    ['SUP', convertChildNodes],
    ['TIME', convertChildNodes],
    ['U', convertChildNodes],
    ['VAR', convertVar],
    ['WBR', (ctx, el) => ''],

    // image and multimedia elements
    ['AREA', (ctx, el) => ''],
    ['AUDIO', convertAudio],
    ['IMG', convertImg],
    ['MAP', (ctx, el) => ''],
    ['TRACK', convertTrack],
    ['VIDEO', convertVideo],

    // embedded content elements
    ['EMBED', convertEmbed],
    ['IFRAME', convertIframe],
    ['OBJECT', convertObject],
    ['PICTURE', convertChildNodes],
    ['PORTAL', convertPortal],
    ['SOURCE', (ctx, el) => ''],

    // SVG and MathMl elements
    ['SVG', (ctx, el) => ''],
    ['MATH', (ctx, el) => ''],

    // scripting elements
    ['CANVAS', convertBlockElement],
    ['NOSCRIPT', (ctx, el) => ''],
    ['SCRIPT', (ctx, el) => ''],

    // demarcating edits elements
    ['DEL', convertS],
    ['INS', convertChildNodes],

    // table content elements
    ['CAPTION', convertChildNodes],
    ['COL', (ctx, el) => ''],
    ['COLGROUP', (ctx, el) => ''],
    ['TABLE', convertTable],
    ['TBODY', convertChildNodes],
    ['TD', convertChildNodes],
    ['TFOOT', convertChildNodes],
    ['TH', convertChildNodes],
    ['THEAD', convertChildNodes],
    ['TR', convertChildNodes],

    // form elements
    ['BUTTON', convertChildNodes],
    ['DATALIST', convertChildNodes],
    ['FIELDSET', convertBlockElement],
    ['FORM', convertBlockElement],
    ['INPUT', convertInput],
    ['LABEL', convertChildNodes],
    ['LEGEND', convertB],
    ['METER', convertChildNodes],
    ['OPTGROUP', convertChildNodes],
    ['OPTION', convertChildNodes],
    ['OUTPUT', convertBlockElement],
    ['PROGRESS', convertChildNodes],
    ['SELECT', convertChildNodes],
    ['TEXTAREA', convertChildNodes],

    // interactive elements
    ['DETAILS', convertChildNodes],
    ['DIALOG', convertChildNodes],
    ['SUMMARY', convertChildNodes],

    // web compontent elements
    ['SLOT', convertChildNodes],
    ['TEMPLATE', (ctx, el) => ''],

    // deprecated elements
    ['ACRONYM', convertChildNodes],
    ['BIG', convertChildNodes],
    ['CENTER', convertChildNodes],
    ['CONTENT', convertChildNodes],
    ['DIR', (ctx, el) => ''],
    ['FONT', (ctx, el) => ''],
    ['FRAME', (ctx, el) => ''],
    ['FRAMESET', (ctx, el) => ''],
    ['IMAGE', (ctx, el) => ''],
    ['MARQUEE', (ctx, el) => ''],
    ['MENUITEM', (ctx, el) => ''],
    ['NOBR', (ctx, el) => ''],
    ['NOEMBED', (ctx, el) => ''],
    ['NOFRAMES', (ctx, el) => ''],
    ['PARAM', (ctx, el) => ''],
    ['PLAINTEXT', (ctx, el) => ''],
    ['RB', (ctx, el) => ''],
    ['RTC', (ctx, el) => ''],
    ['SHADOW', (ctx, el) => ''],
    ['STRIKE', convertS],
    ['TT', (ctx, el) => ''],
    ['XMP', (ctx, el) => ''],
]);

export class ElementConverters {

    /**
     * @param {object} ctx
     * @param {Node} node
     * @returns {string}
     */
    convertChildNodes(ctx, node) {
        return this.convertNodes(ctx, node.childNodes);
    }

    /**
     * @param {object} ctx
     * @param {Element} el
     * @returns {string}
     */
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

    /**
     * @param {object} ctx
     * @param {Node} node
     * @returns {string}
     */
    convertNode(ctx, node) {
        /** @type {function(object, Node): string} */
        const convert = nodeConverters.get(node.nodeType);
        if (convert === undefined) {
            if (node.childNodes) {
                return this.convertNodes(ctx, node.childNodes);
            }
            return this.convertText(ctx, node);
        }
        return convert(ctx, node);
    }

    /**
     * @param {object} ctx
     * @param {Element} el
     * @returns {string}
     */
    convertElement(ctx, el) {
        /** @type {function(object, Element): string} */
        const convert = this['convert' + el.tagName];
        if (convert === undefined) {
            if (el.childNodes) {
                return this.convertNodes(ctx, el.childNodes);
            }
            return this.convertText(ctx, el);
        }
        return convert(ctx, el);
    }

    /**
     * @param {object} ctx
     * @param {Node} node
     * @returns {string}
     */
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

    /**
     * @param {object} ctx
     * @param {Document} node
     * @returns {string}
     */
    convertDOCUMENT(ctx, node) {
        return this.convertNodes(ctx, node.body.childNodes);
    }

    /**
     * @param {object} ctx
     * @param {DocumentFragment} node
     * @returns {string}
     */
    convertDOCUMENTFRAGMENT(ctx, node) {
        return this.convertNodes(ctx, node.children);
    }

    /**
     * @param {object} ctx
     * @param {Element} el
     * @returns {string}
     */
    convertHTML(ctx, el) {
        const newCtx = { ...ctx }; // prevent mutations of the original context
        return this.convertNodes(newCtx, el.childNodes);
    }

    /**
     * @param {object} ctx
     * @param {Element} el
     * @returns {string}
     */
    convertBASE(ctx, el) {
        const href = el.getAttribute('href');
        if (href) {
            ctx.locationHref = href; // mutate the context
        }
    }

    /**
     * @param {object} ctx
     * @param {Element} el
     * @returns {string}
     */
    convertHEAD(ctx, el) {
        return '';
    }

    /**
     * @param {object} ctx
     * @param {Element} el
     * @returns {string}
     */
    convertFOOTER(ctx, el) {
        if (ctx.omitFooter) {
            return '';
        }
        return this.convertNodes(ctx, el.childNodes);
    }

    /**
     * newConvertHN creates a function that converts H1, H2, H3, H4, H5, or H6 elements.
     * @param {number} n - the header level.
     * @returns {function(object, Element): string}
     */
    newConvertHN(n) {
        /**
         * @param {object} ctx
         * @param {Element} el
         * @returns {string}
         */
        return function (ctx, el) {
            if (ctx.inTable) {
                return this.convertText(ctx, el);
            }

            const newCtx = { ...ctx, dontTrimText: true };

            /** @type {string[]} */
            const result = ['\n\n'];
            for (let i = 0; i < n; i++) {
                result.push('#');
            }
            const text = this.convertNodes(newCtx, el.childNodes).trim();
            if (!text) {
                return '';
            }

            result.push(' ' + text.replaceAll('\n', ' '));

            return result.join('') + '\n\n';
        }
    }

    /**
     * @param {object} ctx
     * @param {Element} el
     * @returns {string}
     */
    convertNAV(ctx, el) {
        if (ctx.omitNav) {
            return '';
        }
        return this.convertNodes(ctx, el.childNodes) + '\n';
    }

    /**
     * @param {object} ctx
     * @param {Element} el
     * @returns {string}
     */
    convertBlockquote(ctx, el) {
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

    /**
     * @param {object} ctx
     * @param {Element} el
     * @returns {string}
     */
    convertDd(ctx, el) {
        const newCtx = { ...ctx, dontTrimText: true };
        const text = this.convertNodes(newCtx, el.childNodes).trim();
        if (!text) {
            return '';
        }

        return ': ' + text.replaceAll('\n', ' ') + '\n';
    }

    /**
     * @param {object} ctx
     * @param {Element} el
     * @returns {string}
     */
    convertDl(ctx, el) {
        const newCtx = { ...ctx, dontTrimText: true };
        return '\n\n' + this.convertNodes(newCtx, el.childNodes) + '\n\n';
    }

    /**
     * @param {object} ctx
     * @param {Element} el
     * @returns {string}
     */
    convertDt(ctx, el) {
        const newCtx = { ...ctx, dontTrimText: true };
        return this.convertNodes(newCtx, el.childNodes).replaceAll('\n', ' ') + '\n';
    }

    /**
     * @param {object} ctx
     * @param {Element} el
     * @returns {string}
     */
    convertOl(ctx, el) {
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

    /**
     * @param {object} ctx
     * @param {Element} el
     * @returns {string}
     */
    convertUl(ctx, el) {
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

    /**
     * @param {object} ctx
     * @param {Element} el
     * @returns {string}
     */
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


    /**
     * @param {object} ctx
     * @param {Element} el
     * @returns {string}
     */
    convertPre(ctx, el) {
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
                return this.convertCode(ctx, child);
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

    /**
     * @param {object} ctx
     * @param {Element} el
     * @returns {string}
     */
    convertCode(ctx, el) {
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

    /**
     * @param {object} ctx
     * @param {Element} el
     * @returns {string}
     */
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

    /**
     * @param {object} ctx
     * @param {Element} el
     * @returns {string}
     */
    convertB(ctx, el) {
        if (ctx.inB) {
            return this.convertNodes(ctx, el.childNodes);
        }
        const newCtx = { ...ctx, inB: true };

        const text = this.convertNodes(newCtx, el.childNodes).trim();
        if (!text) {
            return '';
        }

        return '**' + text.replaceAll('\n', ' ') + '**';
    }

    /**
     * @param {object} ctx
     * @param {Element} el
     * @returns {string}
     */
    convertEm(ctx, el) {
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

    /**
     * @param {object} ctx
     * @param {Element} el
     * @returns {string}
     */
    convertMark(ctx, el) {
        const text = this.convertNodes(ctx, el.childNodes).trim();
        if (!text) {
            return '';
        }

        return '==' + text.replaceAll('\n', ' ') + '==';
    }

    /**
     * @param {object} ctx
     * @param {Element} el
     * @returns {string}
     */
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

    /**
     * @param {object} ctx
     * @param {Element} el
     * @returns {string}
     */
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

    /**
     * @param {object} ctx
     * @param {Element} el
     * @returns {string}
     */
    convertVar(ctx, el) {
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

    /**
     * @param {object} ctx
     * @param {Element} el
     * @returns {string}
     */
    convertAudio(ctx, el) {
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

    /**
     * @param {object} ctx
     * @param {Element} el
     * @returns {string}
     */
    convertImg(ctx, el) {
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

    /**
     * @param {object} ctx
     * @param {Element} el
     * @returns {string}
     */
    convertTrack(ctx, el) {
        const label = ctx.escape(el.getAttribute('label') || 'track');

        let src = el.getAttribute('src');
        if (!src) {
            return label;
        }
        src = absolutize(src, ctx.locationHref);
        src = mdEncodeUri(src);

        return '[' + label + '](' + src + ')';
    }

    /**
     * @param {object} ctx
     * @param {Element} el
     * @returns {string}
     */
    convertVideo(ctx, el) {
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

    /**
     * @param {object} ctx
     * @param {Element} el
     * @returns {string}
     */
    convertEmbed(ctx, el) {
        let src = el.getAttribute('src');
        if (!src) {
            return '';
        }
        src = absolutize(src, ctx.locationHref);
        src = mdEncodeUri(src);
        const type = ctx.escape(el.getAttribute('type') || 'embed');
        return '[' + type + '](' + src + ')';
    }

    /**
     * @param {object} ctx
     * @param {Element} el
     * @returns {string}
     */
    convertIframe(ctx, el) {
        const srcdoc = el.getAttribute('srcdoc');
        if (srcdoc && DOMParser) {
            const doc = new DOMParser().parseFromString(srcdoc, 'text/html');
            // The iframe uses the embedding document's URL as its base URL when
            // resolving any relative URLs.
            return this.convertDOCUMENT(ctx, doc);
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

    /**
     * @param {object} ctx
     * @param {Element} el
     * @returns {string}
     */
    convertObject(ctx, el) {
        let data = el.getAttribute('data');
        if (data) {
            data = absolutize(data, ctx.locationHref);
            data = mdEncodeUri(data);
            const type = ctx.escape(el.getAttribute('type') || 'object');
            return '[' + type + '](' + data + ')';
        }
        return this.convertNodes(ctx, el.childNodes);
    }

    /**
     * @param {object} ctx
     * @param {Element} el
     * @returns {string}
     */
    convertPortal(ctx, el) {
        let src = el.getAttribute('src');
        if (!src) {
            return '';
        }
        src = absolutize(src, ctx.locationHref);
        src = mdEncodeUri(src);
        const id = ctx.escape(el.getAttribute('id') || 'portal');
        return '[' + id + '](' + src + ')';
    }

    /**
     * @param {object} ctx
     * @param {Element} el
     * @returns {string}
     */
    convertTable(ctx, el) {
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
            result.push(this.convertB(ctx, caption) + '\n\n');
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

    /**
     * @param {object} ctx
     * @param {Element} el
     * @returns {string}
     */
    convertInput(ctx, el) {
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
}
