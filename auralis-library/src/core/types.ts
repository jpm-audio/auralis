import type { ParamAutomationOptions } from "@/components/parameters/types";
import { AudioMultipleClipMode } from "@/components/channels/types";
import type { SoundSpriteData } from "@/sound/SoundObject";
import type { AudioTicker } from "./AudioTicker";

/**
 * Interface representing the global configuration for the audio engine.
 * This includes default values and ranges for various audio parameters.
 */
export interface AudioGlobalConfig {
	ticker: {
		autostart: boolean;
		fps: number;
	};
	/**
	 * The default parameters for fadeIn automation.
	 */
	fadeIn: Required<ParamAutomationOptions>;
	/**
	 * The default parameters for fadeOut automation.
	 */
	fadeOut: Required<ParamAutomationOptions>;
	/**
	 * The default parameters for AudioBus.
	 */
	audioBus: {
		volume: {
			value: number;
			range: [number, number];
		};
		pan: {
			value: number;
			range: [number, number];
		};
	};
	/**
	 * The default parameters for AudioClip.
	 */
	audioClip: {
		pitch: {
			value: number;
			range: [number, number];
		};
		offset: {
			value: number;
			range: [number, number];
		};
        multipleClipMode: AudioMultipleClipMode;
	};
}

export interface AudioLoadOptions {
	paths: string | string[];
	sprite: Record<string, SoundSpriteData>;
}

export interface AudioCatalogItem {
	name: string;
	audioSprite: string | undefined;
	duration: number;
}

export interface AudioTickerOptions {
	audioContext: AudioContext;
    tempo?: number;
    subdivision?: number;
    lookahead?: number;
    scheduleAheadTime?: number;
}

/**
 * Signature for tick events.
 */
export type AudioTickerTickCallback = (ticker: AudioTicker) => void;