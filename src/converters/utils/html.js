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

// [Node: nodeType property | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType)
export const nodeTypes = {
    ELEMENT_NODE: 1,
    ATTRIBUTE_NODE: 2,
    TEXT_NODE: 3,
    CDATA_SECTION_NODE: 4,
    ENTITY_REFERENCE_NODE: 5,
    ENTITY_NODE: 6,
    PROCESSING_INSTRUCTION_NODE: 7,
    COMMENT_NODE: 8,
    DOCUMENT_NODE: 9,
    DOCUMENT_TYPE_NODE: 10,
    DOCUMENT_FRAGMENT_NODE: 11,
    NOTATION_NODE: 12,
    // `Node.ELEMENT_NODE`, `Node.ATTRIBUTE_NODE`, etc. are not used in Stardown because
    // `Node` is not defined by Node.js, which is used when running tests.
};

/**
 * isInlineNodes reports whether the given nodes are only text nodes and inline
 * elements.
 * @param {Node[]|NodeList|NodeListOf<ChildNode>|HTMLCollection} nodes
 * @returns {boolean}
 */
export function isInlineNodes(nodes) {
    let i = 0;
    while (nodes[i]?.nodeType === nodeTypes.TEXT_NODE) {
        i++;
    }

    return nodes[i] && isInlineElement(nodes[i]);
}

/**
 * isBlockFomattingContext reports whether nodes are in a block formatting context.
 * Introduction to formatting contexts:
 * https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flow_layout/Introduction_to_formatting_contexts
 * @param {Node[]|NodeList|NodeListOf<ChildNode>|HTMLCollection} nodes
 * @returns {boolean}
 */
export function isBlockFomattingContext(nodes) {
    for (let i = 0; i < nodes.length; i++) {
        if (isBlockElement(nodes[i])) {
            return true;
        }
    }

    return false;
}

/**
 * isBlockElement reports whether a node is a block element.
 * @param {Node} node
 * @returns {boolean}
 */
export function isBlockElement(node) {
    return (
        node.nodeType === nodeTypes.ELEMENT_NODE &&
        blockElementNames.includes(node.nodeName)
    );
}

/**
 * isInlineElement reports whether a node is an inline element.
 * @param {Node} node
 * @returns {boolean}
 */
export function isInlineElement(node) {
    return (
        node.nodeType === nodeTypes.ELEMENT_NODE &&
        inlineElementNames.includes(node.nodeName)
    );
}

// [HTML Block and Inline Elements | W3docs](https://www.w3docs.com/learn-html/html-block-and-inline-elements.html)
const blockElementNames = [
    'ADDRESS', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'CANVAS', 'DD', 'DIV', 'DL', 'DT',
    'FIELDSET', 'FIGCAPTION', 'FIGURE', 'FOOTER', 'FORM', 'H1', 'H2', 'H3', 'H4', 'H5',
    'H6', 'HEADER', 'HR', 'LI', 'MAIN', 'NAV', 'NOSCRIPT', 'OL', 'P', 'PRE', 'SECTION',
    'TABLE', 'TFOOT', 'UL', 'VIDEO',
];

const inlineElementNames = [
    'A', 'ABBR', 'ACRONYM', 'B', 'BDO', 'BIG', 'BR', 'BUTTON', 'CITE', 'CODE',
    'DEL', 'DFN', 'EM', 'I', 'IMG', 'INPUT', 'INS', 'KBD', 'LABEL', 'MARK', 'MAP',
    'OBJECT', 'OUTPUT', 'Q', 'S', 'SAMP', 'SCRIPT', 'SELECT', 'SMALL', 'SPAN',
    'STRONG', 'SUB', 'SUP', 'TEXTAREA', 'TIME', 'TT', 'VAR',
];

/**
 * improveConvertibility may modify a document fragment depending on the website to make
 * it more likely to convert to other markup languages well.
 * @param {DocumentFragment} frag
 * @param {Location} location
 * @returns {Promise<void>}
 */
export async function improveConvertibility(frag, location) {
    if (location.hostname === 'news.ycombinator.com') {
        // add the presentation role to every table
        frag.querySelectorAll('table').forEach(
            table => table.setAttribute('role', 'presentation')
        );
    } else if (location.hostname.match(/^(.+\.)?wikipedia\.org/)) {
        // remove each image of math and unhide its corresponding math element
        frag.querySelectorAll(
            'img.mwe-math-fallback-image-display,img.mwe-math-fallback-image-inline'
        ).forEach(
            img => img.remove()
        );
        frag.querySelectorAll('span.mwe-math-mathml-display').forEach(span => {
            span.setAttribute('style', 'display: block');
        });
    }
}

/**
 * removeHiddenElements removes from a fragment any descendant elements that are hidden
 * or not displayed.
 * @param {DocumentFragment} frag
 * @param {Document} doc
 * @returns {void}
 */
export function removeHiddenElements(frag, doc) {
    const SHOW_ELEMENT = 1;
    const iterator = doc.createNodeIterator(frag, SHOW_ELEMENT);

    let currentNode = iterator.nextNode();
    while (currentNode) {
        if (currentNode.nodeType === nodeTypes.ELEMENT_NODE) {
            const style = doc.defaultView.getComputedStyle(currentNode);
            if (
                currentNode.hasAttribute('hidden') ||
                style.getPropertyValue('display') === 'none' ||
                style.getPropertyValue('visibility') === 'hidden'
            ) {
                currentNode.parentNode.removeChild(currentNode);
            }
        }

        currentNode = iterator.nextNode();
    }
}

/**
 * removeStyles removes style-related attributes from each element in the given
 * fragment.
 * @param {DocumentFragment} frag
 * @returns {void}
 */
export function removeStyles(frag) {
    const SHOW_ELEMENT = 1;
    const iterator = document.createNodeIterator(frag, SHOW_ELEMENT);
    let currentNode = iterator.nextNode();
    while (currentNode) {
        currentNode.removeAttribute('style');
        currentNode.removeAttribute('bgcolor');

        currentNode = iterator.nextNode();
    }
}
