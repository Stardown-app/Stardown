browser.browserAction.onClicked.addListener(async () => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    const title = tab.title.replaceAll(' ', '');
    const url = tab.url;
    await navigator.clipboard.writeText(`[${title}](${url})`);
});
