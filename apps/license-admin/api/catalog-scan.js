import { createWorkflowClient } from '../server/github-actions.mjs';
import { authorizeMutation } from '../server/route-auth.mjs';
import { jsonResponse } from '../server/security.mjs';

async function handle(request) {
  if (request.method !== 'POST') return jsonResponse(405, { error: 'Method not allowed.' }, { Allow: 'POST' });
  const authorization = authorizeMutation(request);
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
    await client.dispatch();
    return jsonResponse(202, { queued: true, message: 'Đã gửi yêu cầu quét catalog. Mở trạng thái để theo dõi workflow.' });
  } catch (error) {
    const status = error.status === 503 ? 503 : 502;
    return jsonResponse(status, { error: status === 503 ? 'GitHub chưa cấp quyền chạy workflow.' : 'Không thể gửi yêu cầu quét catalog.' });
  }
}

export default { fetch: handle };
