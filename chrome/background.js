chrome.action.onClicked.addListener(async (tab) => {
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
            const title = document.title.replaceAll(' ', '');
            const url = location.href;
            navigator.clipboard.writeText(`[${title}](${url})`);
        }
    });
});
