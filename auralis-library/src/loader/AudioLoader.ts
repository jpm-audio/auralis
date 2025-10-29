import { wait } from "@/utils";
import type {
	AssetDesc,
	BankManifest,
	LoaderOptions,
	LoadingMode,
	LoadedSingle,
	LoadedSprite,
	SingleDescriptor,
	SpriteDescriptor,
} from "./types";

const DEFAULT_AUDIO_LOADER_OPTIONS = {
	fetchInit: {},
	maxParallel: 4,
	retry: { attempts: 2, backoffMs: 350 },
	baseUrl: "",
};

const AUDIO_MIME_BY_EXT: Record<string, string> = {
	aac: "audio/aac",
	flac: "audio/flac",
	m4a: "audio/mp4",
	mp3: "audio/mpeg",
	mp4: "audio/mp4",
	ogg: "audio/ogg",
	oga: "audio/ogg",
	opus: 'audio/ogg; codecs="opus"',
	wav: "audio/wav",
	webm: "audio/webm",
	weba: "audio/webm",
};

export class AudioLoader {
	/**
	 * Current AudioContext instance.
	 */
	private _audioContext!: AudioContext;
	/**
	 * Loader configuration options.
	 */
	private _options: Required<LoaderOptions> = DEFAULT_AUDIO_LOADER_OPTIONS;
	/**
	 *
	 */
	private _cache = new Map<string, LoadedSingle | LoadedSprite>();
	/**
	 *
	 */
	private _groupIndex = new Map<string, Set<string>>();
	/**
	 *
	 */
	private _probeAudioEl?: HTMLAudioElement;

	/**
	 * Construct a new AudioLoader instance.
	 */
	constructor() {}

	/**
	 * Increment the cached asset's refCount so we keep track of every active consumer.
	 * Assets are only unloaded when decRef brings this counter to zero, ensuring we
	 * do not release audio still in use (for example, when included in a bank).
	 * @param id Asset identifier.
	 */
	private _incrementReference(id: string): void {
		const it = this._cache.get(id);
		if (it) it.refCount++;
	}

	/**
	 * Build and configure a fresh HTMLAudioElement so streaming assets can play
	 * immediately without pre-decoding the audio into memory.
	 * @param src Audio source URL.
	 * @return Configured HTMLAudioElement.
	 */
	private _createMedia(src: string): HTMLAudioElement {
		const el = new Audio();
		el.src = this._resolveUrl(src);
		el.preload = "auto";
		el.crossOrigin = "anonymous";
		return el;
	}

	/**
	 * Fetch the audio data from an url and decode it into an AudioBuffer using
	 * the shared AudioContext so preloaded assets can start playback instantly.
	 * @param url Audio resource URL.
	 * @return Decoded AudioBuffer.
	 */
	private async _fetchAndDecode(url: string): Promise<AudioBuffer> {
		const buf = await this._fetchWithRetry(url);
		return await this._audioContext.decodeAudioData(buf);
	}

	/**
	 * Retrieve the URL with the configured retry policy so transient network
	 * errors do not immediately abort the loading flow.
	 * @param url Audio resource URL.
	 * @return Fetched ArrayBuffer.
	 */
	private async _fetchWithRetry(url: string): Promise<ArrayBuffer> {
		let attempt = 0;
		const { attempts, backoffMs } = this._options.retry;

		for (;;) {
			try {
				const response = await fetch(
					this._resolveUrl(url),
					this._options.fetchInit
				);
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				const arrayBuf = await response.arrayBuffer();

				return arrayBuf;
			} catch (e) {
				attempt++;
				if (attempt > attempts) throw e;

				await wait(backoffMs * attempt);
			}
		}
	}

