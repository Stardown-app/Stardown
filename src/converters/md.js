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
import * as tables from './tables.js';
import { absolutize } from './urls.js';

/**
 * htmlToMd converts HTML to pure markdown without any HTML.
 * @param {string} html
 * @returns {Promise<string>}
 */
export async function htmlToMd(html) {
    /** @type {DocumentFragment} */
    const frag = document.createRange().createContextualFragment(html);

    const ctx = {
        locationHref: location.href,
        document: document,
        subBrackets: await getSetting('subBrackets'),
        bulletPoint: await getSetting('bulletPoint'),
        omitNav: await getSetting('omitNav'),
        omitFooter: await getSetting('omitFooter'),
        youtubeMd: await getSetting('youtubeMd'),
    };

    /** @type {function(string): string} */
    ctx.escape = newEscape(ctx.subBrackets);

    return convertNodes(ctx, frag.childNodes);
}

/**
 * encodeUrl encodes a URL by replacing certain characters with their percent-encoded
 * equivalents.
 * @param {string} url
 * @returns {string}
 */
export function encodeUrl(url) {
    return url.replaceAll('(', '%28').replaceAll(')', '%29').replaceAll(' ', '%20');
}

/**
 * newEscape creates a new function for escaping characters.
 * @param {string} subBrackets - the setting for what to substitute any square brackets
 * with.
 * @returns {function(string): string}
 */
export function newEscape(subBrackets) {
    let openSqrRepl, closeSqrRepl;
    switch (subBrackets) {
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
    [DOCUMENT_NODE, convertDocument],
    [DOCUMENT_TYPE_NODE, (ctx, node) => ''],
    [DOCUMENT_FRAGMENT_NODE, convertDocumentFragment],
    [NOTATION_NODE, (ctx, node) => ''], // deprecated
]);

/** @type {Map<string, function(object, Element): string>} */
const elementConverters = new Map([
    // [Element: tagName property | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/tagName)
    // [HTML elements reference | MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element)

    ['HTML', convertHtml],

    // document metadata elements
    ['BASE', convertBase],
    ['HEAD', (ctx, node) => ''],
    ['LINK', (ctx, node) => ''],
    ['META', (ctx, node) => ''],
    ['STYLE', (ctx, node) => ''],
    ['TITLE', (ctx, node) => ''],

    // sectioning root elements
    ['BODY', convertBlockElement],

    // content sectioning elements
    ['ADDRESS', convertBlockElement],
    ['ARTICLE', convertBlockElement],
    ['ASIDE', convertBlockElement],
    ['FOOTER', convertFooter],
    ['HEADER', convertBlockElement],
    ['H1', newConvertHN(1)],
    ['H2', newConvertHN(2)],
    ['H3', newConvertHN(3)],
    ['H4', newConvertHN(4)],
    ['H5', newConvertHN(5)],
    ['H6', newConvertHN(6)],
    ['HGROUP', convertBlockElement],
    ['MAIN', convertBlockElement],
    ['NAV', convertNav],
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
    ['HR', (ctx, el) => '---\n\n'],
    ['LI', (ctx, el) => ''],
    ['MENU', convertUl],
    ['OL', convertOl],
    ['P', convertBlockElement],
    ['PRE', convertPre],
    ['UL', convertUl],

    // inline text semantics elements
    ['A', convertA],
    ['ABBR', convertChildNodes],
    ['B', convertB],
    ['BDI', convertChildNodes],
    ['BDO', convertChildNodes],
    ['BR', (ctx, el) => '\n'],
    ['CITE', convertEm],
    ['CODE', convertCode],
    ['DATA', convertChildNodes],
    ['DFN', convertEm],
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
    ['NOSCRIPT', convertBlockElement],
    ['SCRIPT', (ctx, el) => ''],

    // demarcating edits elements
    ['DEL', convertS],
    ['INS', convertChildNodes],

    // table content elements
    ['CAPTION', (ctx, el) => ''],
    ['COL', (ctx, el) => ''],
    ['COLGROUP', (ctx, el) => ''],
    ['TABLE', convertTable],
    ['TBODY', (ctx, el) => ''],
    ['TD', (ctx, el) => ''],
    ['TFOOT', (ctx, el) => ''],
    ['TH', (ctx, el) => ''],
    ['THEAD', (ctx, el) => ''],
    ['TR', (ctx, el) => ''],

    // form elements
    ['BUTTON', convertChildNodes],
    ['DATALIST', convertChildNodes],
    ['FIELDSET', convertBlockElement],
    ['FORM', convertBlockElement],
    ['INPUT', (ctx, el) => ''],
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
    ['ACRONYM', (ctx, el) => ''],
    ['BIG', (ctx, el) => ''],
    ['CENTER', (ctx, el) => ''],
    ['CONTENT', (ctx, el) => ''],
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
    ['STRIKE', (ctx, el) => ''],
    ['TT', (ctx, el) => ''],
    ['XMP', (ctx, el) => ''],
]);

