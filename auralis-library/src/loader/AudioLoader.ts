// src/audio/loader/AudioLoader.ts
import type {
  AssetDesc, BankManifest, LoaderOptions, LoadingMode,
  LoadedSingle, LoadedSprite, SingleDesc, SpriteDesc
} from './types';

export class AudioLoader {
  private audioContext!: AudioContext;
  private options: Required<LoaderOptions>;
  private cache = new Map<string, LoadedSingle | LoadedSprite>();
  private groupIndex = new Map<string, Set<string>>();

  constructor() {
    this.options = {
      fetchInit: {},
      maxParallel: 4,
      retry: { attempts: 2, backoffMs: 350 },
      baseUrl: '',
    };
  }

  /** Increase external reference count (e.g., when grouped in a bank). */
  private incRef(id: string) {
    const it = this.cache.get(id);
    if (it) it.refCount++;
  }
  
  private createMedia(src: string) {
    const el = new Audio();
    el.src = src;
    el.preload = 'auto';
    el.crossOrigin = 'anonymous';
    return el;
  }

  private async fetchAndDecode(url: string) {
    const buf = await this.fetchWithRetry(url);
    return await this.audioContext.decodeAudioData(buf);
  }

  private async fetchWithRetry(url: string) {
    let attempt = 0;
    const { attempts, backoffMs } = this.options.retry;
    for (;;) {
      try {
        const res = await fetch(this.resolveUrl(url), this.options.fetchInit);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const arrayBuf = await res.arrayBuffer();
        return arrayBuf;
      } catch (e) {
        attempt++;
        if (attempt > attempts) throw e;
        await new Promise(r => setTimeout(r, backoffMs * attempt));
      }
    }
  }

  private resolveUrl(url: string) {
    if (!this.options.baseUrl) return url;
    if (/^https?:\/\//i.test(url)) return url;
    return this.options.baseUrl.replace(/\/+$/, '') + '/' + url.replace(/^\/+/, '');
  }

  private pickSource(src: string, fallback?: string[]) {
    // Very simple extension-based fallback; can be improved by canPlayType probing.
    if (!fallback || fallback.length === 0) return src;
    const url = new URL(this.resolveUrl(src), location.href);
    const base = url.pathname.replace(/\.[^/.]+$/, '');
    const exts = [src.split('.').pop()!, ...fallback];
    for (const ext of exts) {
      const candidate = `${base}.${ext}`;
      // We could test HTMLAudioElement.canPlayType here; keep it minimal:
      return candidate;
    }
    return src;
  }

  private normalizeMode(desc: { loadingMode?: LoadingMode; preDecode?: boolean }): LoadingMode {
    if (desc.preDecode) return 'preload';
    return desc.loadingMode ?? 'preload';
  }

  public init(audioContext: AudioContext, options?: LoaderOptions) {
    this.audioContext = audioContext;
    if (options) this.options = { ...this.options, ...options };
  }

  public has(id: string) { return this.cache.has(id); }

  public getBuffer(id: string) {
    const it = this.cache.get(id);
    return it?.buffer;
  }

  public getMedia(id: string) {
    const it = this.cache.get(id);
    return it?.media;
  }

  public resolveSpriteClip(spriteId: string, clip: string) {
    const it = this.cache.get(spriteId) as LoadedSprite | undefined;
    if (!it || it.kind !== 'sprite') throw new Error(`Sprite not loaded: ${spriteId}`);
    const [startMs, durMs] = it.spriteMap[clip] ?? [];
    if (startMs == null) throw new Error(`Clip not found: ${spriteId}:${clip}`);
    return { start: startMs / 1000, end: (startMs + durMs) / 1000 };
  }

  public async loadBank(manifestOrUrl: BankManifest | string) {
    const manifest = typeof manifestOrUrl === 'string'
      ? await (await fetch(this.resolveUrl(manifestOrUrl), this.options.fetchInit)).json() as BankManifest
      : manifestOrUrl;

    // Load assets honoring defaults and parallelism
    const q: Promise<any>[] = [];
    for (const asset of manifest.assets) {
      q.push(this.loadAsset({
        ...asset,
        loadingMode: asset.loadingMode ?? manifest.defaults?.loadingMode ?? 'preload',
      }));
      if (q.length >= this.options.maxParallel) { await Promise.all(q.splice(0)); }
    }
    if (q.length) await Promise.all(q);

    // Index groups
    this.groupIndex.clear();
    for (const g of manifest.groups ?? []) {
      this.groupIndex.set(g.id, new Set(g.includes));
      for (const id of g.includes) this.incRef(id);
    }
  }

  public async loadAsset(desc: AssetDesc) {
    if (this.cache.has(desc.id)) { this.incRef(desc.id); return; }
    if (desc.type === 'single') return this.loadSingle(desc);
    else return this.loadSprite(desc);
  }

  public async loadSingle(desc: SingleDesc) {
    const mode = this.normalizeMode(desc);
    const src = this.pickSource(desc.src, desc.fallback);
    const entry: LoadedSingle = { kind: 'single', mode, refCount: 0, srcResolved: src };

    if (mode === 'preload') {
      entry.buffer = await this.fetchAndDecode(src);
    } else if (mode === 'stream') {
      entry.media = this.createMedia(src);
    } // lazy: defer

    this.cache.set(desc.id, entry);
    this.incRef(desc.id);
  }

  public async loadSprite(desc: SpriteDesc) {
    const mode = this.normalizeMode(desc);
    const src = this.pickSource(desc.src, desc.fallback);
    const entry: LoadedSprite = {
      kind: 'sprite',
      mode,
      spriteMap: desc.spriteMap,
      refCount: 0,
      srcResolved: src,
    };

    if (mode === 'preload') {
      entry.buffer = await this.fetchAndDecode(src);
    } else if (mode === 'stream') {
      entry.media = this.createMedia(src);
    }

    this.cache.set(desc.id, entry);
    this.incRef(desc.id);
  }

  /** Decrease ref and auto-unload when reaches 0. */
  public decRef(id: string) {
    const it = this.cache.get(id);
    if (!it) return;
    it.refCount = Math.max(0, it.refCount - 1);
    if (it.refCount === 0) this.unload(id);
  }

  public unload(idOrGroup: string) {
    if (this.groupIndex.has(idOrGroup)) {
      for (const id of this.groupIndex.get(idOrGroup)!) this.unload(id);
      this.groupIndex.delete(idOrGroup);
      return;
    }
    const it = this.cache.get(idOrGroup);
    if (!it) return;

    if (it.media) { it.media.src = ''; it.media.load(); }
    this.cache.delete(idOrGroup);
  }

  /** Lazy materialization on first use for 'lazy' items. */
  public async ensureReady(id: string) {
    const it = this.cache.get(id);
    if (!it) throw new Error(`Asset not loaded: ${id}`);
    if (it.mode !== 'lazy') return;

    // Decide by file length heuristic? For now, default to preload for lazy on first touch.
    // You can extend with HEAD requests to estimate duration via metadata.
    if (!it.buffer && !it.media) {
      // Simple heuristic: treat lazy as preload for sfx
      it.buffer = await this.fetchAndDecode(it.srcResolved);
    }
  }
}