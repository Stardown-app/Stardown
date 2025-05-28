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

    /**
     * Exchanges the OAuth `code` for an access token using your backend.
     * @param {string} code - The `code` returned from GitHub OAuth redirect.
     * @param {string} stateFromUrl - The state string returned from GitHub, to verify against local storage.
     * @returns {Promise<void>}
     * @throws {Error} If the state doesn't match or token fetch fails.
     */
    async exchangeCodeForToken(code, stateFromUrl) {
        const stateSaved = localStorage.getItem("oauth_state");
        if (stateFromUrl !== stateSaved) {
            throw new Error("Invalid OAuth state");
        }

        const response = await fetch("/api/oauth/github/token", {
            method: "POST",
            body: JSON.stringify({ code }),
            headers: { "Content-Type": "application/json" },
        });

        const data = await response.json();
        this.token = data.access_token;
    }

    /**
     * Fetches all repositories where the user has write access (push permission).
     * @returns {Promise<Array<{name: string, full_name: string, owner: { login: string }}>>}
     */
    async getRepositories() {
        const repos = [];
        let page = 1;
        let hasNext = true;

        while (hasNext) {
            const res = await fetch(
                `https://api.github.com/user/repos?affiliation=owner,collaborator,organization_member&per_page=100&page=${page}`,
                {
                    headers: { Authorization: `token ${this.token}` },
                },
            );

            if (!res.ok) throw new Error("Failed to fetch repositories");

            const data = await res.json();
            const writable = data.filter(
                (repo) => repo.permissions && repo.permissions.push,
            );

            repos.push(...writable);
            hasNext = data.length === 100;
            page++;
        }

        return repos.map((repo) => ({
            name: repo.name,
            full_name: repo.full_name,
            owner: { login: repo.owner.login },
        }));
    }
}
