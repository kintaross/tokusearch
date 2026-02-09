/**
 * Convert n8n workflows (columns) from Google Sheets to DB ingest HTTP APIs.
 *
 * Output files (already copied before running):
 * - n8n_workflow/columns-auto-noimage-db.json
 * - n8n_workflow/column-approval-db.json
 */

const fs = require('fs');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2), 'utf8');
}

function findNode(wf, name) {
  const n = (wf.nodes || []).find((x) => x.name === name);
  if (!n) throw new Error(`node not found: ${name}`);
  return n;
}

function replaceWithHttp(node, { method, url, jsonBody, extra = {} }) {
  node.type = 'n8n-nodes-base.httpRequest';
  node.typeVersion = 4.2;
  node.credentials = undefined;
  node.parameters = {
    method,
    url,
    authentication: 'none',
    sendHeaders: true,
    headerParameters: {
      parameters: [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'x-api-key', value: '={{$env.N8N_API_KEY}}' },
      ],
    },
    ...(method === 'GET'
      ? {}
      : {
          sendBody: true,
          specifyBody: 'json',
          jsonBody,
        }),
    options: {},
    ...extra,
  };
}

function addCodeNode(wf, { id, name, position, jsCode }) {
  wf.nodes.push({
    id,
    name,
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position,
    parameters: { jsCode },
  });
}

function connect(wf, from, to) {
  if (!wf.connections[from]) wf.connections[from] = { main: [[]] };
  if (!wf.connections[from].main) wf.connections[from].main = [[]];
  if (!wf.connections[from].main[0]) wf.connections[from].main[0] = [];
  wf.connections[from].main[0] = [{ node: to, type: 'main', index: 0 }];
}

function insertAfter(wf, from, middle, to) {
  connect(wf, from, middle);
  connect(wf, middle, to);
}

function convertAutoColumns() {
  const p = 'n8n_workflow/columns-auto-noimage-db.json';
  const wf = readJson(p);
  wf.name = 'コラム自動生成（画像なし版）（DB版）';

  // GetUnusedThemes -> HTTP GET, then unwrap to items
  const getUnused = findNode(wf, 'GetUnusedThemes');
  replaceWithHttp(getUnused, {
    method: 'GET',
    url: 'https://tokusearch.vercel.app/api/ingest/column-themes?used=false&limit=1000',
  });

  addCodeNode(wf, {
    id: 'unwrap-unused-themes',
    name: 'UnwrapUnusedThemes',
    position: [getUnused.position[0] + 200, getUnused.position[1]],
    jsCode:
      "const body = $json;\nconst themes = Array.isArray(body?.themes) ? body.themes : [];\nreturn themes.map(t => ({ json: t }));\n",
  });
  insertAfter(wf, 'GetUnusedThemes', 'UnwrapUnusedThemes', 'FilterUnusedThemes');

  // GetAllThemes -> HTTP GET, then unwrap to items
  const getAll = findNode(wf, 'GetAllThemes');
  replaceWithHttp(getAll, {
    method: 'GET',
    url: 'https://tokusearch.vercel.app/api/ingest/column-themes?limit=2000',
  });
  addCodeNode(wf, {
    id: 'unwrap-all-themes',
    name: 'UnwrapAllThemes',
    position: [getAll.position[0] + 200, getAll.position[1]],
    jsCode:
      "const body = $json;\nconst themes = Array.isArray(body?.themes) ? body.themes : [];\nreturn themes.map(t => ({ json: t }));\n",
  });

  // Rewire: CheckThemeCount false branch -> GetAllThemes -> UnwrapAllThemes -> CalculateNextNo
  if (wf.connections.CheckThemeCount?.main?.[1]) {
    wf.connections.CheckThemeCount.main[1] = [{ node: 'GetAllThemes', type: 'main', index: 0 }];
  }
  insertAfter(wf, 'GetAllThemes', 'UnwrapAllThemes', 'CalculateNextNo');

  // Patch CheckThemeDuplicates to also look at UnwrapAllThemes
  const dup = findNode(wf, 'CheckThemeDuplicates');
  if (dup.parameters?.jsCode && dup.parameters.jsCode.includes("$items('GetAllThemes')")) {
    dup.parameters.jsCode = dup.parameters.jsCode.replace(
      "$items('GetAllThemes')",
      "$items('UnwrapAllThemes')"
    );
  }

  // AddThemesToSheet -> Bundle once -> HTTP POST /api/ingest/column-themes
  const addThemes = findNode(wf, 'AddThemesToSheet');
  addCodeNode(wf, {
    id: 'bundle-new-themes',
    name: 'BundleThemesForIngest',
    position: [addThemes.position[0] - 200, addThemes.position[1]],
    jsCode:
      "if ($runIndex !== 0) return [];\nconst themes = $input.all().map(i => i.json);\nreturn [{ json: { themes } }];\n",
  });
  replaceWithHttp(addThemes, {
    method: 'POST',
    url: 'https://tokusearch.vercel.app/api/ingest/column-themes',
    jsonBody: '={{ $json }}',
  });

  // Rewire: CheckThemeDuplicates -> BundleThemesForIngest -> AddThemesToSheet -> BuildSlackThemesMessage
  insertAfter(wf, 'CheckThemeDuplicates', 'BundleThemesForIngest', 'AddThemesToSheet');
  if (wf.connections.AddThemesToSheet?.main?.[0]) {
    wf.connections.AddThemesToSheet.main[0] = [{ node: 'BuildSlackThemesMessage', type: 'main', index: 0 }];
  }

  // UpdateThemeUsed -> HTTP POST /api/ingest/column-themes/used
  const upd = findNode(wf, 'UpdateThemeUsed');
  replaceWithHttp(upd, {
    method: 'POST',
    url: 'https://tokusearch.vercel.app/api/ingest/column-themes/used',
    jsonBody:
      "={{ { no: $items('BuildArticlePrompt')[0].json.themeNo, used: true, used_at: new Date().toISOString() } }}",
  });

  writeJson(p, wf);
}

function convertApproval() {
  const p = 'n8n_workflow/column-approval-db.json';
  const wf = readJson(p);
  wf.name = 'コラムテーマ作成と承認（DB版）';

  const save = findNode(wf, 'SaveToSheet');
  replaceWithHttp(save, {
    method: 'POST',
    url: 'https://tokusearch.vercel.app/api/ingest/column-requests',
    jsonBody: '={{ $json }}',
  });

  const upd = findNode(wf, 'UpdateStatus');
  replaceWithHttp(upd, {
    method: 'POST',
    url: 'https://tokusearch.vercel.app/api/ingest/column-requests/status',
    jsonBody: "={{ { request_id: $items('PrepareColumnGeneration')[0].json.request_id, status: 'completed' } }}",
  });

  writeJson(p, wf);
}

try {
  convertAutoColumns();
  convertApproval();
  console.log('✅ converted workflows to DB versions');
} catch (e) {
  console.error('❌ convert failed:', e);
  process.exitCode = 1;
}