/**
 * @param {object} ctx
 * @param {Node} node
 * @returns {string}
 */
function convertChildNodes(ctx, node) {
    return convertNodes(ctx, node.childNodes);
}

/**
 * @param {object} ctx
 * @param {Element} el
 * @returns {string}
 */
function convertBlockElement(ctx, el) {
    return convertNodes(ctx, el.childNodes).trim().replaceAll(/\n\s+/g, '\n') + '\n\n';
}

/**
 * @param {object} ctx
 * @param {Node[]|NodeList|HTMLCollection} nodes
 * @returns {string}
 */
function convertNodes(ctx, nodes) {
    /** @type {string[]} */
    const results = [];
    for (let i = 0; i < nodes.length; i++) {
        results.push(convertNode(ctx, nodes[i]));
    }
    return results.join('');
}

/**
 * @param {object} ctx
 * @param {Node} node
 * @returns {string}
 */
function convertNode(ctx, node) {
    /** @type {function(object, Node): string} */
    const convert = nodeConverters.get(node.nodeType);
    if (convert === undefined) {
        if (node.childNodes) {
            return convertNodes(ctx, node.childNodes);
        } else if (node.textContent) {
            return convertText(ctx, node);
        }
        return '';
    }
    return convert(ctx, node);
}

/**
 * @param {object} ctx
 * @param {Element} el
 * @returns {string}
 */
function convertElement(ctx, el) {
    /** @type {function(object, Element): string} */
    const convert = elementConverters.get(el.tagName);
    if (convert === undefined) {
        if (el.childNodes) {
            return convertNodes(ctx, el.childNodes);
        } else if (el.textContent) {
            return convertText(ctx, el);
        }
        return '';
    }
    return convert(ctx, el);
}

/**
 * @param {object} ctx
 * @param {Node} node
 * @returns {string}
 */
function convertText(ctx, node) {
    if (node.textContent) {
        return ctx.escape(node.textContent).trim().replaceAll(/\s+/g, ' ');
    }
    return '';
}

/**
 * @param {object} ctx
 * @param {Document} node
 * @returns {string}
 */
function convertDocument(ctx, node) {
    return convertNodes(ctx, node.body.childNodes);
}

/**
 * @param {object} ctx
 * @param {DocumentFragment} node
 * @returns {string}
 */
function convertDocumentFragment(ctx, node) {
    return convertNodes(ctx, node.children);
}

/**
 * @param {object} ctx
 * @param {Element} el
 * @returns {string}
 */
function convertHtml(ctx, el) {
    const newCtx = { ...ctx }; // prevent mutations of the original context
    return convertNodes(newCtx, node.childNodes);
}

/**
 * @param {object} ctx
 * @param {Element} el
 * @returns {string}
 */
