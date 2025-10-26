// tools/auralis-pack.ts
// Run: node auralis-pack.js --out dist/ui.bank --id ui_bank assets/ui/*.ogg
import { createWriteStream, readFileSync, writeFileSync } from 'fs';
import { argv } from 'node:process';
import { TextEncoder } from 'node:util';
import * as path from 'node:path';

const AURBANK_HEADER_SIZE = 64;
const MAGIC = 0x41555242; // "AURB"

type Codec = 'ogg' | 'aac' | 'opus' | 'wav';
function inferCodec(file: string): Codec {
  const ext = path.extname(file).toLowerCase().replace('.', '');
  if (ext === 'ogg') return 'ogg';
  if (ext === 'aac' || ext === 'm4a') return 'aac';
  if (ext === 'opus') return 'opus';
  if (ext === 'wav') return 'wav';
  throw new Error(`Unsupported codec: ${ext}`);
}
function hash32(str: string) {
  // Simple FNV-1a
  let h = 0x811c9dc5 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

interface InputAsset {
  id: string;      // logical name (e.g., "ui_click")
  file: string;    // path
  codec: Codec;
  data: Buffer;    // file bytes
}

function parseArgs() {
  const outIdx = argv.indexOf('--out');
  if (outIdx < 0 || outIdx === argv.length - 1) throw new Error('Use --out <path>');
  const outBase = argv[outIdx + 1]; // e.g., dist/ui.bank
  const files = argv.slice(outIdx + 2);
  const bankId = (argv.includes('--id') ? argv[argv.indexOf('--id') + 1] : path.basename(outBase));
  if (files.length === 0) throw new Error('No input files');
  return { outBase, files, bankId };
}

(async function main() {
  const { outBase, files, bankId } = parseArgs();

  const assets: InputAsset[] = files.map(f => {
    const id = path.basename(f, path.extname(f)); // logical id from filename
    const codec = inferCodec(f);
    const data = readFileSync(f);
    return { id, file: f, codec, data };
  });

  // Build Index
  const enc = new TextEncoder();
  const indexEntries: { idHash32: number; offset: bigint; length: bigint; codec: number; flags: number; nameBytes: Uint8Array }[] = [];
  let offset = BigInt(AURBANK_HEADER_SIZE); // header first, index after? We'll place index right after header.
  // We need to compute index size first (variable). So we assemble index buffer then compute chunks offset.
  // For simplicity: [HEADER][INDEX][CHUNKS]
  let indexSize = 0;
  for (const a of assets) {
    const nameBytes = enc.encode(a.id);
    indexSize += 26 + nameBytes.length; // per spec
  }
  const indexOffset = AURBANK_HEADER_SIZE;
  const chunksOffset = indexOffset + indexSize;
  let chunkPtr = BigInt(chunksOffset);

  for (const a of assets) {
    const nameBytes = enc.encode(a.id);
    const entry = {
      idHash32: hash32(a.id),
      offset: chunkPtr,
      length: BigInt(a.data.byteLength),
      codec: (a.codec === 'wav' ? 0 : a.codec === 'ogg' ? 1 : a.codec === 'aac' ? 2 : 3),
      flags: 0,
      nameBytes,
    };
    indexEntries.push(entry);
    chunkPtr += BigInt(a.data.byteLength);
  }

  // Allocate full buffer
  const fileSize = Number(chunkPtr);
  const bank = Buffer.alloc(fileSize);

  // Write header
  const dv = new DataView(bank.buffer, bank.byteOffset, bank.byteLength);
  dv.setUint32(0, MAGIC, true);
  dv.setUint16(4, 0x0100, true); // version 1.0
  dv.setUint16(6, 0, true);      // flags
  dv.setUint32(8, assets.length, true);
  dv.setUint32(12, indexOffset, true);
  dv.setUint32(16, indexSize, true);
  dv.setUint32(20, fileSize >>> 0, true);
  dv.setUint32(24, 0, true); // hi (not used for <4GB)
  // rest reserved (zeroed)

  // Write index
  let p = indexOffset;
  for (const e of indexEntries) {
    dv.setUint32(p + 0, e.idHash32, true);
    dv.setUint32(p + 4, Number(e.offset & 0xffffffffn), true);
    dv.setUint32(p + 8, Number((e.offset >> 32n) & 0xffffffffn), true);
    dv.setUint32(p + 12, Number(e.length & 0xffffffffn), true);
    dv.setUint32(p + 16, Number((e.length >> 32n) & 0xffffffffn), true);
    dv.setUint8 (p + 20, e.codec);
    dv.setUint8 (p + 21, e.flags);
    // 22..23 reserved
    dv.setUint16(p + 24, e.nameBytes.length, true);
    new Uint8Array(bank.buffer, bank.byteOffset + p + 26, e.nameBytes.length).set(e.nameBytes);
    p += 26 + e.nameBytes.length;
  }

  // Write chunks
  for (let i = 0; i < assets.length; i++) {
    const e = indexEntries[i];
    const a = assets[i];
    const start = Number(e.offset);
    bank.set(a.data, start);
  }

  // Write outputs
  const outBank = outBase.endsWith('.bank') ? outBase : `${outBase}.bank`;
  writeFileSync(outBank, bank);

  const meta = {
    bankId,
    version: 1,
    compression: 'none',
    assets: indexEntries.map((e, i) => ({
      id: assets[i].id,
      offset: Number(e.offset),
      length: Number(e.length),
      codec: (assets[i].codec),
      mode: assets[i].codec === 'ogg' || assets[i].codec === 'opus' ? 'lazy' : 'preload'
    })),
  };
  writeFileSync(`${outBank}.meta.json`, JSON.stringify(meta, null, 2));

  console.log(`Built bank: ${outBank} (${fileSize} bytes)`);
})();