/** Vendor a tagged release of any repository that follows the distribution contract, and verify it later.
 *
 *   node scripts/vendor.mjs sync --from <release checkout> --into <dir>
 *   node scripts/vendor.mjs verify <dir> [--release <release checkout>]
 *
 * Distribution contract, for the repository a consumer syncs from:
 *   - package.json has `name`, an X.Y.Z `version` and `repository` (owner/name, github:owner/name or a
 *     GitHub URL; `distribution.repository` in the manifest may name it instead, and must agree if both do);
 *   - asset-manifest.json has `distribution.files`: `{ path, sha256 }` for every file a consumer copies;
 *   - a release is a clean checkout whose HEAD is exactly the tag `v<version>`.
 *
 * `sync` checks every listed file's bytes against its hash before copying anything, copies the set, and
 * writes `<dir>/<short name>.lock.json`, where the short name is the package name without its scope:
 * `brand.lock.json` for @cosmiklabs/brand, `brand-tectra.lock.json` for @cosmiklabs/brand-tectra. The lock
 * records the package, repository, tag, commit and the SHA-256 of every file.
 * `verify` fails if a file is missing, extra or differs from the lock. When the synced set itself contains
 * a lock (a product brand ships its vendored foundation with `vendor/brand/brand.lock.json`), that nested
 * layer is verified too, so one command checks both layers. With --release it also proves the outer lock
 * against a checkout of its repository: the tag must name the locked commit, and every locked hash must
 * equal that commit's own bytes, so a lock cannot be edited to bless altered files. A nested lock is part
 * of those bytes; the product brand's own CI proves it against its release.
 * Reads lockfileVersion 1 locks (brand 0.8.0) and the release manifests that wrote them.
 * Node.js only; deterministic and offline. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const LOCKFILE_VERSION = 2;
export const LOCK_SUFFIX = '.lock.json';
const TAG = /^v(\d+\.\d+\.\d+)$/;
const SHA256 = /^[0-9a-f]{64}$/;
const REPOSITORY = /^[\w.-]+\/[\w.-]+$/;
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const isLockName = name => name.endsWith(LOCK_SUFFIX) && name.length > LOCK_SUFFIX.length;
const portable = p => typeof p === 'string' && p.length > 0 && !p.includes('\\') && !p.includes(':') && !p.includes('\0') && !p.startsWith('/') && p.split('/').every(part => part && part !== '.' && part !== '..');
const git = (dir, args, encoding = 'utf8') => {
  const out = execFileSync('git', ['-C', dir, ...args], { encoding, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 * 1024 * 1024 });
  return encoding ? out.trim() : out;
};
const readJson = (file, label = file) => {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) { throw new Error(`${label}: ${error.message}`); }
};

/** "owner/name" from a package.json `repository` value, or undefined if it is not a GitHub repository. */
export function repositoryName(value) {
  const text = typeof value === 'string' ? value : value?.url;
  if (typeof text !== 'string') return undefined;
  const match = text.match(/^(?:github:)?([\w.-]+)\/([\w.-]+?)(?:\.git)?$/)
    ?? text.match(/^(?:git\+)?(?:https?|ssh|git):\/\/(?:git@)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/)
    ?? text.match(/^git@github\.com:([\w.-]+)\/([\w.-]+?)(?:\.git)?$/);
  return match ? `${match[1]}/${match[2]}` : undefined;
}

/** The lock file name for a package: its name without the scope, plus `.lock.json`. */
export function lockFileName(packageName) {
  const short = typeof packageName === 'string' ? packageName.split('/').pop() : '';
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(short)) throw new Error(`package name ${JSON.stringify(packageName)} cannot name a lock file`);
  return `${short}${LOCK_SUFFIX}`;
}

/** The release a checkout's package.json and asset-manifest.json publish: `{ name, version, repository, files }`,
 * where `files` is `[{ path, sha256 }]` sorted by path. Throws on anything outside the contract. */
