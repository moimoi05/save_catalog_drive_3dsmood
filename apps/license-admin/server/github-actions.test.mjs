import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorkflowClient } from './github-actions.mjs';

test('dispatch uses only the configured repo and fixed main ref', async () => {
  let request;
  const client = createWorkflowClient({
    token: 'ghs_unit_test_token_1234567890',
    repository: 'owner/repository',
    workflowId: 'drive-catalog-sync.yml',
    fetchImpl: async (url, init) => {
      request = { url: String(url), init };
      return new Response(null, { status: 204 });
    }
  });
  assert.deepEqual(await client.dispatch(), { queued: true });
  assert.match(request.url, /repos\/owner\/repository\/actions\/workflows\/drive-catalog-sync\.yml\/dispatches$/);
  assert.equal(request.init.headers.Authorization, 'Bearer ghs_unit_test_token_1234567890');
  assert.deepEqual(JSON.parse(request.init.body), { ref: 'main' });
});

test('workflow status only returns bounded public fields and trusted GitHub links', async () => {
  const client = createWorkflowClient({
    token: 'ghs_unit_test_token_1234567890',
    repository: 'owner/repository',
    workflowId: 'drive-catalog-sync.yml',
    fetchImpl: async () => Response.json({ workflow_runs: [
      { id: 12, status: 'completed', conclusion: 'success', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:01:00Z', html_url: 'https://github.com/owner/repository/actions/runs/12', run_number: 9 },
      { id: 13, status: 'in_progress', html_url: 'https://attacker.example/run' }
    ] })
  });
  const runs = await client.recentRuns();
  assert.equal(runs.length, 2);
  assert.deepEqual(runs[0], {
    id: 12,
    status: 'completed',
    conclusion: 'success',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:01:00Z',
    url: 'https://github.com/owner/repository/actions/runs/12'
  });
  assert.equal(runs[1].url, null);
});

test('workflow client rejects untrusted repository settings and masks API errors', async () => {
  assert.throws(() => createWorkflowClient({ token: 'ghs_unit_test_token_1234567890', repository: 'owner/../../repo', workflowId: 'x.yml' }), /settings/i);
  const client = createWorkflowClient({
    token: 'ghs_unit_test_token_1234567890',
    repository: 'owner/repository',
    workflowId: 'drive-catalog-sync.yml',
    fetchImpl: async () => new Response('token details must not escape', { status: 403 })
  });
  await assert.rejects(client.dispatch(), error => {
    assert.match(error.message, /could not queue/i);
    assert.doesNotMatch(error.message, /token details|ghs_unit_test/);
    assert.equal(error.status, 503);
    return true;
  });
});
