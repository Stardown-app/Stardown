chrome.action.onClicked.addListener(async (tab) => {
    if (navigator.clipboard) {  // Firefox
        const title = tab.title.replaceAll(' ', '');
        const url = tab.url;
        await navigator.clipboard.writeText(`[${title}](${url})`);
    } else {  // Chrome
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => {
                const title = document.title.replaceAll(' ', '');
                const url = location.href;
                navigator.clipboard.writeText(`[${title}](${url})`);
            }
        });
    }
});