export function distributionSet(manifest, pkg, label = 'asset-manifest.json') {
  if (typeof pkg?.name !== 'string' || !pkg.name) throw new Error('package.json: name is required');
  if (!/^\d+\.\d+\.\d+$/.test(pkg.version ?? '')) throw new Error('package.json: version must be X.Y.Z');
  const set = manifest?.distribution;
  if (!set || typeof set !== 'object') throw new Error(`${label}: distribution section is required`);
  const fromPackage = pkg.repository === undefined ? undefined : repositoryName(pkg.repository);
  if (pkg.repository !== undefined && !fromPackage) throw new Error('package.json: repository must be owner/name, github:owner/name or a GitHub URL');
  if (set.repository !== undefined && (typeof set.repository !== 'string' || !REPOSITORY.test(set.repository))) throw new Error(`${label}: distribution.repository must be "owner/name"`);
  if (fromPackage && set.repository && fromPackage !== set.repository) throw new Error(`${label}: distribution.repository ${set.repository} differs from package.json repository ${fromPackage}`);
  const repository = set.repository ?? fromPackage;
  if (!repository) throw new Error(`package.json: repository is required (or distribution.repository in ${label})`);
  if (!Array.isArray(set.files) || !set.files.length) throw new Error(`${label}: distribution.files must list files`);
  const seen = new Set();
  for (const entry of set.files) {
    const file = entry?.path;
    if (!portable(file)) throw new Error(`${label}: distribution.files has an invalid path ${JSON.stringify(file)}`);
    if (seen.has(file)) throw new Error(`${label}: distribution.files lists ${file} twice`);
    if (!file.includes('/') && isLockName(file)) throw new Error(`${label}: distribution.files cannot include a top-level ${LOCK_SUFFIX} file (${file}); that name is the consumer's lock`);
    if (!SHA256.test(entry.sha256 ?? '')) throw new Error(`${label}: distribution.files has no valid sha256 for ${file}`);
    seen.add(file);
  }
  const files = set.files.map(({ path: p, sha256: hash }) => ({ path: p, sha256: hash })).sort((a, b) => (a.path < b.path ? -1 : 1));
  return { name: pkg.name, version: pkg.version, repository, files };
}

/** The file set of a release before 0.9.0 (`vendor` in asset-manifest.json), used only to prove v1 locks. */
function legacyVendorSet(manifest, label) {
  const set = manifest?.vendor;
  if (!set || typeof set.repository !== 'string' || !REPOSITORY.test(set.repository)) throw new Error(`${label}: vendor.repository must be "owner/name"`);
  if (!Array.isArray(set.files) || !set.files.every(portable)) throw new Error(`${label}: vendor.files must list paths`);
  return { repository: set.repository, files: [...set.files].sort() };
}

/** The lock at the root of a synced directory: its file name, or an error when there is none or more than one. */
export function findLock(dir) {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) throw new Error(`${dir} is not a directory`);
  const locks = fs.readdirSync(dir, { withFileTypes: true }).filter(entry => entry.isFile() && isLockName(entry.name)).map(entry => entry.name).sort();
  if (!locks.length) throw new Error(`no *${LOCK_SUFFIX} found in ${dir}`);
  if (locks.length > 1) throw new Error(`${dir} has more than one lock (${locks.join(', ')}); a synced directory holds exactly one at its root`);
  return locks[0];
}

