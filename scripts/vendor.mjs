/** Vendor a tagged brand release into a product repository and verify it later.
 *
 *   node scripts/vendor.mjs sync --from <brand checkout> --into <dir>
 *   node scripts/vendor.mjs verify <dir> [--release <brand checkout>]
 *
 * `sync` requires a clean checkout whose HEAD is exactly a vX.Y.Z tag matching package.json. It copies
 * the reviewable set listed under `vendor.files` in that release's asset-manifest.json and writes
 * <dir>/brand.lock.json (repository, tag, commit and the SHA-256 of every file).
 * `verify` fails if a vendored file is missing, extra or differs from the lock. With --release it
 * also proves the lock against a brand checkout: the tag must name the locked commit, and every
 * locked hash must equal that commit's own bytes, so a lock cannot be edited to bless altered files.
 * Node.js only; deterministic and offline. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const LOCK = 'brand.lock.json';
const TAG = /^v(\d+\.\d+\.\d+)$/;
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const portable = p => typeof p === 'string' && p.length > 0 && !p.includes('\\') && !p.includes(':') && !p.includes('\0') && !p.startsWith('/') && p.split('/').every(part => part && part !== '.' && part !== '..') && p !== LOCK;
const git = (dir, args, encoding = 'utf8') => {
  const out = execFileSync('git', ['-C', dir, ...args], { encoding, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 * 1024 * 1024 });
  return encoding ? out.trim() : out;
};

/** The vendorable set declared by a brand checkout's manifest: `{ repository, files }`. */
export function vendorSet(manifest, label = 'asset-manifest.json') {
  const set = manifest?.vendor;
  if (!set || typeof set.repository !== 'string' || !/^[\w.-]+\/[\w.-]+$/.test(set.repository)) throw new Error(`${label}: vendor.repository must be "owner/name"`);
  if (!Array.isArray(set.files) || !set.files.length) throw new Error(`${label}: vendor.files must list files`);
  const seen = new Set();
  for (const file of set.files) {
    if (!portable(file)) throw new Error(`${label}: vendor.files has an invalid path ${JSON.stringify(file)}`);
    if (seen.has(file)) throw new Error(`${label}: vendor.files lists ${file} twice`);
    seen.add(file);
  }
  return { repository: set.repository, files: [...set.files].sort() };
}

/** Copies the release at `from` into `into` and writes the lock. Returns the lock object. */
export function sync({ from, into }) {
  if (!from || !into) throw new Error('sync needs --from <brand checkout> and --into <dir>');
  const changes = git(from, ['status', '--porcelain=v1', '--untracked-files=all']);
  if (changes) throw new Error(`brand checkout ${from} has uncommitted or untracked changes; vendor only a clean release:\n${changes}`);
  const commit = git(from, ['rev-parse', 'HEAD']);
  const tags = git(from, ['tag', '--points-at', 'HEAD']).split('\n').filter(tag => TAG.test(tag));
  if (tags.length !== 1) throw new Error(`brand checkout HEAD ${commit} must be exactly one vX.Y.Z release tag (found ${tags.length ? tags.join(', ') : 'none'}); check out the release you mean to pin`);
  const [tag] = tags;
  const version = JSON.parse(fs.readFileSync(path.join(from, 'package.json'), 'utf8')).version;
  if (`v${version}` !== tag) throw new Error(`tag ${tag} does not match package.json version ${version}`);
  const manifest = JSON.parse(fs.readFileSync(path.join(from, 'asset-manifest.json'), 'utf8'));
  const { repository, files } = vendorSet(manifest);
  // Files the manifest also hashes must agree with it, as a release consumer would check by hand.
  const listed = new Map();
  const walk = node => {
    if (Array.isArray(node)) node.forEach(walk);
    else if (node && typeof node === 'object') { if (typeof node.path === 'string' && node.sha256) listed.set(node.path, node.sha256); Object.values(node).forEach(walk); }
  };
  walk(manifest);

  const target = path.resolve(into);
  if (fs.existsSync(target) && fs.readdirSync(target).length && !fs.existsSync(path.join(target, LOCK))) {
    throw new Error(`${into} is not empty and has no ${LOCK}; refusing to replace a directory that is not a vendored brand release`);
  }
  const hashes = {};
  const copies = files.map(file => {
    const source = path.join(from, file);
    if (!fs.existsSync(source) || !fs.lstatSync(source).isFile()) throw new Error(`release ${tag} lists ${file} for vendoring, but it is not a regular file`);
    const bytes = fs.readFileSync(source);
    hashes[file] = sha256(bytes);
    if (listed.has(file) && listed.get(file) !== hashes[file]) throw new Error(`${file} differs from its asset-manifest.json hash in ${tag}`);
    return [file, bytes];
  });
  // Start empty so files dropped from a release never linger.
  fs.rmSync(target, { recursive: true, force: true });
  for (const [file, bytes] of copies) {
    fs.mkdirSync(path.dirname(path.join(target, file)), { recursive: true });
    fs.writeFileSync(path.join(target, file), bytes);
  }
  const lock = { lockfileVersion: 1, repository, tag, commit, files: hashes };
  fs.writeFileSync(path.join(target, LOCK), JSON.stringify(lock, null, 2) + '\n');
  return lock;
}

