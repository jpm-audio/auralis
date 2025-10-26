// src/audio/bank/AuralisBank.ts
export const AURBANK_MAGIC = 0x41555242; // "AURB" LE
export const AURBANK_HEADER_SIZE = 64;

export enum AurbCodec {
  WAV = 0,
  OGG = 1,
  AAC = 2,
  OPUS = 3,
}

export enum AurbFlags {
  NONE = 0,
  COMPRESSED = 1 << 0,   // container-level (rare). Usually per-chunk via codec.
  ENCRYPTED  = 1 << 1,
}

export interface AurbHeader {
  magic: number;      // "AURB"
  version: number;    // e.g. 0x0100
  flags: number;      // AurbFlags
  entryCount: number;
  indexOffset: number;
  indexLength: number;
  fileSize: bigint;
}

export interface AurbIndexEntry {
  idHash32: number;          // collision-safe enough for lookup + name fallback
  offset: bigint;            // byte offset
  length: bigint;            // byte length
  codec: AurbCodec;          // stream / preload decision will depend on meta
  flags: number;             // per-entry flags (stream/lazy/encrypted)
  name: string;              // UTF-8 asset name (logical id)
}

export interface BankCatalog {
  header: AurbHeader;
  entries: Map<string, AurbIndexEntry>;      // name → entry
  entriesByHash: Map<number, AurbIndexEntry>;
  buffer: ArrayBuffer;                        // full bank file (MVP)
}