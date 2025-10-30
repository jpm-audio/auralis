export type LoadingMode = 'preload' | 'stream' | 'lazy';
export type AudioType = 'single' | 'sprite';
export type SpriteMap = Record<string, [number, number]>; // ms

export interface AudioDescription {
  type: AudioType;
  id: string;
  src: string;
  loadingMode?: LoadingMode;
  spriteMap?: SpriteMap; // ms
  fallback?: string[];            // e.g., ["mp3","aac"]
  preDecode?: boolean;            // force decode on load (alias of preload)
}

export interface SpriteClipDefinition { 
  start: number; 
  end: number 
}

export interface BankGroup {
  id: string;
  includes: string[]; // Audio ids
}

export interface BankManifest {
  bankId: string;
  version?: number;
  defaults?: { loadingMode?: LoadingMode };
  audios: AudioDescription[];
  groups?: BankGroup[];
  platform?: Record<string, { prefer?: string[] }>;
}

export interface LoaderOptions {
  fetchInit?: RequestInit;
  maxParallel?: number;           // concurrent fetch/decode
  retry?: { attempts: number; backoffMs: number };
  baseUrl?: string;
}

export interface LoadedAudio{
  kind: AudioType;
  mode: LoadingMode;
  buffer?: AudioBuffer;           // for preload
  media?: HTMLAudioElement;       // for stream
  srcResolved: string;
  refCount: number;
  spriteMap?: SpriteMap;
}