const parseLock = (file, label) => {
  const lock = readJson(file, label);
  const problems = [];
  if (![1, LOCKFILE_VERSION].includes(lock.lockfileVersion)) problems.push(`${label}: unsupported lockfileVersion ${lock.lockfileVersion}`);
  if (lock.lockfileVersion === LOCKFILE_VERSION && (typeof lock.package !== 'string' || !lock.package)) problems.push(`${label}: package is required`);
  if (typeof lock.repository !== 'string' || !REPOSITORY.test(lock.repository)) problems.push(`${label}: repository must be "owner/name"`);
  if (!TAG.test(lock.tag ?? '')) problems.push(`${label}: tag must be vX.Y.Z`);
  if (!/^[0-9a-f]{40}$/.test(lock.commit ?? '')) problems.push(`${label}: commit must be a full SHA-1`);
  if (!lock.files || typeof lock.files !== 'object' || Array.isArray(lock.files) || !Object.keys(lock.files).length) problems.push(`${label}: files must map paths to SHA-256 hashes`);
  else for (const [file, hash] of Object.entries(lock.files)) {
    if (!portable(file) || (!file.includes('/') && isLockName(file))) problems.push(`${label}: invalid path ${JSON.stringify(file)}`);
    if (!SHA256.test(hash ?? '')) problems.push(`${label}: invalid SHA-256 for ${file}`);
  }
  return { lock, problems };
};

/** Reads and validates a lock file. Returns `{ lock, problems }`; throws only if it is missing or not JSON. */
export function readLock(dir, name = findLock(dir)) {
  const file = path.join(dir, name);
  if (!fs.existsSync(file)) throw new Error(`${name} not found in ${dir}`);
  return parseLock(file, name);
}

