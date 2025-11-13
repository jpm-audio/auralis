import { AudioLoader } from 'auralis';
import type { BankManifest } from 'auralis';

export type LogFn = (message: string) => void;

export interface PlaygroundTest {
	id: string;
	name: string;
	description: string;
	run: (log: LogFn) => Promise<void>;
}

export interface PlaygroundSection {
	id: string;
	name: string;
	description: string;
	tests: PlaygroundTest[];
}

interface MockAsset {
	buffer: ArrayBuffer;
	contentType: string;
	failTimes?: number;
}

interface MockFetchStats {
	attempts: Map<string, number>;
}

interface LoaderEnv {
	loader: AudioLoader;
	context: AudioContext;
	stats?: MockFetchStats;
}

interface LoaderEnvOptions {
	mockFetch?: boolean;
}

const SAMPLE_RATE = 44100;

const BANK_MANIFEST_URL = 'mock://auralis-assets/demo-bank.json';
const BANK_MANIFEST: BankManifest = {
	bankId: 'demo-percussion-kit',
	defaults: { loadingMode: 'preload' },
	audios: [
		{ type: 'single', id: 'bank-kick', src: 'bank-kick.wav' },
		{ type: 'single', id: 'bank-snare', src: 'bank-snare.wav' },
		{
			type: 'sprite',
			id: 'bank-hat',
			src: 'bank-hat.wav',
			loadingMode: 'lazy',
			spriteMap: {
				closed: [0, 120],
				open: [120, 180],
			},
		},
	],
	groups: [{ id: 'percussion', includes: ['bank-kick', 'bank-snare', 'bank-hat'] }],
};

const AUDIO_SAMPLES = {
	preload: createSineWaveWav({ frequency: 440, durationMs: 400 }),
	fallback: createSineWaveWav({ frequency: 523.25, durationMs: 400 }),
	lazy: createSineWaveWav({ frequency: 330, durationMs: 400 }),
	sprite: createSineWaveWav({ frequency: 660, durationMs: 600 }),
	retry: createSineWaveWav({ frequency: 392, durationMs: 400 }),
	bankKick: createSineWaveWav({ frequency: 120, durationMs: 280 }),
	bankSnare: createSineWaveWav({ frequency: 240, durationMs: 280 }),
	bankHat: createSineWaveWav({ frequency: 880, durationMs: 300 }),
};

const STREAM_TONE_URL = URL.createObjectURL(
	new Blob([AUDIO_SAMPLES.bankHat.slice(0)], { type: 'audio/wav' })
);

const MOCK_ASSETS: Record<string, MockAsset> = {
	'mock://auralis-assets/tone-preload.wav': {
		buffer: AUDIO_SAMPLES.preload,
		contentType: 'audio/wav',
	},
	'mock://auralis-assets/tone-fallback.wav': {
		buffer: AUDIO_SAMPLES.fallback,
		contentType: 'audio/wav',
	},
	'mock://auralis-assets/tone-lazy.wav': {
		buffer: AUDIO_SAMPLES.lazy,
		contentType: 'audio/wav',
	},
	'mock://auralis-assets/sprite-demo.wav': {
		buffer: AUDIO_SAMPLES.sprite,
		contentType: 'audio/wav',
	},
	'mock://auralis-assets/tone-retry.wav': {
		buffer: AUDIO_SAMPLES.retry,
		contentType: 'audio/wav',
		failTimes: 1,
	},
	'mock://auralis-assets/bank-kick.wav': {
		buffer: AUDIO_SAMPLES.bankKick,
		contentType: 'audio/wav',
	},
	'mock://auralis-assets/bank-snare.wav': {
		buffer: AUDIO_SAMPLES.bankSnare,
		contentType: 'audio/wav',
	},
	'mock://auralis-assets/bank-hat.wav': {
		buffer: AUDIO_SAMPLES.bankHat,
		contentType: 'audio/wav',
	},
};

const MOCK_MANIFESTS: Record<string, BankManifest> = {
	[BANK_MANIFEST_URL]: BANK_MANIFEST,
};

