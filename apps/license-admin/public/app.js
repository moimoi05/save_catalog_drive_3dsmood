const $ = selector => document.querySelector(selector);
const loginView = $('#login-view');
const dashboardView = $('#dashboard-view');
const connectionStatus = $('#connection-status');
let csrfToken = null;

function showMessage(element, message, kind = '') {
  element.textContent = message;
  element.className = `message${kind ? ` ${kind}` : ''}`;
}

async function api(path, { method = 'GET', body, csrf = false } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (csrf && csrfToken) headers['X-CSRF-Token'] = csrfToken;
  const response = await fetch(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'same-origin',
    cache: 'no-store'
  });
  let result = {};
  try { result = await response.json(); } catch { /* The UI only needs the status when a response is not JSON. */ }
  if (!response.ok) {
    if (response.status === 401 && path !== '/api/session') setSignedIn(false);
    throw new Error(result.error || `Yêu cầu thất bại (${response.status}).`);
  }
  return result;
}

function setSignedIn(signedIn) {
  loginView.hidden = signedIn;
  dashboardView.hidden = !signedIn;
  const dot = document.createElement('span');
  dot.className = 'dot';
  if (signedIn) dot.classList.add('connected');
  connectionStatus.replaceChildren(dot, document.createTextNode(signedIn ? 'Phiên quản trị an toàn' : 'Chưa đăng nhập'));
  if (!signedIn) csrfToken = null;
}

function scanLabel(run) {
  if (run.status === 'queued' || run.status === 'in_progress' || run.status === 'waiting') return { text: 'Đang chạy', kind: 'running' };
  if (run.conclusion === 'success') return { text: 'Hoàn tất', kind: 'success' };
  if (run.conclusion === 'failure' || run.conclusion === 'timed_out' || run.conclusion === 'action_required') return { text: 'Có lỗi · mở GitHub để xem', kind: 'failure' };
  if (run.conclusion) return { text: run.conclusion, kind: '' };
  return { text: run.status || 'Không rõ', kind: '' };
}

function renderRuns(runs) {
  const list = $('#runs-list');
  $('#runs-count').textContent = String(runs.length);
  list.replaceChildren();
  if (!runs.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Chưa có lần quét nào.';
    list.append(empty);
    return;
  }
  for (const run of runs) {
    const item = document.createElement('div');
    item.className = 'run-item';
    const main = document.createElement('div');
    main.className = 'run-main';
    const time = document.createElement('span');
    time.className = 'run-time';
    const date = new Date(run.createdAt);
    time.textContent = Number.isNaN(date.valueOf()) ? 'Thời gian không rõ' : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
    const state = document.createElement('span');
    const label = scanLabel(run);
    state.className = `run-state${label.kind ? ` ${label.kind}` : ''}`;
    state.textContent = label.text;
    main.append(time, state);
    item.append(main);
    if (run.url) {
      const link = document.createElement('a');
      link.className = 'run-link';
      link.href = run.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Chi tiết ↗';
      item.append(link);
    }
    list.append(item);
  }
}

async function refreshRuns({ successMessage = 'Đã cập nhật trạng thái.' } = {}) {
  const button = $('#refresh-status');
  button.disabled = true;
  try {
    const result = await api('/api/catalog-status');
    renderRuns(result.runs);
    showMessage($('#scan-message'), successMessage, 'success');
  } catch (error) {
    showMessage($('#scan-message'), error.message, 'error');
  } finally {
    button.disabled = false;
  }
}

$('#login-form').addEventListener('submit', async event => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('button[type="submit"]');
  const message = $('#login-message');
  button.disabled = true;
  showMessage(message, 'Đang xác thực…');
  try {
    const password = $('#admin-password').value;
    const result = await api('/api/session', { method: 'POST', body: { password } });
    csrfToken = result.csrfToken;
    $('#admin-password').value = '';
    setSignedIn(true);
    showMessage(message, '');
    await refreshRuns();
  } catch (error) {
    showMessage(message, error.message, 'error');
  } finally {
    button.disabled = false;
  }
});

$('#logout-button').addEventListener('click', async () => {
  try { await api('/api/session', { method: 'DELETE', csrf: true }); } catch { /* Expired sessions are cleared locally below. */ }
  setSignedIn(false);
  $('#admin-password').focus();
});

$('#machine-code').addEventListener('input', event => {
  event.currentTarget.value = event.currentTarget.value.toUpperCase();
});

$('#license-form').addEventListener('submit', async event => {
  event.preventDefault();
  const button = $('#issue-button');
  const message = $('#license-message');
  const resultPanel = $('#license-result');
  button.disabled = true;
  resultPanel.hidden = true;
  showMessage(message, 'Đang ký license trên server…');
  try {
    const body = {
      machineCode: $('#machine-code').value.trim(),
      licenseId: $('#license-id').value.trim()
    };
    const result = await api('/api/issue-license', { method: 'POST', body, csrf: true });
    $('#license-result-id').textContent = result.licenseId;
    $('#license-token').value = result.licenseToken;
    resultPanel.hidden = false;
    showMessage(message, 'Đã tạo license. Sao chép token và gửi cho khách qua kênh riêng.', 'success');
  } catch (error) {
    showMessage(message, error.message, 'error');
  } finally {
    button.disabled = false;
  }
});

$('#copy-button').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText($('#license-token').value);
    $('#copy-button').textContent = 'Đã sao chép';
    window.setTimeout(() => { $('#copy-button').textContent = 'Sao chép'; }, 1800);
  } catch {
    $('#license-token').focus();
    $('#license-token').select();
    showMessage($('#license-message'), 'Không truy cập được clipboard. Token đã được chọn để bạn copy.', 'error');
  }
});

$('#scan-button').addEventListener('click', async event => {
  const button = event.currentTarget;
  button.disabled = true;
  showMessage($('#scan-message'), 'Đang gửi yêu cầu đến GitHub Actions…');
  try {
    await api('/api/catalog-scan', { method: 'POST', body: {}, csrf: true });
    await refreshRuns({ successMessage: 'Đã gửi yêu cầu quét. Dùng “Kiểm tra trạng thái” để xem khi catalog được cập nhật.' });
  } catch (error) {
    showMessage($('#scan-message'), error.message, 'error');
  } finally {
    button.disabled = false;
  }
});

$('#refresh-status').addEventListener('click', () => refreshRuns());

async function initialize() {
  try {
    const session = await api('/api/session');
    csrfToken = session.csrfToken ?? null;
    setSignedIn(session.authenticated === true);
    if (session.authenticated) await refreshRuns();
    else $('#admin-password').focus();
  } catch (error) {
    setSignedIn(false);
    showMessage($('#login-message'), error.message, 'error');
  }
}

initialize();
