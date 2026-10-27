import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const page = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const workflow = await readFile(new URL('../../../.github/workflows/drive-catalog-sync.yml', import.meta.url), 'utf8');
const pagesWorkflow = await readFile(new URL('../../../.github/workflows/library-pages.yml', import.meta.url), 'utf8');

test('admin can tell which button refreshes the catalog after uploading to Drive', () => {
  assert.match(page, /id="scan-button"[^>]*>Làm mới catalog từ Drive<\/button>/);
  assert.match(page, /id="refresh-status"[^>]*>Kiểm tra trạng thái<\/button>/);
  assert.match(page, /Sau khi admin tải model lên Drive/);
  assert.doesNotMatch(page, /Lịch tự động: mỗi tuần/);
});

test('catalog workflow runs only on manual request and still publishes Pages', () => {
  assert.match(workflow, /^name: Drive catalog sync$/m);
  assert.match(workflow, /^  workflow_dispatch:\s*$/m);
  assert.doesNotMatch(workflow, /^  schedule:/m);
  assert.match(workflow, /publish-pages:\r?\n\s+name: Publish latest catalog to GitHub Pages/);
});

test('every GitHub Action used for catalog Pages publishing is pinned to a commit SHA', () => {
  const references = [...`${workflow}\n${pagesWorkflow}`.matchAll(/^[ \t]*(?:-\s*)?uses:[ \t]+([^\s]+)/gm)].map(([, reference]) => reference);
  assert.ok(references.length > 0);
  for (const reference of references) assert.match(reference, /@[0-9a-f]{40}$/);
});