const loaderTests: PlaygroundTest[] = [
	{
		id: 'loader-suite',
		name: 'Recorrido completo del Loader',
		description: 'Ejecuta todos los escenarios disponibles para validar AudioLoader de principio a fin.',
		run: runAudioLoaderSuite,
	},
	{
		id: 'loader-stream',
		name: 'Modo stream con Blob',
		description: 'Verifica que AudioLoader gestione recursos stream usando un Blob local como origen.',
		run: (log) =>
			withLoaderEnvironment(log, async ({ loader }) => {
				await runStreamScenario(loader, log);
			}, { mockFetch: false }),
	},
	{
		id: 'loader-preload-refcount',
		name: 'Carga preload y refCount',
		description: 'Comprueba el manejo de caché y contadores de referencia en modo preload.',
		run: (log) =>
			withLoaderEnvironment(log, async ({ loader }) => {
				await runPreloadScenario(loader, log);
			}),
	},
	{
		id: 'loader-fallback',
		name: 'Selección de fallback',
		description: 'Confirma que el loader pruebe extensiones alternativas cuando la original falla.',
		run: (log) =>
			withLoaderEnvironment(log, async ({ loader }) => {
				await runFallbackScenario(loader, log);
			}),
	},
	{
		id: 'loader-retry',
		name: 'Política de reintentos',
		description: 'Evalúa la estrategia de reintentos al obtener activos remotos.',
		run: (log) =>
			withLoaderEnvironment(log, async ({ loader, stats }) => {
				await runRetryScenario(loader, log, stats);
			}),
	},
	{
		id: 'loader-lazy',
		name: 'Modo lazy',
		description: 'Asegura que el modo lazy mantenga el audio sin decodificar hasta su uso.',
		run: (log) =>
			withLoaderEnvironment(log, async ({ loader }) => {
				await runLazyScenario(loader, log);
			}),
	},
	{
		id: 'loader-sprite',
		name: 'Sprite clips',
		description: 'Verifica el cálculo de offsets al resolver clips dentro de un sprite.',
		run: (log) =>
			withLoaderEnvironment(log, async ({ loader }) => {
				await runSpriteScenario(loader, log);
			}),
	},
	{
		id: 'loader-bank',
		name: 'Carga de bancos y grupos',
		description: 'Carga un manifesto de banco completo y comprueba el índice de grupos.',
		run: (log) =>
			withLoaderEnvironment(log, async ({ loader }) => {
				await runBankScenario(loader, log);
			}),
	},
	{
		id: 'loader-unload',
		name: 'Liberación de recursos',
		description: 'Ejecuta decrementReference y unload para validar la liberación de caché.',
		run: (log) =>
			withLoaderEnvironment(log, async ({ loader, stats }) => {
				await runUnloadScenario(loader, log, stats);
			}),
	},
];

export const loaderSection: PlaygroundSection = {
	id: 'loader',
	name: 'Audio Loader',
	description:
		'Herramientas manuales para validar el AudioLoader con escenarios controlados y activos mock.',
	tests: loaderTests,
};

function createSineWaveWav({
	frequency,
	durationMs,
	sampleRate = SAMPLE_RATE,
	volume = 0.35,
}: {
	frequency: number;
	durationMs: number;
	sampleRate?: number;
	volume?: number;
}): ArrayBuffer {
	const numChannels = 1;
	const bitsPerSample = 16;
	const totalSamples = Math.floor((durationMs / 1000) * sampleRate);
	const pcm = new Int16Array(totalSamples);

	for (let i = 0; i < totalSamples; i++) {
		const t = i / sampleRate;
		const raw =
			Math.sin(2 * Math.PI * frequency * t) * volume * fadeEnvelope(t, durationMs / 1000);
		pcm[i] = Math.max(-1, Math.min(1, raw)) * 0x7fff;
	}

	const wavBuffer = new ArrayBuffer(44 + pcm.byteLength);
	const view = new DataView(wavBuffer);
	const bytes = new Uint8Array(wavBuffer);
	let offset = 0;

	const writeString = (value: string) => {
		for (let i = 0; i < value.length; i++) {
			bytes[offset++] = value.charCodeAt(i);
		}
	};
	const writeUint16 = (value: number) => {
		view.setUint16(offset, value, true);
		offset += 2;
	};
	const writeUint32 = (value: number) => {
		view.setUint32(offset, value, true);
		offset += 4;
	};

	const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
	const blockAlign = numChannels * (bitsPerSample / 8);

	writeString('RIFF');
	writeUint32(36 + pcm.byteLength);
	writeString('WAVE');
	writeString('fmt ');
	writeUint32(16);
	writeUint16(1);
	writeUint16(numChannels);
	writeUint32(sampleRate);
	writeUint32(byteRate);
	writeUint16(blockAlign);
	writeUint16(bitsPerSample);
	writeString('data');
	writeUint32(pcm.byteLength);
	new Uint8Array(wavBuffer, offset).set(new Uint8Array(pcm.buffer));

	return wavBuffer;
}

function fadeEnvelope(timeSec: number, totalSec: number): number {
	const progress = Math.min(timeSec / totalSec, 1);
	const attack = Math.min(progress / 0.1, 1);
	const release = progress > 0.8 ? Math.max(0, (1 - progress) / 0.2) : 1;
	return attack * release;
}

