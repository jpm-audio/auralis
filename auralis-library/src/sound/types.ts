import type { SoundSpriteData } from "./SoundObject";

export interface AddSoundOptions {
    preload?: boolean;
    url: string | string[];
    sprites?: Record<string, SoundSpriteData>;
    duration?: number;
    loaded?: (error: Error | null) => void;
}

export type SoundSourceMap = Record<string, AddSoundOptions>;

export interface PlayOptions {
	id?: string;
	loop?: boolean;
	volume?: number;
	muted?: boolean;
	speed?: number;
	start?: number;
	sprite?: string;
	complete?: () => void;
}

export interface MediaInstanceInterface {
	id: string;
	loop: boolean;
	muted: boolean;
	paused: boolean;
	progress: number;
	speed: number;
	volume: number;
	stop(): void;
	pause(): void;
	resume(): void;
    destroy(): void;
}