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
     * @private
     * Fetches all repos the user can push to.
     * @returns {Promise<Array<object>>}
     */
    async _getWritableRepos() {
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
            repos.push(...data.filter((repo) => repo.permissions?.push));

            hasNext = data.length === 100;
            page++;
        }

        return repos;
    }

    /**
     * Fetches all repositories where the user has write access (push permission).
     * @returns {Promise<Array<{name: string, full_name: string, owner: { login: string }}>>}
     */
    async getRepositories() {
        const writableRepos = await this._getWritableRepos();

        return writableRepos.map((repo) => ({
            name: repo.name,
            full_name: repo.full_name,
            owner: { login: repo.owner.login },
        }));
    }

    /**
     * Fetches repositories where the user has write access and where
     * at least one Markdown (.md) file exists in the entire repository.
     *
     * @returns {Promise<Array<{
     *   name: string,
     *   full_name: string,
     *   owner: { login: string },
     *   markdownFiles: Array<{ path: string }>
     * }>>}
     */
    async getRepositoriesWithMarkdownFiles() {
        const reposWithMarkdown = [];
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

            const repos = await res.json();
            const writableRepos = repos.filter(
                (repo) => repo.permissions?.push,
            );

            for (const repo of writableRepos) {
                try {
                    const treeUrl = `https://api.github.com/repos/${repo.owner.login}/${repo.name}/git/trees/main?recursive=1`;
                    const treeRes = await fetch(treeUrl, {
                        headers: { Authorization: `token ${this.token}` },
                    });

                    if (!treeRes.ok) {
                        console.warn(
                            `Could not load tree for ${repo.full_name}`,
                        );
                        continue;
                    }

                    const treeData = await treeRes.json();

                    const markdownFiles = treeData.tree
                        .filter(
                            (item) =>
                                item.type === "blob" &&
                                item.path.endsWith(".md"),
                        )
                        .map((item) => ({ path: item.path }));

                    if (markdownFiles.length > 0) {
                        reposWithMarkdown.push({
                            name: repo.name,
                            full_name: repo.full_name,
                            owner: { login: repo.owner.login },
                            markdownFiles,
                        });
                    }
                } catch (err) {
                    console.warn(
                        `Error checking ${repo.full_name}: ${err.message}`,
                    );
                }
            }

            hasNext = repos.length === 100;
            page++;
        }

        return reposWithMarkdown;
    }
}