async function runAudioLoaderSuite(log: LogFn): Promise<void> {
	await withLoaderEnvironment(
		log,
		async ({ loader, stats }) => {
			log('✔ AudioLoader inicializado con configuración de pruebas.');

			await runStreamScenario(loader, log);
			await runPreloadScenario(loader, log);
			await runFallbackScenario(loader, log);
			await runRetryScenario(loader, log, stats);
			await runLazyScenario(loader, log);
			await runSpriteScenario(loader, log);
			await runBankScenario(loader, log);
			await runUnloadScenario(loader, log, stats);
		},
		{ mockFetch: true }
	);
}

async function runStreamScenario(loader: AudioLoader, log: LogFn): Promise<void> {
	log('--- Test: modo stream con blob URL');
	await loader.loadAudio({
		id: 'tone-stream',
		type: 'single',
		src: STREAM_TONE_URL,
		loadingMode: 'stream',
	});

	const media = loader.getMedia('tone-stream');
	log(`media disponible: ${Boolean(media)} (src=${media?.src ?? 'n/a'})`);
}

async function runPreloadScenario(loader: AudioLoader, log: LogFn): Promise<void> {
	log('--- Test: modo preload y refCount');
	await loader.loadAudio({
		id: 'tone-preload',
		type: 'single',
		src: 'tone-preload.wav',
		loadingMode: 'preload',
	});

	const buffer = loader.getBuffer('tone-preload');
	log(`buffer frames=${buffer?.length ?? 0}`);

	await loader.loadAudio({
		id: 'tone-preload',
		type: 'single',
		src: 'tone-preload.wav',
		loadingMode: 'preload',
	});

	const cache = (loader as unknown as { _cache?: Map<string, { refCount: number }> })._cache;
	const entry = cache?.get('tone-preload');
	log(`refCount tras doble carga=${entry?.refCount ?? 'desconocido'}`);
}

async function runFallbackScenario(loader: AudioLoader, log: LogFn): Promise<void> {
	log('--- Test: selección de fallback');
	await loader.loadAudio({
		id: 'tone-fallback',
		type: 'single',
		src: 'tone-fallback.fake',
		fallback: ['wav', 'ogg'],
		loadingMode: 'preload',
	});

	const cache = (loader as unknown as { _cache?: Map<string, { srcResolved?: string }> })._cache;
	const entry = cache?.get('tone-fallback');
	log(`src elegido=${entry?.srcResolved ?? 'desconocido'}`);
}

async function runRetryScenario(
	loader: AudioLoader,
	log: LogFn,
	stats?: MockFetchStats
): Promise<void> {
	log('--- Test: política de reintentos');
	await loader.loadAudio({
		id: 'tone-retry',
		type: 'single',
		src: 'tone-retry.wav',
		loadingMode: 'preload',
	});

	const retryUrl = 'mock://auralis-assets/tone-retry.wav';
	const attempts = stats?.attempts.get(retryUrl) ?? 0;
	log(`fetch attempts observados=${attempts}`);
}

async function runLazyScenario(loader: AudioLoader, log: LogFn): Promise<void> {
	log('--- Test: modo lazy sin decodificar');
	await loader.loadAudio({
		id: 'tone-lazy',
		type: 'single',
		src: 'tone-lazy.wav',
		loadingMode: 'lazy',
	});

	const buffer = loader.getBuffer('tone-lazy');
	log(`buffer presente=${Boolean(buffer)} (esperado=false)`);
}

async function runSpriteScenario(loader: AudioLoader, log: LogFn): Promise<void> {
	log('--- Test: sprites y resolveSpriteClip');
	await loader.loadAudio({
		id: 'sprite-demo',
		type: 'sprite',
		src: 'sprite-demo.wav',
		loadingMode: 'preload',
		spriteMap: {
			intro: [0, 250],
			outro: [250, 250],
		},
	});

	const clip = loader.resolveSpriteClip('sprite-demo', 'intro');
	log(`clip intro => start=${clip.start.toFixed(2)}s end=${clip.end.toFixed(2)}s`);
}

async function runBankScenario(loader: AudioLoader, log: LogFn): Promise<void> {
	log('--- Test: carga de bank + grupos');
	await loader.loadBank(BANK_MANIFEST_URL);

	const status = ['bank-kick', 'bank-snare', 'bank-hat']
		.map((id) => `${id}=${loader.has(id)}`)
		.join(' ');
	log(`bank cargado => ${status}`);

	const groups = (loader as unknown as { _groupIndex?: Map<string, Set<string>> })._groupIndex;
	const members = groups?.get('percussion');
	log(`grupo percussion => ${members ? Array.from(members).join(', ') : 'sin índice'}`);
}

