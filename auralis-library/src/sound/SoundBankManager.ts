// Temporarily disabled while testing AudioLoader.
// Remove this wrapper to restore the original implementation.

// import { SoundInstance, type IMediaInstance, type PlayOptions } from "./SoundInstance";
// import { SoundObject, type SoundDefinition, type SoundSpriteData } from "./SoundObject";
//
// export interface AddSoundOptions {
// 	preload?: boolean;
// 	url: string | string[];
// 	sprites?: Record<string, SoundSpriteData>;
// 	duration?: number;
// 	loaded?: (error: Error | null) => void;
// }
//
// export type SoundSourceMap = Record<string, AddSoundOptions>;
//
// export class SoundBankManager {
// 	private readonly _sounds = new Map<string, SoundObject>();
// 	private readonly _instances = new Set<SoundInstance>();
//
// 	public exists(name: string): boolean {
// 		return this._sounds.has(name);
// 	}
//
// 	public add(name: string, options: AddSoundOptions): void;
// 	public add(map: SoundSourceMap): void;
// 	public add(nameOrMap: string | SoundSourceMap, maybeOptions?: AddSoundOptions): void {
// 		if (typeof nameOrMap === "string") {
// 			this.registerSound(nameOrMap, maybeOptions ?? { url: "" });
// 		} else {
// 			for (const [name, options] of Object.entries(nameOrMap)) {
// 				this.registerSound(name, options);
// 			}
// 		}
// 	}
//
// 	public duration(name: string): number {
// 		const sound = this._sounds.get(name);
// 		return sound?.duration ?? 0;
// 	}
//
// 	public async play(name: string, options?: PlayOptions): Promise<IMediaInstance> {
// 		const sound = this._sounds.get(name);
// 		if (!sound) {
// 			throw new Error(`Sound not found: ${name}`);
// 		}
//
// 		const resolved = sound.resolvePlayOptions(options);
// 		const instance = new SoundInstance(name, resolved);
// 		this._instances.add(instance);
//
// 		const lengthMs =
// 			sound.duration != null ? sound.duration * 1000 : resolved.loop ? 0 : 0;
// 		if (lengthMs > 0) {
// 			instance.scheduleComplete(lengthMs);
// 		} else if (resolved.complete) {
// 			// Without duration we invoke completion immediately in next microtask
// 			queueMicrotask(() => resolved.complete?.());
// 		}
//
// 		instance.stop = instance.stop.bind(instance);
// 		const originalStop = instance.stop;
// 		instance.stop = () => {
// 			this._instances.delete(instance);
// 			originalStop();
// 		};
//
// 		return instance;
// 	}
//
// 	public stopAll(): void {
// 		for (const instance of this._instances) {
// 			instance.stop();
// 		}
// 		this._instances.clear();
// 	}
//
// 	public pauseAll(): void {
// 		for (const instance of this._instances) {
// 			instance.pause();
// 		}
// 	}
//
// 	public resumeAll(): void {
// 		for (const instance of this._instances) {
// 			instance.resume();
// 		}
// 	}
//
// 	private registerSound(name: string, options: AddSoundOptions): void {
// 		const definition: SoundDefinition = {
// 			name,
// 			url: options.url,
// 			preload: options.preload,
// 			sprites: options.sprites,
// 			duration: options.duration,
// 		};
// 		this._sounds.set(name, new SoundObject(definition));
// 		options.loaded?.(null);
// 	}
// }
//
// export const soundBankManager = new SoundBankManager();
