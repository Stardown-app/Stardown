# Stardown

A browser extension that copies to the clipboard a Markdown link to the current page.

## development

Since [Chrome does not support the Clipboard API in background scripts](https://stackoverflow.com/questions/61862872/how-to-copy-web-notification-content-to-clipboard/61977696#61977696), the Chrome version of Stardown also requires the `scripting` permission.

Firefox and Chrome [require different background objects](https://stackoverflow.com/questions/75043889/manifest-v3-background-scripts-service-worker-on-firefox) in manifest.json:

**Firefox**

```json
"background": {
    "scripts": ["scripts/background.js"]
},
```

**Chrome**

```json
"background": {
    "service_worker": "scripts/background.js"
},
```
