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

    /**
     * Initiates the OAuth login flow by redirecting the user to GitHub.
     * @returns {void}
     */
    login() {
        const scope = "repo read:user";
        const state = crypto.randomUUID(); // Prevent CSRF
        localStorage.setItem("oauth_state", state);

        const url = `https://github.com/login/oauth/authorize?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&scope=${scope}&state=${state}`;
        window.location.href = url;
    }
}
