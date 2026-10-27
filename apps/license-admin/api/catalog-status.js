import { createWorkflowClient } from '../server/github-actions.mjs';
import { authorizeRead } from '../server/route-auth.mjs';
import { jsonResponse } from '../server/security.mjs';

async function handle(request) {
  if (request.method !== 'GET') return jsonResponse(405, { error: 'Method not allowed.' }, { Allow: 'GET' });
  const authorization = authorizeRead(request);
  if (!authorization.ok) return jsonResponse(authorization.status, { error: authorization.message });
  if (!process.env.GITHUB_ACTIONS_TOKEN?.trim()) {
    return jsonResponse(503, { error: 'Trang admin chưa được kết nối với GitHub để quét Drive. Cần hoàn tất thiết lập một lần.' });
  }
  try {
    const client = createWorkflowClient({
      token: process.env.GITHUB_ACTIONS_TOKEN,
      repository: process.env.DRIVE_WORKFLOW_REPOSITORY || 'moimoi05/save_catalog_drive_3dsmood',
      workflowId: process.env.DRIVE_WORKFLOW_ID || 'drive-catalog-sync.yml'
    });
    return jsonResponse(200, { runs: await client.recentRuns() });
  } catch {
    return jsonResponse(503, { error: 'Không đọc được trạng thái quét từ GitHub.' });
  }
}

export default { fetch: handle };