function convertBase(ctx, el) {
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
function convertFooter(ctx, el) {
    if (ctx.omitFooter) {
        return '';
    }
    return convertNodes(ctx, el.childNodes);
}

/**
 * newConvertHN creates a function that converts H1, H2, H3, H4, H5, or H6 elements.
 * @param {number} n - the header level.
 * @returns {function(object, Element): string}
 */
function newConvertHN(n) {
    /**
     * @param {object} ctx
     * @param {Element} el
     * @returns {string}
     */
    return function (ctx, el) {
        if (ctx.inTable) {
            return convertText(ctx, el);
        }

        /** @type {string[]} */
        const result = [];
        for (let i = 0; i < n; i++) {
            result.push('#');
        }
        result.push(' ' + convertNodes(ctx, el.childNodes).replaceAll('\n', ' '));

        return result.join('') + '\n\n';
    }
}

/**
 * @param {object} ctx
 * @param {Element} el
 * @returns {string}
 */
function convertNav(ctx, el) {
    if (ctx.omitNav) {
        return '';
    }
    return convertNodes(ctx, el.childNodes) + '\n';
}

/**
 * @param {object} ctx
 * @param {Element} el
 * @returns {string}
 */
function convertBlockquote(ctx, el) {
    let result = convertNodes(ctx, el.childNodes);
    return '> ' + result.replaceAll('\n', '\n> ') + '\n\n';
}

/**
 * @param {object} ctx
 * @param {Element} el
 * @returns {string}
 */
function convertDd(ctx, el) {
    return ': ' + convertNodes(ctx, el.childNodes).replaceAll('\n', ' ') + '\n';
}

/**
 * @param {object} ctx
 * @param {Element} el
 * @returns {string}
 */
function convertDl(ctx, el) {
    return convertNodes(ctx, el.childNodes) + '\n';
}

/**
 * @param {object} ctx
 * @param {Element} el
 * @returns {string}
 */
function convertDt(ctx, el) {
    return convertNodes(ctx, el.childNodes).replaceAll('\n', ' ') + '\n';
}

/**
 * @param {object} ctx
 * @param {Element} el
 * @returns {string}
 */
function convertOl(ctx, el) {
    /** @type {string[]} */
    const result = [];

    let liNum = Number(el.getAttribute('start') || 1);
    const reversed = Boolean(el.getAttribute('reversed'));

    const children = el.childNodes;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.nodeName === 'LI') {
            const indent = ctx.indent || 0;
            for (let j = 0; j < indent; j++) {
                result.push(' ');
            }
            result.push(String(liNum) + '. ');
            if (reversed) {
                liNum--;
            } else {
                liNum++;
            }
            result.push(convertNodes(ctx, child.childNodes).replaceAll('\n', ' '));
            result.push('\n');
        } else if (child.nodeName === 'OL') {
            const indent = ctx.indent || 0;
            const newCtx = { ...ctx, indent: indent + 4 };
            result.push(convertOl(newCtx, child));
        } else if (child.nodeName === 'UL') {
            const indent = ctx.indent || 0;
            const newCtx = { ...ctx, indent: indent + 4 };
            result.push(convertUl(newCtx, child));
        }
    }

    return result.join('') + '\n';
}

/**
 * @param {object} ctx
 * @param {Element} el
 * @returns {string}
 */
function convertUl(ctx, el) {
    /** @type {string[]} */
    const result = [];

    const children = el.childNodes;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.nodeName === 'LI') {
            const indent = ctx.indent || 0;
            for (let j = 0; j < indent; j++) {
                result.push(' ');
            }
            result.push(ctx.bulletPoint + ' ');
            result.push(convertNodes(ctx, child.childNodes).replaceAll('\n', ' '));
            result.push('\n');
        } else if (child.nodeName === 'OL') {
            const indent = ctx.indent || 0;
            const newCtx = { ...ctx, indent: indent + 4 };
            result.push(convertOl(newCtx, child));
        } else if (child.nodeName === 'UL') {
            const indent = ctx.indent || 0;
            const newCtx = { ...ctx, indent: indent + 4 };
            result.push(convertUl(newCtx, child));
        }
    }

    return result.join('') + '\n';
}

/**
 * @param {object} ctx
 * @param {Element} el
 * @returns {string}
 */
