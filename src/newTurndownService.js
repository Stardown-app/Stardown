import { TurndownService } from './turndown.js';
import { turndownPluginGfm } from './turndown-plugin-gfm.js';

/**
 * replaceBrackets replaces any square brackets in text with the character or escape
 * sequence chosen in settings.
 * @param {string} text - the text.
 * @param {string} subBrackets - the setting for what to substitute any square brackets
 * with.
 * @returns {string}
 */
export function replaceBrackets(text, subBrackets) {
    if (subBrackets === 'underlined') {
        return text.replaceAll('[', '⦋').replaceAll(']', '⦌');
    } else if (subBrackets === 'escaped') {
        return text.replaceAll('[', '\\[').replaceAll(']', '\\]');
    } else {
        return text;
    }
}

/**
 * newTurndownService creates a new TurndownService instance. The instance has been
 * customized in a way that depends on the `location` object.
 * @param {string} bulletPoint - the setting for the bullet point character.
 * @param {string} subBrackets - the Stardown setting for what to substitute square
 * brackets with.
 * @param {Function(string): string} turndownEscape - the markdown escape function for
 * the Turndown service instance to use.
 * @returns {TurndownService}
 */
export function newTurndownService(bulletPoint, subBrackets, turndownEscape) {
    // https://github.com/mixmark-io/turndown
    const t = new TurndownService({
        bulletListMarker: bulletPoint,
        headingStyle: 'atx',
        emDelimiter: '*',
        codeBlockStyle: 'fenced',
    });

    t.use(turndownPluginGfm.gfm); // GitHub Flavored Markdown

    t.escape = turndownEscape;

    addRules(t, subBrackets);

    t.keep(['u', 'dl', 'dt', 'dd']);

    // Keep subscript and superscript nodes as HTML if and only if they don't contain
    // HTML anchor elements because they are not clickable at least in Obsidian. Also,
    // if URLs aren't processed, they can't be made absolute.
    t.keep((node) => {
        return (
            (node.nodeName === 'SUB' || node.nodeName === 'SUP') &&
            !node.querySelectorAll('a').length
        );
    });

    t.remove(['style', 'script', 'noscript', 'link']);

    return t;
}

/**
 * addRules adds custom Turndown rules to a Turndown service instance.
 * @param {TurndownService} t - the Turndown service instance.
 * @param {string} subBrackets - the Stardown setting for what to substitute square
 * brackets with.
 * @returns {void}
 */
function addRules(t, subBrackets) {
    // Each Turndown rule runs on each yet-unreplaced HTML element. If the element
    // matches the rule's filter, the rule's replacement function runs on it.

    t.addRule('inlineLink', {
        filter: isInlineLink,
        replacement: newConvertLinkToMarkdown(subBrackets),
    });

    t.addRule('img', {
        filter: 'img',
        replacement: convertImageToMarkdown,
    });

    t.addRule('strikethrough', {
        filter: ['del', 's', 'strike'],
        replacement: function (content) {
            return '~~' + content + '~~';
        },
    });

    t.addRule('highlight', {
        filter: 'mark',
        replacement: function (content) {
            return '==' + content + '==';
        },
    });
}

/**
 * isInlineLink reports whether the given node is a link and should be inlined.
 * @param {*} node - the HTML element node.
 * @param {*} options - the Turndown options.
 * @returns {boolean}
 */
function isInlineLink(node, options) {
    return (
        options.linkStyle === 'inlined' &&
        node.nodeName === 'A' &&
        node.getAttribute('href')
    )
}

/**
 * newConvertLinkToMarkdown returns a function that converts an HTML link to a markdown
 * link.
 * @param {string} subBrackets - the Stardown setting for what to substitute square
 * brackets with.
 * @returns {Function(string, any): string}
 */
function newConvertLinkToMarkdown(subBrackets) {
    /**
     * @param {string} content - the page's content within the HTML anchor. If the anchor
     * contains some elements like inline SVGs, this variable will be falsy.
     * @param {*} node - the HTML element node.
     * @returns {string}
     */
    return function (content, node) {
        if (!content) { // if the link's title would be empty
            return ''; // don't create the link
        }

        content = replaceBrackets(content, subBrackets);

        let href = node.getAttribute('href') || '';
        if (href) {
            href = href.replaceAll(' ', '%20').replaceAll('(', '%28').replaceAll(')', '%29');

            // make the URL absolute
            if (href.startsWith('/')) {
                const url = new URL(location.href);
                const base = url.origin;
                href = base + href;
            } else if (href.startsWith('#')) {
                href = location.href + href;
            }
        }

        // remove excess whitespace and escape quotation marks
        let title = node.getAttribute('title') || '';
        if (title) {
            title = cleanAttribute(title);
            title = ' "' + title.replace(/"/g, '\\"') + '"';
        }

        return '[' + content + '](' + href + title + ')';
    };
}

/**
 * convertImageToMarkdown converts an HTML image to a markdown image.
 * @param {*} content - the page's content within the HTML image.
 * @param {*} node - the HTML element node.
 * @returns {string}
 */
function convertImageToMarkdown(content, node) {
    let src = node.getAttribute('src') || '';
    if (!src) {
        return '';
    }

    // remove excess whitespace
    let alt = cleanAttribute(node.getAttribute('alt') || '');

    // make the URL absolute
    if (src.startsWith('//')) {
        src = 'https:' + src.replaceAll(' ', '%20');
    } else if (src.startsWith('/')) {
        const url = new URL(location.href);
        const base = url.origin;
        src = base + src;
    }

    // remove excess whitespace
    let title = cleanAttribute(node.getAttribute('title') || '');
    let titlePart = title ? ' "' + title + '"' : '';

    return '![' + alt + '](' + src + titlePart + ')';
}

/**
 * cleanAttribute replaces each group of whitespace characters containing at least
 * one newline character with one newline character. If the input is falsy, an empty
 * string is returned.
 * @param {string} attribute - the attribute to clean.
 * @returns {string}
 */
function cleanAttribute(attribute) {
    return attribute ? attribute.replace(/(\n+\s*)+/g, '\n') : ''
}
