#!/usr/bin/env node
// Build index.json from plugins-meta.json.
//
// For every entry in plugins-meta.json it fetches the plugin's plugin.json
// from the repo root (via raw.githubusercontent.com with the HEAD pseudo
// branch — no API quota, no need to know the default branch name), validates
// it, and aggregates the metadata into index.json consumed by the Marcel SSH
// plugin market.
//
// Usage: node scripts/build-index.mjs
// (also invoked by .github/workflows/submit-plugin.yml)

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const rawUrl = (repo, path = '') =>
  `https://raw.githubusercontent.com/${repo}/HEAD/${path}`;

function fail(message) {
  console.error(`[build-index] ${message}`);
  process.exitCode = 1;
}

const meta = JSON.parse(await readFile(join(ROOT, 'plugins-meta.json'), 'utf8'));
if (!Array.isArray(meta)) fail('plugins-meta.json 必须是数组');

const plugins = [];
const seenIds = new Set();

for (const entry of meta) {
  const repo = entry?.repo;
  if (typeof repo !== 'string' || !/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    console.warn(`[build-index] 跳过非法仓库条目: ${JSON.stringify(entry)}`);
    continue;
  }
  try {
    const res = await fetch(rawUrl(repo, 'plugin.json'));
    if (!res.ok) {
      console.warn(`[build-index] ${repo} plugin.json 拉取失败 HTTP ${res.status}，跳过`);
      continue;
    }
    const manifest = await res.json();

    const id = manifest?.id;
    if (typeof id !== 'string' || !/^[a-z0-9][a-z0-9_-]*$/.test(id)) {
      console.warn(`[build-index] ${repo} plugin.json 缺少合法 id，跳过`);
      continue;
    }
    if (seenIds.has(id)) {
      console.warn(`[build-index] id 重复: ${id}，跳过 ${repo}`);
      continue;
    }
    seenIds.add(id);

    const icon = entry.icon;
    const iconOk =
      icon === null ||
      icon === undefined ||
      (typeof icon?.kind === 'string' &&
        ['emoji', 'img'].includes(icon.kind) &&
        typeof icon?.value === 'string' &&
        icon.value.length > 0);

    plugins.push({
      id,
      name: manifest.name ?? id,
      version: manifest.version ?? '0.0.0',
      publisher: manifest.publisher ?? '',
      minAppVersion: manifest.minAppVersion ?? null,
      description: manifest.description ?? '',
      capabilities: Array.isArray(manifest.capabilities) ? manifest.capabilities : [],
      category: typeof entry.category === 'string' && entry.category ? entry.category : 'other',
      icon: iconOk && icon ? icon : null,
      repoUrl: `https://github.com/${repo}`,
      updatedAt: new Date().toISOString().slice(0, 10),
    });
  } catch (err) {
    console.warn(`[build-index] ${repo} 处理失败: ${err.message}，跳过`);
  }
}

plugins.sort((a, b) => a.id.localeCompare(b.id));

const index = {
  generatedAt: new Date().toISOString(),
  plugins,
};
await writeFile(join(ROOT, 'index.json'), JSON.stringify(index, null, 2) + '\n');
console.log(`[build-index] index.json 已生成: ${plugins.length} 个插件`);
