
import { wait } from "../utils/wait";
import type {
	BankManifest,
	LoaderOptions,
	LoadingMode,
	LoadedAudio,
	AudioDescription,
	SpriteClipDefinition,
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
	private _cache = new Map<string, LoadedAudio>();
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
	 * Increment the cached audio's refCount so we keep track of every active consumer.
	 * Audios are only unloaded when decRef brings this counter to zero, ensuring we
	 * do not release audio still in use (for example, when included in a bank).
	 * @param id Audio identifier.
	 */
	private _incrementReference(id: string): void {
		const audio = this._cache.get(id);
		if (audio) audio.refCount++;
	}

	/**
	 * Build and configure a fresh HTMLAudioElement so streaming audios can play
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
	 * the shared AudioContext so preloaded audios can start playback instantly.
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
	 * Normalize audio URLs against the configured baseUrl, leaving absolute HTTP
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
	 * @param audioDescription Audio description.
	 * @returns Normalized loading mode.
	 */
	private _normalizeMode(audioDescription: {
		loadingMode?: LoadingMode;
		preDecode?: boolean;
	}): LoadingMode {
		if (audioDescription.preDecode) return "preload";
		return audioDescription.loadingMode ?? "preload";
	}

	/**
	 * /**
	 * Store the shared AudioContext and set options before loading starts.
	 * Call this once during your app bootstrap, prior to any `load` invocation that
	 * requires an initialized context and configuration.
	 * @param audioContext Shared AudioContext instance.
	 * @param options Loader configuration options.
	 */
	public init(audioContext: AudioContext, options?: LoaderOptions): void {
		this._audioContext = audioContext;
		if (options) this._options = { ...this._options, ...options };
	}

	/**
	 * Check whether the audio is already loaded and cached.
	 * @param id Audio identifier.
	 * @returns Whether the audio is loaded and cached.
	 */
	public has(id: string): boolean {
		return this._cache.has(id);
	}

	/**
	 * Retrieve the preloaded AudioBuffer for the given audio identifier.
	 * @param id Audio identifier.
	 * @returns AudioBuffer if preloaded, undefined otherwise.
	 */
	public getBuffer(id: string): AudioBuffer | undefined {
		const audio = this._cache.get(id);
		return audio?.buffer;
	}

	/**
	 * Retrieve the streaming HTMLAudioElement for the given audio identifier.
	 * @param id Audio identifier.
	 * @returns
	 */
	public getMedia(id: string): HTMLAudioElement | undefined {
		const audio = this._cache.get(id);
		return audio?.media;
	}

	/**
	 *
	 * @param spriteId
	 * @param clip
	 * @returns
	 */
	public resolveSpriteClip(
		spriteId: string,
		clip: string
	): SpriteClipDefinition {
		const audio = this._cache.get(spriteId) as LoadedAudio | undefined;
		if (!audio || audio.kind !== "sprite") {
			throw new Error(`Sprite not loaded: ${spriteId}`);
		}

		const spriteMap = audio.spriteMap;
		if (!spriteMap) {
			throw new Error(`Sprite has no spriteMap: ${spriteId}`);
		}

		const [startMs, durMs] = spriteMap[clip] ?? [];
		if (startMs == null) {
			throw new Error(`Clip not found: ${spriteId}:${clip}`);
		}

		return { start: startMs / 1000, end: (startMs + durMs) / 1000 };
	}

	/**
	 * Load every audio described in a bank manifest, accepting either the manifest
	 * object or a remote URL, and rebuild the group index so grouped clips share
	 * reference counts. Invoke this when you want to preload a whole bank before
	 * playback begins.
	 * @param manifestOrUrl Bank manifest or URL pointing to one.
	 */
	public async loadBank(manifestOrUrl: BankManifest | string): Promise<void> {
		const manifest =
			typeof manifestOrUrl === "string"
				? ((await (
						await fetch(
							this._resolveUrl(manifestOrUrl),
							this._options.fetchInit
						)
				  ).json()) as BankManifest)
				: manifestOrUrl;

		// Load audios honoring defaults and parallelism
		const loadPromises: Promise<any>[] = [];
		for (const audio of manifest.audios) {
			loadPromises.push(
				this.loadAudio({
					...audio,
					loadingMode:
						audio.loadingMode ?? manifest.defaults?.loadingMode ?? "preload",
				})
			);
			if (loadPromises.length >= this._options.maxParallel) {
				await Promise.all(loadPromises.splice(0));
			}
		}
		if (loadPromises.length) await Promise.all(loadPromises);

		// Index groups
		this._groupIndex.clear();
		for (const g of manifest.groups ?? []) {
			this._groupIndex.set(g.id, new Set(g.includes));
			for (const id of g.includes) this._incrementReference(id);
		}
	}

	/**
	 * Load a single audio, either 'single' or 'sprite' type, into the cache.
	 * If the audio is already loaded, just increment its reference count.
	 * @param desc
	 * @returns
	 */
	public async loadAudio(audioDescription: AudioDescription): Promise<void> {

		if (this._cache.has(audioDescription.id)) {
			this._incrementReference(audioDescription.id);
			return;
		}

		const mode = this._normalizeMode(audioDescription);
		const src = this._pickSource(
			audioDescription.src,
			audioDescription.fallback
		);
		let entry: LoadedAudio = {
				kind: audioDescription.type,
				mode,
				refCount: 0,
				srcResolved: src,
			}

		if (audioDescription.type === "sprite") {
			entry.spriteMap = audioDescription.spriteMap;
		}

		if (mode === "preload") {
			entry.buffer = await this._fetchAndDecode(src);
		} else if (mode === "stream") {
			entry.media = this._createMedia(src);
		}

		this._cache.set(audioDescription.id, entry);
		this._incrementReference(audioDescription.id);
	}

	/**
	 * Signal that one consumer released the audio: decrement the refCount and
	 * unload immediately once it hits zero so we reclaim the underlying audio.
	 * @param id Audio identifier.
	 */
	public decrementReference(id: string): void {
		const audio = this._cache.get(id);
		if (!audio) return;
		audio.refCount = Math.max(0, audio.refCount - 1);
		if (audio.refCount === 0) this.unload(id);
	}

	/**
	 * Unload the audio from the cache, releasing underlying audio resources.
	 * If a group id is provided, unload every member of the group.
	 * @param idOrGroup Audio or group identifier.
	 */
	public unload(idOrGroup: string): void {
		if (this._groupIndex.has(idOrGroup)) {
			const groupMembers = this._groupIndex.get(idOrGroup)!;
			const memberIds = Array.from(groupMembers);
			for (const id of memberIds) {
				this.unload(id);
			}
			this._groupIndex.delete(idOrGroup);
			return;
		}

		const audio = this._cache.get(idOrGroup);
		if (!audio) {
			return;
		}

		if (audio.media) {
			audio.media.src = "";
			audio.media.load();
		}
		this._cache.delete(idOrGroup);
	}

	/**
	 * Lazy materialization on first use for 'lazy' items.
	 * @param id Audio identifier.
	 * */
	public async ensureReady(id: string): Promise<void> {
		const audio = this._cache.get(id);
		if (!audio) throw new Error(`Audio not loaded: ${id}`);
		if (audio.mode !== "lazy") return;

		// Decide by file length heuristic? For now, default to preload for lazy on first touch.
		// You can extend with HEAD requests to estimate duration via metadata.
		if (!audio.buffer && !audio.media) {
			// Simple heuristic: treat lazy as preload for sfx
			audio.buffer = await this._fetchAndDecode(audio.srcResolved);
		}
	}
}
