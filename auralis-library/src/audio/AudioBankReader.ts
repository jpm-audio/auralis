// src/audio/bank/AuralisBankReader.ts
import { AURBANK_HEADER_SIZE, AURBANK_MAGIC, AurbHeader, AurbIndexEntry, AurbCodec, BankCatalog } from './AuralisBank';

function readUtf8(view: DataView, offset: number, length: number): string {
  const bytes = new Uint8Array(view.buffer, view.byteOffset + offset, length);
  return new TextDecoder('utf-8').decode(bytes);
}

export function parseAuralisBank(buffer: ArrayBuffer): BankCatalog {
  const view = new DataView(buffer);
  // Header (LE)
  const magic = view.getUint32(0, true);
  if (magic !== AURBANK_MAGIC) throw new Error('Invalid AURBANK magic');

  const version     = view.getUint16(4, true);
  const flags       = view.getUint16(6, true);
  const entryCount  = view.getUint32(8, true);
  const indexOffset = view.getUint32(12, true);
  const indexLength = view.getUint32(16, true);
  const fileSizeLo  = view.getUint32(20, true);
  const fileSizeHi  = view.getUint32(24, true);
  const fileSize    = (BigInt(fileSizeHi) << 32n) | BigInt(fileSizeLo);
  // bytes 28..63 reserved

  const header: AurbHeader = {
    magic, version, flags, entryCount, indexOffset, indexLength, fileSize
  };

  // Index table
  let p = indexOffset;
  const entries = new Map<string, AurbIndexEntry>();
  const entriesByHash = new Map<number, AurbIndexEntry>();

  for (let i = 0; i < entryCount; i++) {
    const idHash32 = view.getUint32(p + 0, true);
    const offLo = view.getUint32(p + 4, true);
    const offHi = view.getUint32(p + 8, true);
    const lenLo = view.getUint32(p + 12, true);
    const lenHi = view.getUint32(p + 16, true);
    const codec  = view.getUint8(p + 20) as AurbCodec;
    const eflags = view.getUint8(p + 21);
    // p+22..23 reserved
    const nameLen = view.getUint16(p + 24, true);
    const name    = readUtf8(view, p + 26, nameLen);

    const offset = (BigInt(offHi) << 32n) | BigInt(offLo);
    const length = (BigInt(lenHi) << 32n) | BigInt(lenLo);

    const entry: AurbIndexEntry = { idHash32, offset, length, codec, flags: eflags, name };
    entries.set(name, entry);
    entriesByHash.set(idHash32, entry);

    p += 26 + nameLen;
  }

  return { header, entries, entriesByHash, buffer };
}