function convertPre(ctx, el) {
    const child = el.firstChild;
    if (!child) {
        return '';
    }

    if (child.nodeName === 'SAMP') {
        return convertSamp(ctx, child);
    } else if (child.nodeName === 'KBD') {
        return convertKbd(ctx, child);
    } else if (child.nodeName === 'CODE') {
        /** @type {string[]} */
        const result = ['```'];

        if (child.textContent.includes('```')) {
            result.push('`');
        }

        // assign the code block a language if there is one
        let language = '';
        /** @type {string} */
        const class_ = child.getAttribute('class') || '';
        const languageMatch = class_.match(/language-(\S+)/);
        if (languageMatch && languageMatch.length > 0) {
            language = languageMatch[1];
        }
        result.push(language + '\n');

        const code = child.textContent || '';
        result.push(code + '\n```');

        if (child.textContent.includes('```')) {
            result.push('`');
        }

        return result.join('') + '\n\n';
    } else {
        let text = el.textContent || '';
        text = text.replaceAll('\n', ' ');
        if (text.includes('```')) {
            return '````\n' + text + '\n````\n\n';
        } else {
            return '```\n' + text + '\n```\n\n';
        }
    }
}

/**
 * @param {object} ctx
 * @param {Element} el
 * @returns {string}
 */
function convertCode(ctx, el) {
    let text = el.textContent;
    if (!text) {
        return '';
    }
    text = text.replaceAll('\n', ' ');
    if (text.includes('``')) {
        return '```' + text + '```';
    } else if (text.includes('`')) {
        return '``' + text + '``';
    }
    return '`' + text + '`';
}

/**
 * @param {object} ctx
 * @param {Element} el
 * @returns {string}
 */
function convertA(ctx, el) {
    let href = el.getAttribute('href');
    if (!href) {
        return '';
    }
    href = absolutize(href, ctx.locationHref);
    href = encodeUrl(href);

    const title = convertNodes(ctx, el.childNodes).replaceAll('\n', ' ');

    return '[' + title + '](' + href + ')';
}

/**
 * @param {object} ctx
 * @param {Element} el
 * @returns {string}
 */
function convertB(ctx, el) {
    const text = convertNodes(ctx, el.childNodes);
    return '**' + text.trim().replaceAll('\n', ' ') + '**';
}

/**
 * @param {object} ctx
 * @param {Element} el
 * @returns {string}
 */
function convertEm(ctx, el) {
    const text = convertNodes(ctx, el.childNodes);
    return '*' + text.trim().replaceAll('\n', ' ') + '*';
}

/**
 * @param {object} ctx
 * @param {Element} el
 * @returns {string}
 */
function convertMark(ctx, el) {
    const text = convertNodes(ctx, el.childNodes);
    return '==' + text.trim().replaceAll('\n', ' ') + '==';
}

/**
 * @param {object} ctx
 * @param {Element} el
 * @returns {string}
 */
function convertQ(ctx, el) {
    const text = convertNodes(ctx, el.childNodes);
    return '*"' + text.trim().replaceAll('\n', ' ') + '"*';
}

/**
 * @param {object} ctx
 * @param {Element} el
 * @returns {string}
 */
function convertS(ctx, el) {
    const text = convertNodes(ctx, el.childNodes);
    return '~~' + text.trim().replaceAll('\n', ' ').replaceAll('~', '\\~') + '~~';
}

/**
 * @param {object} ctx
 * @param {Element} el
 * @returns {string}
 */
function convertVar(ctx, el) {
    const text = convertNodes(ctx, el.childNodes);
    return '***' + text.trim().replaceAll('\n', ' ') + '***';
}

/**
 * @param {object} ctx
 * @param {Element} el
 * @returns {string}
 */
function convertAudio(ctx, el) {
    let src = el.getAttribute('src');
    if (!src || src.startsWith('blob:')) {
        const sourceEl = el.querySelector('source');
        if (sourceEl) {
            src = sourceEl.getAttribute('src');
        }
    }
    if (!src || src.startsWith('blob:')) {
        if (el.childNodes.length > 0) {
            return convertNodes(ctx, el.childNodes);
        }
        src = ctx.locationHref;
    }
    src = absolutize(src, ctx.locationHref);
    src = encodeUrl(src);

    return '[audio](' + src + ')';
}

/**
 * @param {object} ctx
 * @param {Element} el
 * @returns {string}
 */
function convertImg(ctx, el) {
    const alt = ctx.escape(el.getAttribute('alt') || '').replaceAll('\n', ' ');

    let src = el.getAttribute('src') || '';
    if (!src || src.startsWith('data:')) {
        src = el.getAttribute('data-srcset') || '';
        if (!src) {
            return alt;
        }
    }
    src = absolutize(src, ctx.locationHref);
    src = encodeUrl(src);

    return '![' + alt + '](' + src + ')';
}

