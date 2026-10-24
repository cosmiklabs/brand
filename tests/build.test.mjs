import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { assertCleanTree } from '../scripts/build.mjs';

test('reproducibility rejects new, staged, deleted and modified files', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cosmik-build-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', args, { cwd: directory, stdio: 'pipe', env: { ...process.env, GIT_CONFIG_GLOBAL: os.devNull, GIT_CONFIG_SYSTEM: os.devNull } });
  git('init', '-q');
  fs.writeFileSync(path.join(directory, 'source.txt'), 'original');
  git('add', 'source.txt');
  git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'fixture');
  assert.doesNotThrow(() => assertCleanTree(directory));
  fs.writeFileSync(path.join(directory, 'new-output.svg'), 'new generated export');
  assert.throws(() => assertCleanTree(directory), /new-output.svg/);
  git('add', 'new-output.svg');
  assert.throws(() => assertCleanTree(directory), /new-output.svg/);
  git('reset', '-q', 'HEAD', '--', 'new-output.svg');
  fs.unlinkSync(path.join(directory, 'new-output.svg'));
  fs.writeFileSync(path.join(directory, 'source.txt'), 'modified');
  assert.throws(() => assertCleanTree(directory), /source.txt/);
  fs.unlinkSync(path.join(directory, 'source.txt'));
  assert.throws(() => assertCleanTree(directory), /source.txt/);
});