/** Copies the release at `from` into `into` and writes the lock. Returns the lock object. */
export function sync({ from, into }) {
  if (!from || !into) throw new Error('sync needs --from <release checkout> and --into <dir>');
  const changes = git(from, ['status', '--porcelain=v1', '--untracked-files=all']);
  if (changes) throw new Error(`checkout ${from} has uncommitted or untracked changes; vendor only a clean release:\n${changes}`);
  const commit = git(from, ['rev-parse', 'HEAD']);
  const tags = git(from, ['tag', '--points-at', 'HEAD']).split('\n').filter(tag => TAG.test(tag));
  if (tags.length !== 1) throw new Error(`checkout HEAD ${commit} must be exactly one vX.Y.Z release tag (found ${tags.length ? tags.join(', ') : 'none'}); check out the release you mean to pin`);
  const [tag] = tags;
  const pkg = readJson(path.join(from, 'package.json'), 'package.json');
  if (`v${pkg.version}` !== tag) throw new Error(`tag ${tag} does not match package.json version ${pkg.version}`);
  const manifestFile = path.join(from, 'asset-manifest.json');
  if (!fs.existsSync(manifestFile)) throw new Error(`${from} has no asset-manifest.json; it does not publish a distribution`);
  const manifest = readJson(manifestFile, 'asset-manifest.json');
  if (!manifest.distribution && manifest.vendor) throw new Error(`${tag} predates the distribution contract (its manifest has a vendor section); sync it with that release's own scripts/vendor.mjs`);
  const set = distributionSet(manifest, pkg);
  const lockName = lockFileName(set.name);

  const target = path.resolve(into);
  if (fs.existsSync(target) && fs.readdirSync(target).length) {
    let existing;
    try { existing = readLock(target).lock; }
    catch { throw new Error(`${into} is not empty and has no *${LOCK_SUFFIX} lock; refusing to replace a directory that is not a vendored release`); }
    if (existing.repository !== set.repository) throw new Error(`${into} holds ${existing.repository}, not ${set.repository}; refusing to replace a different repository's release`);
  }
  // Every byte is checked against the release's own hashes before anything is written.
  const copies = set.files.map(({ path: file, sha256: declared }) => {
    const source = path.join(from, file);
    if (!fs.existsSync(source) || !fs.lstatSync(source).isFile()) throw new Error(`release ${tag} lists ${file} for distribution, but it is not a regular file`);
    const bytes = fs.readFileSync(source);
    if (sha256(bytes) !== declared) throw new Error(`${file} differs from its distribution hash in ${tag} asset-manifest.json`);
    return [file, bytes];
  });
  const lock = { lockfileVersion: LOCKFILE_VERSION, package: set.name, repository: set.repository, tag, commit, files: Object.fromEntries(set.files.map(e => [e.path, e.sha256])) };

  // Build beside the target, verify the result (including any nested lock), then swap it in, so files
  // dropped from a release never linger and a release with a broken nested layer is never installed.
  const staging = `${target}.sync-${process.pid}`;
  fs.rmSync(staging, { recursive: true, force: true });
  try {
    for (const [file, bytes] of copies) {
      fs.mkdirSync(path.dirname(path.join(staging, file)), { recursive: true });
      fs.writeFileSync(path.join(staging, file), bytes);
    }
    fs.writeFileSync(path.join(staging, lockName), JSON.stringify(lock, null, 2) + '\n');
    const { problems } = verify(staging);
    if (problems.length) throw new Error(`release ${set.repository} ${tag} does not verify after copying:\n${problems.join('\n')}`);
    fs.rmSync(target, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.renameSync(staging, target);
  } finally {
    fs.rmSync(staging, { recursive: true, force: true });
  }
  return lock;
}

/** Checks one synced layer at `<root>/<relative>` against `lockName`, then any nested layer it contains. */
function verifyLayer(root, relative, lockName, realRoot, problems, layers) {
  const dir = relative ? path.join(root, relative) : root;
  const prefix = relative ? `${relative}/` : '';
  let lock, lockProblems;
  try { ({ lock, problems: lockProblems } = readLock(dir, lockName)); }
  catch (error) { problems.push(`${prefix}${error.message}`); return; }
  problems.push(...lockProblems.map(problem => `${prefix}${problem}`));
  if (lockProblems.length) return;
  layers.push({ directory: relative || '.', lockFile: `${prefix}${lockName}`, lock });
  const source = `${lock.repository} ${lock.tag}`;
  const present = new Set();
  const walk = sub => {
    for (const entry of fs.readdirSync(path.join(dir, sub), { withFileTypes: true })) {
      const p = sub ? `${sub}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(p);
      else if (p !== lockName) {
        if (!entry.isFile()) problems.push(`not a regular file: ${prefix}${p}`);
        present.add(p);
      }
    }
  };
  walk('');
  const nested = [];
  for (const [file, hash] of Object.entries(lock.files)) {
    if (!present.has(file)) { problems.push(`missing: ${prefix}${file}`); continue; }
    const full = path.join(dir, file);
    if (!fs.realpathSync(full).startsWith(realRoot + path.sep)) { problems.push(`escapes the vendored directory: ${prefix}${file}`); continue; }
    if (!fs.lstatSync(full).isFile()) continue;
    const bytes = fs.readFileSync(full);
    if (sha256(bytes) !== hash) problems.push(`modified: ${prefix}${file} differs from ${source}`);
    if (file.includes('/') && isLockName(path.posix.basename(file))) {
      let parsed;
      try { parsed = JSON.parse(bytes.toString('utf8')); } catch { parsed = undefined; }
      if (parsed && typeof parsed === 'object' && 'lockfileVersion' in parsed) nested.push(file);
    }
  }
  for (const file of [...present].sort()) if (!Object.hasOwn(lock.files, file)) problems.push(`extra: ${prefix}${file} is not part of ${source}`);
  // A nested lock's files are part of this layer's set, and must also match their own lock.
  for (const file of nested.sort()) verifyLayer(root, `${prefix}${path.posix.dirname(file)}`, path.posix.basename(file), realRoot, problems, layers);
}

/** Proves a lock against a checkout of the repository it names. Returns problems. */
function proveRelease(lock, lockName, release) {
  const problems = [];
  let commit;
  try { commit = git(release, ['rev-parse', '--verify', '--quiet', `refs/tags/${lock.tag}^{commit}`]); }
  catch { commit = ''; }
  if (!commit) return [`release: ${release} has no tag ${lock.tag}`];
  if (commit !== lock.commit) return [`release: tag ${lock.tag} is ${commit}, but ${lockName} records ${lock.commit}`];
  const blob = file => git(release, ['cat-file', 'blob', `${commit}:${file}`], null);
  let set;
  try {
    const manifest = JSON.parse(blob('asset-manifest.json').toString('utf8'));
    const label = `${lock.tag} asset-manifest.json`;
    if (manifest.distribution) {
      const pkg = JSON.parse(blob('package.json').toString('utf8'));
      const published = distributionSet(manifest, pkg, label);
      if (lock.package !== undefined && lock.package !== published.name) problems.push(`release: ${lock.tag} is package ${published.name}, but ${lockName} names ${lock.package}`);
      set = { repository: published.repository, files: published.files.map(e => e.path) };
    } else set = legacyVendorSet(manifest, label);
  } catch (error) { problems.push(`release: ${lock.tag} does not publish a readable distribution: ${error.message.split('\n')[0]}`); }
  if (set) {
    if (set.repository !== lock.repository) problems.push(`release: ${lock.tag} is ${set.repository}, but ${lockName} names ${lock.repository}`);
    if (JSON.stringify(set.files) !== JSON.stringify(Object.keys(lock.files).sort())) problems.push(`release: ${lockName} files differ from the distribution of ${lock.tag}`);
  }
  for (const [file, hash] of Object.entries(lock.files)) {
    let bytes;
    try { bytes = blob(file); }
    catch { problems.push(`release: ${file} does not exist in ${lock.tag}`); continue; }
    if (sha256(bytes) !== hash) problems.push(`release: ${lockName} hash for ${file} is not the ${lock.tag} file`);
  }
  return problems;
}

/** Lists every problem with a synced directory and each nested layer; an empty list means all match.
 * Returns `{ lock, lockFile, layers: [{ directory, lockFile, lock }], problems }`, outer layer first. */
export function verify(dir, { release } = {}) {
  let lockName;
  try { lockName = findLock(dir); }
  catch (error) { return { layers: [], problems: [error.message] }; }
  const problems = [], layers = [];
  verifyLayer(dir, '', lockName, fs.realpathSync(dir), problems, layers);
  const outer = layers[0];
  if (outer && release) problems.push(...proveRelease(outer.lock, lockName, release));
  return { lock: outer?.lock, lockFile: lockName, layers, problems };
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
  const [command, ...args] = process.argv.slice(2);
  const option = name => { const i = args.indexOf(name); return i >= 0 ? args.splice(i, 2)[1] : undefined; };
  const usage = 'Usage: vendor.mjs sync --from <release checkout> --into <dir> | vendor.mjs verify <dir> [--release <release checkout>]';
  const describe = layer => `${layer.lock.repository} ${layer.lock.tag} (${layer.lock.commit}): ${Object.keys(layer.lock.files).length} files`;
  try {
    if (command === 'sync') {
      const from = option('--from'), into = option('--into');
      if (!from || !into || args.length) throw new Error(usage);
      const lock = sync({ from, into });
      const { layers } = verify(into);
      console.log(`Vendored ${Object.keys(lock.files).length} files from ${lock.repository} ${lock.tag} (${lock.commit}) into ${into}; lock ${path.join(into, lockFileName(lock.package))}.`);
      for (const layer of layers.slice(1)) console.log(`  includes ${path.join(into, layer.directory)}: ${describe(layer)}.`);
    } else if (command === 'verify') {
      const release = option('--release');
      if (args.length !== 1) throw new Error(usage);
      const result = verify(args[0], { release });
      if (result.problems.length) {
        for (const problem of result.problems) console.error(problem);
        console.error(`Vendored release verification failed: ${result.problems.length} problem(s).`);
        process.exitCode = 1;
      } else {
        const [outer, ...inner] = result.layers;
        console.log(`${args[0]} matches ${describe(outer)}${release ? ', proven against the release tag' : ''}.`);
        for (const layer of inner) console.log(`  ${path.join(args[0], layer.directory)} matches ${describe(layer)}.`);
      }
    } else throw new Error(usage);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
