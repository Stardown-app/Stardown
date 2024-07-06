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
 * @param {string} bulletPoint - the Stardown setting for the bullet point character.
 * @param {string} subBrackets - the Stardown setting for what to substitute square
 * brackets with.
 * @param {string} selectionFormat - the Stardown setting for the selection format.
 * @param {boolean} omitNav - the Stardown setting for whether to omit nav elements.
 * @param {boolean} omitFooter - the Stardown setting for whether to omit footer
 * elements.
 * @param {Function(string): string} turndownEscape - the markdown escape function for
 * the Turndown service instance to use.
 * @returns {TurndownService}
 */
export function newTurndownService(
    bulletPoint, subBrackets, selectionFormat, omitNav, omitFooter, turndownEscape,
) {
    // https://github.com/mixmark-io/turndown
    const t = new TurndownService({
        bulletListMarker: bulletPoint,
        headingStyle: 'atx',
        emDelimiter: '*',
        codeBlockStyle: 'fenced',
        defaultReplacement: defaultReplacement,
    });

    // Turndown rules have precedence. For added rules specifically, for each HTML
    // element, the first encountered rule that has a matching filter is used. However,
    // it appears that using Turndown's addRule method with an existing rule's name
    // replaces the existing rule. That is why Stardown's addRules function is called
    // after `t.use(turndownPluginGfm.gfm);`, which adds some rules that Stardown
    // overwrites. More details about Turndown rule precedence here:
    // https://github.com/mixmark-io/turndown?tab=readme-ov-file#rule-precedence

    t.use(turndownPluginGfm.gfm); // GitHub Flavored Markdown

    addRules(t, subBrackets);
    if (selectionFormat === 'blockquote with link') {
        addBlockquoteRules(t);
    }

    t.escape = turndownEscape;

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
    if (omitNav) {
        t.remove('nav');
    }
    if (omitFooter) {
        t.remove('footer');
    }

    return t;
}

/**
 * defaultReplacement handles conversion to markdown for any and all nodes which are not
 * recognized by any other rule.
 * @param {string} content - the page's content within the unrecognized element.
 * @param {*} node - the HTML element node.
 * @returns {string}
 */
function defaultReplacement(content, node) {
    // Escape square brackets that are around markdown links because at least
    // some markdown renderers including Obsidian don't allow links to be within
    // unescaped square brackets.
    const pattern = /\[((?:[^\[\]]*(?<!!)\[[^\[\]]*\]\([^\(\)]+\)[^\[\]]*)+)\]/g;
    content = content.replaceAll(pattern, '\\[$1\\]');

    return node.isBlock ? '\n\n' + content + '\n\n' : content
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

    // The following rules are for tables, and they apply to both source-formatted
    // markdown and markdown in a block quote. Even though most or all markdown
    // renderers don't render tables within block quotes, Stardown puts into block
    // quotes not just the content of tables but also their markdown syntax because the
    // output will (at least usually) not look good either way, keeping table syntax is
    // more intuitive and easier for the user to edit into a table that's outside a
    // block quote, and maybe some markdown renderers do allow tables to be in block
    // quotes.

    t.addRule('tableCell', {
        filter: ['th', 'td'],
        replacement: function (content, node) {
            return ' | ' + content.replaceAll('\n', ' ').replaceAll(/\s+/g, ' ');
        },
    });

    t.addRule('tableRow', {
        filter: 'tr',
        replacement: function (content, node) {
            content = content.trim() + ' |\n';

            const cells = node.childNodes;
            if (!cells || cells.length === 0) {
                return content;
            }

            switch (getRowType(node)) {
                case RowType.onlyRow: // an onlyRow is a header row
                    // append a table divider after the row
                    for (let i = 0; i < cells.length; i++) {
                        content += '| --- ';
                    }
                    return content + '|\n';
                case RowType.headerRow:
                    return content;
                case RowType.firstBodyRow:
                    // insert a table divider before the row
                    content = '\n' + content;
                    for (let i = 0; i < cells.length; i++) {
                        content = ' --- |' + content;
                    }
                    return '\n| ' + content.trim() + '\n';
                case RowType.bodyRow:
                    return content;
                case RowType.error:
                    return content;
                default:
                    console.error(`tableRow replacement: unknown row type`);
                    return content;
            }
        },
    });

    t.addRule('table', {
        filter: function (node) {
            return node.nodeName === 'TABLE';
        },
        replacement: function (content, node) {
            if (isHideButtonTable(node)) {
                return '';
            }
            return '\n' + content + '\n';
        },
    });
}

