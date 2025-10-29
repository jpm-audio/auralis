// src/audio/loader/types.ts
export type LoadingMode = 'preload' | 'stream' | 'lazy';

export interface SingleDescriptor {
  type: 'single';
  id: string;
  src: string;
  loadingMode?: LoadingMode;
  fallback?: string[];            // e.g., ["mp3","aac"]
  preDecode?: boolean;            // force decode on load (alias of preload)
}

export interface SpriteDescriptor {
  type: 'sprite';
  id: string;
  src: string;
  loadingMode?: LoadingMode;
  spriteMap: Record<string, [number, number]>; // ms
  fallback?: string[];
}

export type AssetDesc = SingleDesc | SpriteDesc;

export interface BankGroup {
  id: string;
  includes: string[]; // ids
}

export interface BankManifest {
  bankId: string;
  version?: number;
  defaults?: { loadingMode?: LoadingMode };
  assets: AssetDesc[];
  groups?: BankGroup[];
  platform?: Record<string, { prefer?: string[] }>;
}

export interface LoaderOptions {
  fetchInit?: RequestInit;
  maxParallel?: number;           // concurrent fetch/decode
  retry?: { attempts: number; backoffMs: number };
  baseUrl?: string;
}

export interface LoadedSingle {
  kind: 'single';
  mode: LoadingMode;
  buffer?: AudioBuffer;           // for preload
  media?: HTMLAudioElement;       // for stream
  srcResolved: string;
  refCount: number;
}

export interface LoadedSprite extends LoadedSingle {
  kind: 'sprite';
  spriteMap: Record<string, [number, number]>;
}