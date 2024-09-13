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

/**
 * removeHiddenElements removes from a node any descendant elements that are hidden or
 * not displayed.
 * @param {Node} node
 * @param {Document} doc
 */
export function removeHiddenElements(node, doc) {
    const SHOW_ELEMENT = 1;
    const iterator = doc.createNodeIterator(node, SHOW_ELEMENT);

    const ELEMENT_NODE = 1;
    let currentNode = iterator.nextNode();
    while (currentNode) {
        if (currentNode.nodeType === ELEMENT_NODE) {
            const style = doc.defaultView.getComputedStyle(currentNode);
            if (style.display === 'none' || style.visibility === 'hidden') {
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
 */
export function removeStyles(frag) {
    const iterator = document.createNodeIterator(frag, NodeFilter.SHOW_ELEMENT);
    let currentNode = iterator.nextNode();
    while (currentNode) {
        currentNode.removeAttribute('style');
        currentNode.removeAttribute('bgcolor');

        currentNode = iterator.nextNode();
    }
}

/**
 * isInlineText reports whether the given nodes are only text nodes and inline text
 * elements.
 * @param {Node[]|NodeList|HTMLCollection} nodes
 * @returns {boolean}
 */
export function isInlineText(nodes) {
    let i = 0;
    const TEXT_NODE = 3;
    while (nodes[i]?.nodeType === TEXT_NODE) {
        i++;
    }

    const inlineTextElems = [
        'EM', 'STRONG', 'B', 'I', 'A', 'LABEL', 'CODE', 'S', 'INS', 'DEL', 'MARK',
        'SUB', 'SUP', 'TIME', 'Q', 'BIG', 'SMALL', 'CITE', 'DFN', 'VAR', 'SAMP', 'KBD',
    ];

    return nodes[i] && inlineTextElems.includes(nodes[i].nodeName);
}