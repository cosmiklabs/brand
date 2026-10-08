import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
test('font notices cannot be missing, changed, untracked, or silently rehashed', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'cosmik-manifest-'));
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'asset-manifest.json'), 'utf8'));
    const copyEntries = node => {
      if (Array.isArray(node)) node.forEach(copyEntries);
      else if (node && typeof node === 'object') {
        if (node.path && node.sha256) {
          const to = path.join(temp, node.path);
          fs.mkdirSync(path.dirname(to), {recursive:true});
          fs.copyFileSync(path.join(root, node.path), to);
        }
        Object.values(node).forEach(copyEntries);
      }
    };
    copyEntries(manifest);
    fs.mkdirSync(path.join(temp, 'scripts'));
    fs.copyFileSync(path.join(root, 'scripts/verify-manifest.mjs'), path.join(temp, 'scripts/verify-manifest.mjs'));
    const save = () => fs.writeFileSync(path.join(temp, 'asset-manifest.json'), JSON.stringify(manifest));
    const check = (...args) => spawnSync(process.execPath, [path.join(temp, 'scripts/verify-manifest.mjs'), ...args], {encoding:'utf8'});
    save();
    assert.equal(check().status, 0);
    const notice = manifest.font_licenses.find(e => e.path.endsWith('Spectral-OFL.txt'));
    const noticePath = path.join(temp, notice.path);
    const original = fs.readFileSync(noticePath);
    fs.unlinkSync(noticePath);
    assert.match(check().stdout, /missing file: fonts\/licenses\/Spectral-OFL.txt/);
    assert.equal(check().status, 1);
    fs.writeFileSync(noticePath, 'changed notice');
    assert.equal(check('--update-generated').status, 1);
    notice.editable = true;
    save();
    assert.equal(check('--update-generated').status, 1);
    const after = JSON.parse(fs.readFileSync(path.join(temp, 'asset-manifest.json'), 'utf8'));
    assert.equal(after.font_licenses.find(e => e.path === notice.path).sha256, notice.sha256);
    delete notice.editable;
    fs.writeFileSync(noticePath, original);
    manifest.font_licenses = manifest.font_licenses.filter(e => e !== notice);
    save();
    assert.equal(check().status, 1);
    assert.match(check().stdout, /font notice not listed with a hash/);
  } finally {
    // Only this test's mkdtemp directory, directly inside the system temporary folder.
    assert.equal(path.dirname(path.resolve(temp)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(temp).startsWith('cosmik-manifest-'));
    fs.rmSync(temp, {recursive:true, force:true});
  }
});
