const GITHUB_API = 'https://api.github.com';
const OWNER_REPO = /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\/[A-Za-z0-9_.-]{1,100}$/;
const WORKFLOW_ID = /^[A-Za-z0-9_.-]{1,200}$/;

export function createWorkflowClient({ token, repository, workflowId, fetchImpl = fetch }) {
  if (typeof token !== 'string' || token.length < 20 || token.length > 500) throw new Error('GitHub Actions token is missing or invalid.');
  if (!OWNER_REPO.test(repository ?? '') || !WORKFLOW_ID.test(workflowId ?? '')) throw new Error('GitHub workflow settings are invalid.');

  async function request(path, init = {}) {
    let response;
    try {
      response = await fetchImpl(`${GITHUB_API}/repos/${repository}/${path}`, {
        ...init,
        redirect: 'error',
        signal: AbortSignal.timeout(15_000),
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
          ...init.headers
        }
      });
    } catch {
      throw Object.assign(new Error('Could not reach GitHub Actions.'), { status: 502 });
    }
    return response;
  }

  return Object.freeze({
    async dispatch() {
      const response = await request(`actions/workflows/${encodeURIComponent(workflowId)}/dispatches`, {
        method: 'POST',
        body: JSON.stringify({ ref: 'main' })
      });
      if (response.status !== 204) throw Object.assign(new Error('GitHub could not queue the catalog scan. Check the repository token and workflow.'), { status: response.status === 401 || response.status === 403 ? 503 : 502 });
      return { queued: true };
    },

    async recentRuns() {
      const response = await request(`actions/workflows/${encodeURIComponent(workflowId)}/runs?branch=main&per_page=8`);
      if (!response.ok) throw Object.assign(new Error('Could not read catalog scan status from GitHub.'), { status: response.status === 401 || response.status === 403 ? 503 : 502 });
      let result;
      try {
        result = await response.json();
      } catch {
        throw Object.assign(new Error('GitHub returned an invalid workflow status response.'), { status: 502 });
      }
      if (!result || !Array.isArray(result.workflow_runs)) throw Object.assign(new Error('GitHub returned an invalid workflow status response.'), { status: 502 });
      return result.workflow_runs.slice(0, 8).map(run => ({
        id: Number.isSafeInteger(run.id) ? run.id : null,
        status: typeof run.status === 'string' ? run.status : 'unknown',
        conclusion: typeof run.conclusion === 'string' ? run.conclusion : null,
        createdAt: typeof run.created_at === 'string' ? run.created_at : null,
        updatedAt: typeof run.updated_at === 'string' ? run.updated_at : null,
        url: typeof run.html_url === 'string' && run.html_url.startsWith('https://github.com/') ? run.html_url : null
      }));
    }
  });
}
