/**
 * absolutize makes a URL absolute. If the URL is already absolute, it is returned
 * unchanged.
 * @param {string} url
 * @param {string} locationHref
 * @returns {string}
 */
export function absolutize(url, locationHref) {
    if (url.startsWith('//')) {
        return 'https:' + url;
    } else if (url.startsWith('/')) {
        const urlObj = new URL(locationHref);
        return urlObj.origin + url;
    } else if (url.startsWith('#')) {
        locationHref = locationHref.split('#')[0];
        return locationHref + url;
    }

    return url;
}

/**
 * removeIdAndTextFragment removes any HTML element ID and any text fragment from a URL.
 * If the URL has neither, it is returned unchanged.
 * @param {string} url
 * @returns {string}
 */
export function removeIdAndTextFragment(url) {
    // If the URL has an HTML element ID, any text fragment will also be in the `hash`
    // attribute of its URL object. However, if the URL has a text fragment but no HTML
    // element ID, the text fragment may be in the `pathname` attribute of its URL
    // object along with part of the URL that should not be removed.
    const urlObj = new URL(url);
    urlObj.hash = ''; // remove HTML element ID and maybe text fragment
    if (urlObj.pathname.includes(':~:text=')) {
        urlObj.pathname = urlObj.pathname.split(':~:text=')[0]; // definitely remove text fragment
    }
    return urlObj.toString();
}