  /**
   * Normalize asset URLs against the configured baseUrl, leaving absolute HTTP
   * paths untouched, so every fetch shares consistent resolution rules.
   * @param url Audio resource URL.
   * @return Resolved URL.
   */
	private _resolveUrl(url: string): string {
    // Is there a baseUrl configured?
		if (!this._options.baseUrl) return url;

    // Already absolute url?
		if (/^https?:\/\//i.test(url)) return url;

    // Normalize against baseUrl
		return (
			this._options.baseUrl.replace(/\/+$/, "") + "/" + url.replace(/^\/+/, "")
		);
	}

	/**
	 * Pick the first playable source by probing HTMLAudioElement.canPlayType
	 * against the declared fallback extensions, keeping the manifest order.
	 */
	private _pickSource(src: string, fallback?: string[]): string {
		const candidates: string[] = [src];
		if (fallback && fallback.length) {
			const queryIndex = src.search(/[?#]/);
			const pathPart = queryIndex === -1 ? src : src.slice(0, queryIndex);
			const suffixPart = queryIndex === -1 ? "" : src.slice(queryIndex);
			const basePath = pathPart.replace(/\.[^/.]+$/, "");

			for (const ext of fallback) {
				if (!ext) continue;
				candidates.push(`${basePath}.${ext}${suffixPart}`);
			}
		}

		for (const candidate of candidates) {
			const ext = this._extractExtension(candidate);
			if (ext && this._canPlayExtension(ext)) return candidate;
		}

		return candidates[0];
	}

	/**
	 * Memorize a probe audio element and use it to check browser codec support.
   * @param ext File extension to probe.
   * @return Whether the extension is playable.
	 */
	private _canPlayExtension(ext: string): boolean {
		const mime = AUDIO_MIME_BY_EXT[ext.toLowerCase()];

		if (!mime) return false;
		if (typeof document === "undefined") return true;

		this._probeAudioEl ??= document.createElement("audio");
		const verdict = this._probeAudioEl.canPlayType(mime);

		return verdict === "probably" || verdict === "maybe";
	}

  /**
   * Extract the file extension from a URL or path, ignoring query strings or fragments.
   * @param candidate URL or path candidate.
   * @returns Extracted file extension or undefined.
   */
	private _extractExtension(candidate: string): string | undefined {
    // Clean query strings or fragments
		const clean = candidate.split(/[?#]/)[0];
    // Extract extension
		const match = /\.([^.\/]+)$/.exec(clean);
    // Return lowercased extension or undefined
		return match?.[1]?.toLowerCase();
	}


	/**
	 * Resolve the effective loading mode, honoring legacy `preDecode` and defaulting to preload.
   * @param desc Asset description.
   * @returns Normalized loading mode.
	 */
	private _normalizeMode(desciptor: {
		loadingMode?: LoadingMode;
		preDecode?: boolean;
	}): LoadingMode {
		if (desciptor.preDecode) return "preload";
		return desciptor.loadingMode ?? "preload";
	}

	public init(audioContext: AudioContext, options?: LoaderOptions) {
		this._audioContext = audioContext;
		if (options) this._options = { ...this._options, ...options };
	}

	public has(id: string) {
		return this._cache.has(id);
	}

	public getBuffer(id: string) {
		const it = this._cache.get(id);
		return it?.buffer;
	}

	public getMedia(id: string) {
		const it = this._cache.get(id);
		return it?.media;
	}

	public resolveSpriteClip(spriteId: string, clip: string) {
		const it = this._cache.get(spriteId) as LoadedSprite | undefined;
		if (!it || it.kind !== "sprite")
			throw new Error(`Sprite not loaded: ${spriteId}`);
		const [startMs, durMs] = it.spriteMap[clip] ?? [];
		if (startMs == null) throw new Error(`Clip not found: ${spriteId}:${clip}`);
		return { start: startMs / 1000, end: (startMs + durMs) / 1000 };
	}

	public async loadBank(manifestOrUrl: BankManifest | string) {
		const manifest =
			typeof manifestOrUrl === "string"
				? ((await (
						await fetch(
							this._resolveUrl(manifestOrUrl),
							this._options.fetchInit
						)
				  ).json()) as BankManifest)
				: manifestOrUrl;

		// Load assets honoring defaults and parallelism
		const q: Promise<any>[] = [];
		for (const asset of manifest.assets) {
			q.push(
				this.loadAsset({
					...asset,
					loadingMode:
						asset.loadingMode ?? manifest.defaults?.loadingMode ?? "preload",
				})
			);
			if (q.length >= this._options.maxParallel) {
				await Promise.all(q.splice(0));
			}
		}
		if (q.length) await Promise.all(q);

		// Index groups
		this._groupIndex.clear();
		for (const g of manifest.groups ?? []) {
			this._groupIndex.set(g.id, new Set(g.includes));
			for (const id of g.includes) this._incrementReference(id);
		}
	}

	public async loadAsset(desc: AssetDesc) {
		if (this._cache.has(desc.id)) {
			this._incrementReference(desc.id);
			return;
		}
		if (desc.type === "single") return this.loadSingle(desc);
		else return this.loadSprite(desc);
	}

	public async loadSingle(descriptor: SingleDescriptor) {
		const mode = this._normalizeMode(descriptor);
		const src = this._pickSource(descriptor.src, descriptor.fallback);
		const entry: LoadedSingle = {
			kind: "single",
			mode,
			refCount: 0,
			srcResolved: src,
		};

		if (mode === "preload") {
			entry.buffer = await this._fetchAndDecode(src);
		} else if (mode === "stream") {
			entry.media = this._createMedia(src);
		} // lazy: defer

		this._cache.set(descriptor.id, entry);
		this._incrementReference(descriptor.id);
	}

	public async loadSprite(descriptor: SpriteDescriptor) {
		const mode = this._normalizeMode(descriptor);
		const src = this._pickSource(descriptor.src, descriptor.fallback);
		const entry: LoadedSprite = {
			kind: "sprite",
			mode,
			spriteMap: descriptor.spriteMap,
			refCount: 0,
			srcResolved: src,
		};

		if (mode === "preload") {
			entry.buffer = await this._fetchAndDecode(src);
		} else if (mode === "stream") {
			entry.media = this._createMedia(src);
		}

		this._cache.set(descriptor.id, entry);
		this._incrementReference(descriptor.id);
	}

	/**
	 * Signal that one consumer released the asset: decrement the refCount and
	 * unload immediately once it hits zero so we reclaim the underlying audio.
	 * @param id Asset identifier.
	 */
	public decrementReference(id: string): void {
		const it = this._cache.get(id);
		if (!it) return;
		it.refCount = Math.max(0, it.refCount - 1);
		if (it.refCount === 0) this.unload(id);
	}

	public unload(idOrGroup: string) {
		if (this._groupIndex.has(idOrGroup)) {
			for (const id of this._groupIndex.get(idOrGroup)!) this.unload(id);
			this._groupIndex.delete(idOrGroup);
			return;
		}
		const it = this._cache.get(idOrGroup);
		if (!it) return;

		if (it.media) {
			it.media.src = "";
			it.media.load();
		}
		this._cache.delete(idOrGroup);
	}

	/** Lazy materialization on first use for 'lazy' items. */
	public async ensureReady(id: string) {
		const it = this._cache.get(id);
		if (!it) throw new Error(`Asset not loaded: ${id}`);
		if (it.mode !== "lazy") return;

		// Decide by file length heuristic? For now, default to preload for lazy on first touch.
		// You can extend with HEAD requests to estimate duration via metadata.
		if (!it.buffer && !it.media) {
			// Simple heuristic: treat lazy as preload for sfx
			it.buffer = await this._fetchAndDecode(it.srcResolved);
		}
	}
}
