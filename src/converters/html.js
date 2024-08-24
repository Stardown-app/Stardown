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

    let currentNode = iterator.nextNode();
    while (currentNode) {
        const style = currentNode.style;
        if (style.display === "none" || style.visibility === "hidden") {
            currentNode.parentNode.removeChild(currentNode);
        }

        currentNode = iterator.nextNode();
    }
}
