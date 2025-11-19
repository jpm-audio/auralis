import type { PlayOptions } from "./types";

export interface SoundSpriteData {
	start: number;
	end: number;
	loop?: boolean;
}

export interface SoundDefinition {
	name: string;
	url: string | string[];
	preload?: boolean;
	sprites?: Record<string, SoundSpriteData>;
	duration?: number;
}

export class SoundObject {
	public readonly name: string;
	public readonly url: string | string[];
	public readonly preload: boolean;
	public readonly sprites?: Record<string, SoundSpriteData>;
	public duration?: number;

	constructor(definition: SoundDefinition) {
		this.name = definition.name;
		this.url = definition.url;
		this.preload = !!definition.preload;
		this.sprites = definition.sprites;
		this.duration = definition.duration;
	}

	public resolvePlayOptions(options: PlayOptions = {}): PlayOptions {
		const spriteName = options.sprite;
		if (spriteName && this.sprites) {
			const sprite = this.sprites[spriteName];
			if (sprite) {
				const lengthMs = sprite.end - sprite.start;
				return {
					...options,
					start: (sprite.start ?? 0) / 1000,
					loop: options.loop ?? sprite.loop ?? false,
					complete: options.complete,
				};
			}
		}

		return options;
	}
}