/**
 * addBlockquoteRules adds to a Turndown service instance custom Turndown rules for
 * handling markdown that will be put into a block quote.
 * @param {TurndownService} t - the Turndown service instance.
 * @returns {void}
 */
function addBlockquoteRules(t) {
    t.addRule('heading', {
        filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
        replacement: function (content, node, options) {
            return '\n\n**' + content + '**\n\n'
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
 * RowType is an enum for the different types of rows.
 */
const RowType = {
    error: 'error',
    onlyRow: 'onlyRow', // an onlyRow is a header row
    headerRow: 'headerRow',
    firstBodyRow: 'firstBodyRow',
    bodyRow: 'bodyRow',
};

/**
 * getRowType determines the type of a given table row.
 * @param {*} tr - the tr element.
 * @returns {RowType}
 */
function getRowType(tr) {
    const parent = tr.parentNode;
    const trs = parent.childNodes;
    switch (parent.nodeName) {
        case 'TABLE':
            if (trs.length === 1) {
                return RowType.onlyRow;
            } else if (trs[0] === tr) {
                return RowType.headerRow;
            } else if (trs[1] === tr) {
                return RowType.firstBodyRow;
            } else {
                return RowType.bodyRow;
            }
        case 'THEAD':
            const thead = parent;
            const table1 = thead.parentNode;
            if (table1.childNodes.length === 1 && trs.length === 1) {
                return RowType.onlyRow;
            } else {
                return RowType.headerRow;
            }
        case 'TBODY':
            const tbody = parent;
            const table2 = tbody.parentNode;
            if (table2.childNodes.length === 1 && trs.length === 1) {
                return RowType.onlyRow;
            }
            const prev = tbody.previousSibling;
            if (!prev) {
                if (trs[0] === tr) {
                    return RowType.headerRow;
                } else if (trs[1] === tr) {
                    return RowType.firstBodyRow;
                } else {
                    return RowType.bodyRow;
                }
            }
            if (prev.nodeName !== 'THEAD') {
                // this tbody is not the table's first tbody
                return RowType.bodyRow;
            }
            // this tbody is the table's first tbody
            if (trs[0] === tr) {
                return RowType.firstBodyRow;
            } else {
                return RowType.bodyRow;
            }
        default:
            console.error('getRowType: unknown parent node:', parent.nodeName);
            return RowType.error;
    }
}

/**
 * isHideButtonTable reports whether an HTML table contains nothing but a "hide" button.
 * These tables are erroneously created by Turndown from some Wikipedia tables that have
 * a "hide" button in their top-right corner.
 * @param {*} node - the HTML element node.
 * @returns {boolean}
 */
function isHideButtonTable(node) {
    const trs = node.querySelectorAll('tr');
    if (trs.length !== 1) {
        return false;
    }
    const tds = trs[0].querySelectorAll('td');
    if (tds.length !== 0) {
        return false;
    }
    const ths = trs[0].querySelectorAll('th');
    if (ths.length !== 1) {
        return false;
    }
    const buttons = ths[0].querySelectorAll('button');
    if (buttons.length !== 1) {
        return false;
    }
    return buttons[0].textContent === 'hide';
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
     * @param {string} content - the page's content within the HTML anchor. If the
     * anchor contains some elements like inline SVGs, this variable will be falsy.
     * @param {*} node - the HTML element node.
     * @returns {string}
     */
    return function (content, node) {
        if (!content) { // if the link's title would be empty
            return ''; // don't create the link
        }

        // replace square brackets in the anchor element's content if and only if they
        // aren't all for images
        const mdImagesPattern = /^\s*(?:!\[[^\]]*\]\([^\)]*\)\s*)+\s*$/;
        if (!content.match(mdImagesPattern)) {
            content = replaceBrackets(content, subBrackets);
        }

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

        return '[' + content + '](' + href + ')';
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