async function runUnloadScenario(
	loader: AudioLoader,
	log: LogFn,
	stats?: MockFetchStats
): Promise<void> {
	log('--- Test: decrementReference y unload');

	const hadTonePreload = loader.has('tone-preload');
	if (!hadTonePreload) {
		await loader.loadAudio({
			id: 'tone-preload',
			type: 'single',
			src: 'tone-preload.wav',
			loadingMode: 'preload',
		});
		await loader.loadAudio({
			id: 'tone-preload',
			type: 'single',
			src: 'tone-preload.wav',
			loadingMode: 'preload',
		});
	}

	loader.decrementReference('tone-preload');
	loader.decrementReference('tone-preload');
	log(`tone-preload en caché=${loader.has('tone-preload')}`);

	const bankPrimed = ['bank-kick', 'bank-snare', 'bank-hat'].every((id) => loader.has(id));
	if (!bankPrimed) {
		await loader.loadBank(BANK_MANIFEST_URL);
	}

	loader.unload('percussion');
	const bankStatus = ['bank-kick', 'bank-snare', 'bank-hat']
		.map((id) => `${id}=${loader.has(id)}`)
		.join(' ');
	log(`grupo descargado => ${bankStatus}`);

	if (!loader.has('tone-stream')) {
		await loader.loadAudio({
			id: 'tone-stream',
			type: 'single',
			src: STREAM_TONE_URL,
			loadingMode: 'stream',
		});
	}

	loader.unload('tone-stream');
	log(`tone-stream en caché=${loader.has('tone-stream')}`);

	const retryUrl = 'mock://auralis-assets/tone-retry.wav';
	const attempts = stats?.attempts.get(retryUrl);
	if (attempts !== undefined) {
		log(`estadísticas de fetch conservadas=${attempts > 0}`);
	}
}

async function withLoaderEnvironment(
	log: LogFn,
	runner: (env: LoaderEnv) => Promise<void>,
	options: LoaderEnvOptions = {}
): Promise<void> {
	const { mockFetch = true } = options;

	log('▶ Preparando AudioContext...');
	const context = new AudioContext();
	await context.resume();
	log('✔ AudioContext operativo.');

	const loader = new AudioLoader();
	loader.init(context, {
		baseUrl: 'mock://auralis-assets',
		maxParallel: 2,
		retry: { attempts: 2, backoffMs: 75 },
	});
	log('✔ AudioLoader inicializado (baseUrl=mock://auralis-assets).');

	const execute = async (stats?: MockFetchStats) =>
		runner({
			loader,
			context,
			stats,
		});

	try {
		if (mockFetch) {
			await withMockFetch(async (stats) => {
				await execute(stats);
			});
		} else {
			await execute();
		}
	} finally {
		await context.close().catch(() => undefined);
	}
}

async function withMockFetch<T>(runner: (stats: MockFetchStats) => Promise<T>): Promise<T> {
	const stats: MockFetchStats = { attempts: new Map() };
	const originalFetch = window.fetch.bind(window);
	const mockFetch = createMockFetch(stats, originalFetch);
	window.fetch = mockFetch;

	try {
		return await runner(stats);
	} finally {
		window.fetch = originalFetch;
	}
}

function createMockFetch(stats: MockFetchStats, fallback: typeof window.fetch) {
	const remainingFailures = new Map<string, number>();

	return async (input: RequestInfo | URL, init?: RequestInit) => {
		const url =
			typeof input === 'string'
				? input
				: input instanceof URL
				? input.toString()
				: input.url;

		stats.attempts.set(url, (stats.attempts.get(url) ?? 0) + 1);

		if (MOCK_MANIFESTS[url]) {
			const manifest = MOCK_MANIFESTS[url];
			return new Response(JSON.stringify(manifest), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const asset = MOCK_ASSETS[url];
		if (asset) {
			if (!remainingFailures.has(url)) {
				remainingFailures.set(url, asset.failTimes ?? 0);
			}

			const failsLeft = remainingFailures.get(url) ?? 0;
			if (failsLeft > 0) {
				remainingFailures.set(url, failsLeft - 1);
				return new Response(null, { status: 503, statusText: 'Mock failure' });
			}

			return new Response(asset.buffer.slice(0), {
				status: 200,
				headers: { 'Content-Type': asset.contentType },
			});
		}

		console.warn('[AudioLoader playground] fetch real URL', url);
		return fallback(input, init);
	};
}
