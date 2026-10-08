import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const gameDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../../Ragdoll-Hit');
const source = 'https://freetoplayz.github.io/ragdoll-hit/';
const maximumSize = 30 * 1024 * 1024;
const assets = [
  {
    path: 'MobileDetect.js',
    size: 39586,
    sha256: '929AE5416530AE6C38F1245656403B2A3A51D8C27C46A60CAB6718A19E35235B',
    signature: '',
  },
  {
    path: 'Build/v84.loader.js',
    size: 114199,
    sha256: '36ADF7CAAD3C3113A57F499C741359ACA6C12A11051A4291FA7F5F77976BC992',
    signature: 'function',
  },
  {
    path: 'Build/3276aa7c11496bcc48eb6908f112f0c3.js.unityweb',
    size: 365286,
    sha256: 'F03903333BE45FB5D00F8BE063984EA484F340F32F4E0B2BB71497AFF72A6E21',
    signature: '\nvar uni',
  },
  {
    path: 'Build/959bf1c60308f1c34bf072f43c3c17d4.data.unityweb',
    size: 13459814,
    sha256: '14B1C71965DAEF879F425661F92E2CAF4B10CCE1841501605BBD66827215CFBB',
    signature: 'UnityWebData1.0',
  },
  {
    path: 'Build/f23c0f3f40a28f1adce731399dde22aa.wasm.unityweb',
    size: 25480332,
    sha256: '8338EA05E4A9B8D0684049AD816203D72B04F0C064733AA110BE89A142A4C00D',
    signature: '\0asm',
  },
  {
    path: 'screenshots/1.jpg',
    size: 11126,
    sha256: 'D4064B7AE6DCDA44A2695BF86EE220C2FD14A4D861C99F6685136EF0CF816F09',
    signature: '\xff\xd8\xff',
  },
  {
    path: 'screenshots/2.jpg',
    size: 7138,
    sha256: '9001EB640B2E841F6F290A0813CD7612ED0C04FDACBA796DF0B1978D43E9F077',
    signature: '\xff\xd8\xff',
  },
];

function sha256(data) {
  return createHash('sha256').update(data).digest('hex').toUpperCase();
}

function hasSignature(data, expected) {
  const signature = Buffer.from(expected, 'binary');
  return data.subarray(0, signature.length).equals(signature);
}

async function matchesExisting(asset, output) {
  try {
    const data = await readFile(output);
    if (data.length !== asset.size || sha256(data) !== asset.sha256 || !hasSignature(data, asset.signature)) {
      throw new Error(`Existing Ragdoll Hit asset failed verification: ${asset.path}`);
    }
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function download(asset) {
  const output = resolve(gameDirectory, asset.path);
  if (await matchesExisting(asset, output)) return;

  const response = await fetch(new URL(asset.path, source), { signal: AbortSignal.timeout(120_000) });
  if (!response.ok || !response.body) {
    throw new Error(`Could not download ${asset.path} (HTTP ${response.status}).`);
  }
  const advertisedSize = Number(response.headers.get('content-length'));
  if (advertisedSize && advertisedSize > maximumSize) {
    throw new Error(`${asset.path} exceeds the ${maximumSize}-byte download limit.`);
  }

  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maximumSize) {
      await reader.cancel();
      throw new Error(`${asset.path} exceeds the ${maximumSize}-byte download limit.`);
    }
    chunks.push(Buffer.from(value));
  }

  const data = Buffer.concat(chunks, size);
  if (data.length !== asset.size || !hasSignature(data, asset.signature)) {
    throw new Error(`${asset.path} did not match its expected size or file signature.`);
  }
  if (sha256(data) !== asset.sha256) {
    throw new Error(`${asset.path} failed SHA-256 verification.`);
  }

  await mkdir(dirname(output), { recursive: true });
  const temporary = `${output}.${process.pid}.download`;
  try {
    await writeFile(temporary, data, { flag: 'wx' });
    await rename(temporary, output);
  } finally {
    await rm(temporary, { force: true });
  }
  console.log(`Downloaded and verified ${asset.path}.`);
}

for (const asset of assets) await download(asset);