const readLock = dir => {
  const file = path.join(dir, LOCK);
  if (!fs.existsSync(file)) throw new Error(`${LOCK} not found in ${dir}`);
  const lock = JSON.parse(fs.readFileSync(file, 'utf8'));
  const problems = [];
  if (lock.lockfileVersion !== 1) problems.push(`${LOCK}: unsupported lockfileVersion ${lock.lockfileVersion}`);
  if (typeof lock.repository !== 'string' || !/^[\w.-]+\/[\w.-]+$/.test(lock.repository)) problems.push(`${LOCK}: repository must be "owner/name"`);
  if (!TAG.test(lock.tag ?? '')) problems.push(`${LOCK}: tag must be vX.Y.Z`);
  if (!/^[0-9a-f]{40}$/.test(lock.commit ?? '')) problems.push(`${LOCK}: commit must be a full SHA-1`);
  if (!lock.files || typeof lock.files !== 'object' || Array.isArray(lock.files) || !Object.keys(lock.files).length) problems.push(`${LOCK}: files must map paths to SHA-256 hashes`);
  else for (const [file, hash] of Object.entries(lock.files)) {
    if (!portable(file)) problems.push(`${LOCK}: invalid path ${JSON.stringify(file)}`);
    if (!/^[0-9a-f]{64}$/.test(hash ?? '')) problems.push(`${LOCK}: invalid SHA-256 for ${file}`);
  }
  return { lock, problems };
};

/** Lists every problem with a vendored directory; an empty list means it matches its lock. */
export function verify(dir, { release } = {}) {
  let lock, problems;
  try { ({ lock, problems } = readLock(dir)); }
  catch (error) { return { problems: [error.message] }; }
  if (problems.length) return { lock, problems };
  const present = new Set();
  const realRoot = fs.realpathSync(dir);
  const walk = relative => {
    for (const entry of fs.readdirSync(path.join(dir, relative), { withFileTypes: true })) {
      const p = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(p);
      else if (p !== LOCK) {
        if (!entry.isFile()) problems.push(`not a regular file: ${p}`);
        present.add(p);
      }
    }
  };
  walk('');
  for (const [file, hash] of Object.entries(lock.files)) {
    if (!present.has(file)) { problems.push(`missing: ${file}`); continue; }
    const full = path.join(dir, file);
    if (!fs.realpathSync(full).startsWith(realRoot + path.sep)) { problems.push(`escapes the vendored directory: ${file}`); continue; }
    if (fs.lstatSync(full).isFile() && sha256(fs.readFileSync(full)) !== hash) problems.push(`modified: ${file} differs from ${lock.repository} ${lock.tag}`);
  }
  for (const file of [...present].sort()) if (!Object.hasOwn(lock.files, file)) problems.push(`extra: ${file} is not part of ${lock.repository} ${lock.tag}`);

  if (release) {
    let commit;
    try { commit = git(release, ['rev-parse', '--verify', '--quiet', `refs/tags/${lock.tag}^{commit}`]); }
    catch { commit = ''; }
    if (!commit) problems.push(`release: ${release} has no tag ${lock.tag}`);
    else if (commit !== lock.commit) problems.push(`release: tag ${lock.tag} is ${commit}, but ${LOCK} records ${lock.commit}`);
    else {
      let manifest;
      try { manifest = JSON.parse(git(release, ['cat-file', 'blob', `${commit}:asset-manifest.json`])); }
      catch { problems.push(`release: ${lock.tag} has no readable asset-manifest.json`); }
      if (manifest) {
        const set = vendorSet(manifest, `${lock.tag} asset-manifest.json`);
        if (set.repository !== lock.repository) problems.push(`release: ${lock.tag} is ${set.repository}, but ${LOCK} names ${lock.repository}`);
        const locked = Object.keys(lock.files).sort();
        if (JSON.stringify(set.files) !== JSON.stringify(locked)) problems.push(`release: ${LOCK} files differ from the vendor set of ${lock.tag}`);
      }
      for (const [file, hash] of Object.entries(lock.files)) {
        let bytes;
        try { bytes = git(release, ['cat-file', 'blob', `${commit}:${file}`], null); }
        catch { problems.push(`release: ${file} does not exist in ${lock.tag}`); continue; }
        if (sha256(bytes) !== hash) problems.push(`release: ${LOCK} hash for ${file} is not the ${lock.tag} file`);
      }
    }
  }
  return { lock, problems };
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
  const [command, ...args] = process.argv.slice(2);
  const option = name => { const i = args.indexOf(name); return i >= 0 ? args.splice(i, 2)[1] : undefined; };
  const usage = 'Usage: vendor.mjs sync --from <brand checkout> --into <dir> | vendor.mjs verify <dir> [--release <brand checkout>]';
  try {
    if (command === 'sync') {
      const from = option('--from'), into = option('--into');
      if (!from || !into || args.length) throw new Error(usage);
      const lock = sync({ from, into });
      console.log(`Vendored ${Object.keys(lock.files).length} files from ${lock.repository} ${lock.tag} (${lock.commit}) into ${into}.`);
    } else if (command === 'verify') {
      const release = option('--release');
      if (args.length !== 1) throw new Error(usage);
      const result = verify(args[0], { release });
      if (result.problems.length) {
        for (const problem of result.problems) console.error(problem);
        console.error(`Vendored brand verification failed: ${result.problems.length} problem(s).`);
        process.exitCode = 1;
      } else console.log(`${args[0]} matches ${result.lock.repository} ${result.lock.tag} (${result.lock.commit}): ${Object.keys(result.lock.files).length} files${release ? ', proven against the release tag' : ''}.`);
    } else throw new Error(usage);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
