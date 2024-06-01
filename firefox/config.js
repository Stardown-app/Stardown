import * as menu from './menu.js';

browser.action = browser.browserAction; // for manifest v2 compatibility

browser.contextMenus.create(menu.pageItem);
browser.contextMenus.create(menu.selectionItem);
browser.contextMenus.create(menu.linkItem);
browser.contextMenus.create(menu.imageItem);
browser.contextMenus.create(menu.videoItem);
browser.contextMenus.create(menu.audioItem);

/**
 * updateContextMenu updates the options in the context menu based on the message from
 * the content script. This only works if the context menu is not visible.
 * @param {object} message - the message from the content script.
 * @param {boolean} message.isImage - whether the mouse is over an image.
 * @param {boolean} message.isLink - whether the mouse is over a link.
 * @returns {void}
 */
export function updateContextMenu(message) {
    if (message.isImage) {
        browser.contextMenus.update('link', { visible: false });
        browser.contextMenus.update('image', { visible: true });
    } else if (message.isLink) {
        browser.contextMenus.update('link', { visible: true });
        browser.contextMenus.update('image', { visible: false });
    }
}

/**
 * handleCopyRequest writes text to the clipboard and returns a content response object.
 * @param {string} text - the text to copy to the clipboard.
 * @returns {Promise<ContentResponse>}
 */
export async function handleCopyRequest(text) {
    try {
        await navigator.clipboard.writeText(text);
    } catch (err) {
        console.error(err);
        return {
            status: 0, // failure
            notifTitle: 'Failed to copy markdown',
            notifBody: err.message,
        };
    }
    return {
        status: 1, // successfully copied one item
        notifTitle: 'Markdown copied',
        notifBody: 'Your markdown can now be pasted',
    };
}

/**
 * setUpListeners sets up listeners.
 * @returns {void}
 */
function setUpListeners() {
    // TODO: try to have only one copy of this function definition in the project.
    // TODO: this function depends on handleRequest

    document.addEventListener('mouseover', (event) => {
        // This event listener is used to determine if any element that may be
        // right-clicked is a link or an image. This information is sent to the
        // background script to determine if the context menu item for copying link or
        // image markdown should be shown. This is necessary because the context menu
        // cannot be updated while it is visible.
        const isLink = event.target.nodeName === 'A';
        const isImage = event.target.nodeName === 'IMG';
        browser.runtime.sendMessage({ isLink, isImage });
    });

    document.addEventListener('contextmenu', (event) => {
        clickedElement = event.target;

        if (event.target.nodeName === 'A') {
            linkText = event.target.textContent;
        } else {
            linkText = null;
        }
    });

    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        // In Chromium, this listener must be synchronous and must send a response
        // immediately. True must be sent if the actual response will be sent
        // asynchronously.

        handleRequest(message).then((res) => {
            sendResponse(res);
        });

        return true; // needed to keep the message channel open for async responses
    });
}

setUpListeners();
