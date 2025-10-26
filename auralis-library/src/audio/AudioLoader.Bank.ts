// src/audio/loader/AudioLoader.Bank.ts (extensión de tu AudioLoader)
import { parseAuralisBank, BankCatalog, AurbCodec } from '../bank/AuralisBankReader';
import { LoadingMode } from './types';

export interface BankMetaAsset {
  id: string;
  offset: number;   // mirrors binary (for sanity checks, optional)
  length: number;
  codec: keyof typeof AurbCodec | 'ogg' | 'aac' | 'opus' | 'wav';
  mode: LoadingMode; // 'preload' | 'stream' | 'lazy'
}

export interface BankMeta {
  bankId: string;
  version: number;
  compression?: 'brotli' | 'gzip' | 'none';
  assets: BankMetaAsset[];
}

export class AudioLoaderBankExt {
  private bankCatalogs = new Map<string, BankCatalog>();
  private bankMeta     = new Map<string, BankMeta>();

  /** Fetch whole .aurbank (MVP) and parse header + index */
  async loadBankBinary(bankId: string, bankUrl: string, metaUrl?: string) {
    const res = await fetch(bankUrl);
    if (!res.ok) throw new Error(`Failed to fetch bank: ${bankUrl}`);
    const buf = await res.arrayBuffer();
    const catalog = parseAuralisBank(buf);
    this.bankCatalogs.set(bankId, catalog);

    if (metaUrl) {
      const metaRes = await fetch(metaUrl);
      if (!metaRes.ok) throw new Error(`Failed to fetch bank meta: ${metaUrl}`);
      const meta = await metaRes.json() as BankMeta;
      this.bankMeta.set(bankId, meta);
      // Opcional: validar offsets/lengths con el índice binario
    }
  }

  /** Decode a single asset from a bank (returns AudioBuffer). */
  async decodeFromBank(ctx: AudioContext, bankId: string, assetId: string): Promise<AudioBuffer> {
    const catalog = this.bankCatalogs.get(bankId);
    if (!catalog) throw new Error(`Bank not loaded: ${bankId}`);

    const entry = catalog.entries.get(assetId);
    if (!entry) throw new Error(`Asset not found in bank: ${assetId}`);

    // Slice a view over the big buffer (no copy)
    const start = Number(entry.offset);
    const end   = start + Number(entry.length);
    const slice = catalog.buffer.slice(start, end); // may copy in some engines; acceptable for MVP

    // decodeAudioData expects a complete file container (ogg/aac/opus/wav)
    const buffer = await ctx.decodeAudioData(slice);
    return buffer;
  }
}