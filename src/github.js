/**
 * A client for authenticating with GitHub and interacting with its REST API to integrate into an enhancement for Stardown features.
 */
export class GitHubClient {
    /**
     * @param {string} clientId - GitHub OAuth App's client ID.
     * @param {string} redirectUri - Redirect URI registered in the OAuth app.
     */
    constructor(clientId, redirectUri) {
        /** @private @type {string} */
        this.clientId = clientId;

        /** @private @type {string} */
        this.redirectUri = redirectUri;

        /** @private @type {string|null} */
        this.token = null;
    }
}