/**
 * @param {object} ctx
 * @param {Element} el
 * @returns {string}
 */
function convertTrack(ctx, el) {
    const label = ctx.escape(el.getAttribute('label') || 'track');

    let src = el.getAttribute('src');
    if (!src) {
        return label;
    }
    src = absolutize(src, ctx.locationHref);
    src = encodeUrl(src);

    return '[' + label + '](' + src + ')';
}

/**
 * @param {object} ctx
 * @param {Element} el
 * @returns {string}
 */
function convertVideo(ctx, el) {
    const src = el.getAttribute('src');
    const usingSrcUrl = src && !src.startsWith('blob:');
    let url = usingSrcUrl ? src : ctx.locationHref;
    url = absolutize(url, ctx.locationHref);
    url = encodeUrl(url);

    let youtubeId; // TODO
    let isYoutube = false; // TODO

    if (isYoutube && ctx.youtubeMd === 'GitHub') {
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
function convertEmbed(ctx, el) {
    let src = el.getAttribute('src');
    if (!src) {
        return '';
    }
    src = absolutize(src, ctx.locationHref);
    src = encodeUrl(src);
    const type = ctx.escape(el.getAttribute('type') || 'embed');
    return '[' + type + '](' + src + ')';
}

/**
 * @param {object} ctx
 * @param {Element} el
 * @returns {string}
 */
function convertIframe(ctx, el) {
    const srcdoc = el.getAttribute('srcdoc');
    if (srcdoc && DOMParser) {
        const doc = new DOMParser().parseFromString(srcdoc, 'text/html');
        // The iframe uses the embedding document's URL as its base URL when resolving
        // any relative URLs.
        return convertDocument(ctx, doc);
    }

    let src = el.getAttribute('src');
    if (src && src !== 'about:blank') {
        src = absolutize(src, ctx.locationHref);
        src = encodeUrl(src);
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
function convertObject(ctx, el) {
    let data = el.getAttribute('data');
    if (data) {
        data = absolutize(data, ctx.locationHref);
        data = encodeUrl(data);
        const type = ctx.escape(el.getAttribute('type') || 'object');
        return '[' + type + '](' + data + ')';
    }
    return convertNodes(ctx, el.childNodes);
}

/**
 * @param {object} ctx
 * @param {Element} el
 * @returns {string}
 */
function convertPortal(ctx, el) {
    let src = el.getAttribute('src');
    if (!src) {
        return '';
    }
    src = absolutize(src, ctx.locationHref);
    src = encodeUrl(src);
    const id = ctx.escape(el.getAttribute('id') || 'portal');
    return '[' + id + '](' + src + ')';
}

/**
 * @param {object} ctx
 * @param {Element} el
 * @returns {string}
 */
function convertTable(ctx, el) {
    if (ctx.inTable) {
        return convertText(ctx, el);
    }
    const newCtx = { ...ctx, inTable: true };

    /*
        HTML table definition:

        In this order: optionally a caption element, followed by zero or more colgroup
        elements, followed optionally by a thead element, followed by either zero or
        more tbody elements or one or more tr elements, followed optionally by a tfoot
        element, optionally intermixed with one or more script-supporting elements.

        Source: [the HTML Standard](https://html.spec.whatwg.org/multipage/tables.html)
    */

    /** @type {string[]} */
    let result = [];

    const caption = el.querySelector('caption');
    if (caption) {
        result.push(convertB(ctx, caption) + '\n\n');
    }

    /** @type {Element[][]} */
    let table2d = tables.to2dArray(el);
    table2d = tables.removeEmptyRows(table2d);
    table2d = tables.rectangularize(table2d, ctx.document);

    // for each row
    for (let y = 0; y < table2d.length; y++) {
        const row = table2d[y];
        result.push('|');

        // for each cell
        for (let x = 0; x < row.length; x++) {
            let cellStr = convertNodes(newCtx, row[x].childNodes);
            cellStr = cellStr.trim().replaceAll(/\s+/g, ' ').replaceAll('|', '\\|');
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
