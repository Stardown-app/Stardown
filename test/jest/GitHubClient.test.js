import { GitHubClient } from "../../src/github";
import { jest } from "@jest/globals";

global.fetch = jest.fn();

describe("GitHubClient", () => {
    const clientId = "test-client-id";
    const redirectUri = "http://localhost/callback";
    let client;

    beforeEach(() => {
        client = new GitHubClient(clientId, redirectUri);
        client.token = "fake-token";
        fetch.mockClear();
    });

    test("getRepositories() returns repos with push permissions only", async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [
                {
                    name: "repo-1",
                    full_name: "user/repo-1",
                    owner: { login: "user" },
                    permissions: { push: true },
                },
                {
                    name: "repo-2",
                    full_name: "user/repo-2",
                    owner: { login: "user" },
                    permissions: { push: false },
                },
            ],
        });

        const repos = await client.getRepositories();

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(repos).toHaveLength(1);
        expect(repos[0].name).toBe("repo-1");
    });

    test("getRepositoriesWithMarkdownFiles() returns only repos with .md files in Git tree", async () => {
        // First API call: get user repos
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [
                {
                    name: "markdown-repo",
                    full_name: "user/markdown-repo",
                    owner: { login: "user" },
                    permissions: { push: true },
                },
            ],
        });

        // Second API call: get Git tree for 'markdown-repo'
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                tree: [
                    { type: "blob", path: "README.md" },
                    { type: "blob", path: "docs/setup.md" },
                    { type: "blob", path: "index.js" },
                ],
            }),
        });

        const repos = await client.getRepositoriesWithMarkdownFiles();

        expect(fetch).toHaveBeenCalledTimes(2);
        expect(repos).toHaveLength(1);
        expect(repos[0].name).toBe("markdown-repo");
        expect(repos[0].markdownFiles).toEqual([
            { path: "README.md" },
            { path: "docs/setup.md" },
        ]);
    });

    test("getRepositoriesWithMarkdownFiles() skips repos with no .md files", async () => {
        // get user repos
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [
                {
                    name: "js-only-repo",
                    full_name: "user/js-only-repo",
                    owner: { login: "user" },
                    permissions: { push: true },
                },
            ],
        });

        // get Git tree with no markdown files
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                tree: [
                    { type: "blob", path: "index.js" },
                    { type: "blob", path: "src/app.js" },
                ],
            }),
        });

        const repos = await client.getRepositoriesWithMarkdownFiles();

        expect(fetch).toHaveBeenCalledTimes(2);
        expect(repos).toHaveLength(0);
    });

    test("getRepositoriesWithMarkdownFiles() skips if Git tree fetch fails", async () => {
        // get user repos
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [
                {
                    name: "broken-repo",
                    full_name: "user/broken-repo",
                    owner: { login: "user" },
                    permissions: { push: true },
                },
            ],
        });

        // simulate failure to get Git tree
        fetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: async () => ({}),
        });

        const repos = await client.getRepositoriesWithMarkdownFiles();

        expect(fetch).toHaveBeenCalledTimes(2);
        expect(repos).toHaveLength(0);
    });
});
