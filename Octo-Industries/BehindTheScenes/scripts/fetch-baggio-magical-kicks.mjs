import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const gameDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../../Baggio-Magical-Kicks');
const output = resolve(gameDirectory, 'games/baggio-magical-kicks.swf');
const source = 'https://www.footballgames.org/wp-content/games/baggio-magical-kicks.swf';
const expectedHash = '77B70319804B05FF9B59AD8724D675F6A384F0295684C74FE50F06CFD3D72F4E';
const expectedSize = 309221;
const maximumSize = 1_000_000;

function sha256(data) {
  return createHash('sha256').update(data).digest('hex').toUpperCase();
}

async function readExisting() {
  try {
    const data = await readFile(output);
    if (sha256(data) !== expectedHash) {
      throw new Error(`Existing Baggio SWF failed SHA-256 verification: ${output}`);
    }
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function download() {
  const response = await fetch(source, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok || !response.body) {
    throw new Error(`Could not download the original Baggio SWF (HTTP ${response.status}).`);
  }

  const advertisedSize = Number(response.headers.get('content-length'));
  if (advertisedSize && advertisedSize > maximumSize) {
    throw new Error(`The original Baggio SWF exceeded the ${maximumSize}-byte download limit.`);
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
      throw new Error(`The original Baggio SWF exceeded the ${maximumSize}-byte download limit.`);
    }
    chunks.push(Buffer.from(value));
  }

  const data = Buffer.concat(chunks, size);
  if (data.length !== expectedSize || data.subarray(0, 3).toString('ascii') !== 'CWS') {
    throw new Error('The downloaded Baggio file is not the expected compressed Flash 5 payload.');
  }
  if (sha256(data) !== expectedHash) {
    throw new Error('The downloaded Baggio SWF failed SHA-256 verification.');
  }

  await mkdir(dirname(output), { recursive: true });
  const temporary = `${output}.${process.pid}.download`;
  try {
    await writeFile(temporary, data, { flag: 'wx' });
    await rename(temporary, output);
  } finally {
    await rm(temporary, { force: true });
  }
  console.log('Downloaded and verified the original Baggio Magical Kicks SWF.');
}

if (!(await readExisting())) await download();