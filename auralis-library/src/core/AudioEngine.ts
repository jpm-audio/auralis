// Temporarily disabled while testing AudioLoader.
// Remove this wrapper to restore the original implementation.

// import AudioMixer from "../components/routing/AudioMixer";
// import { Utils } from "../utils/utils";
// import { GLOBAL_CONFIG } from "./AudioGlobalConfig";
// import { AudioTicker } from "./AudioTicker";
// import {
// 	sound,
// 	type AddSoundOptions,
// 	type IMediaInstance,
// 	type PlayOptions,
// 	type SoundSourceMap,
// 	type SoundSpriteData,
// } from "../sound";
// import type { AudioCatalogItem, AudioGlobalConfig, AudioLoadOptions } from "./types";
//
// /**
//  *  This class is used to manage the audio, including loading sounds, controlling volume, and managing audio buses.
//  */
// export class AudioEngine {
//     /**
// 	 * Static reference as shorcut to reach the utils.
// 	 */
//     public static readonly utils = Utils;
//     /**
// 	 * Static reference as shorcut to reach the global config.
// 	 */
//     public static GLOBAL_CONFIG: AudioGlobalConfig = GLOBAL_CONFIG;
//     /**
// 	 * Indicates whether the audio engine has been initialized.
// 	 */
//     private _initialized: boolean = false;
//     /**
//      * The AudioContext used by the audio engine.
//      */
//     private _audioContext: AudioContext;
//     /**
// 	 * Ticker instance used to manage the audio engine's timing.
// 	 */
//     private _ticker: AudioTicker;
//     /**
// 	 * Audio mixer instance used to manage audio routing and mixing.
// 	 */
//     private _mixer: AudioMixer;
//
//
//     private _catalog: Map<string, AudioCatalogItem>;
//     /**
//      * Return the current AudioContext instance.
//      */
//     public get context(): AudioContext {
//         return this._audioContext;
//     }
//     /**
// 	 * Return the current ticker instance.
// 	 */
//     public get ticker(): AudioTicker {
//         return this._ticker;
//     }
//     /**
// 	 * Return the current mixer instance.
// 	 */
//     public get mixer(): AudioMixer {
//         return this._mixer;
//     }
//     /**
// 	 * Return the current master bus instance.
// 	 */
//     public set volume(value: number) {
//         const clampedValue = Math.max(Math.min(value, 1), 0);
//         this._mixer.master.volume.value = clampedValue;
//     }
//     /**
// 	 * Set the volume of the master bus.
// 	 * @param value - The volume value to set (0 to 1).
// 	 */
//     public get volume(): number {
//         return this._mixer.master.volume.value;
//     }
//     /**
// 	 * Set the mute state of the master bus.
// 	 * @param value - The mute state to set (true to mute, false to unmute).
// 	 */
//     public set mute(value: boolean) {
//         this._mixer.master.mute = value;
//     }
//     /**
// 	 * Get the mute state of the master bus.
// 	 * @returns {boolean} - The mute state of the master bus (true if muted, false if unmuted).
// 	 */
//     public get mute(): boolean {
//         return this._mixer.master.mute;
//     }
//     /**
// 	 * Set the panning of the master bus.
// 	 * @param value - The panning value to set (-1 to 1).
// 	 */
//     public constructor() {
//         this._audioContext = new AudioContext();
//         this._ticker = new AudioTicker({ audioContext: this._audioContext });
//         this._mixer = new AudioMixer();
//         this._catalog = new Map<string, AudioCatalogItem>();
//
//         (window as any).audioEngine = this; // Expose the audio engine globally for debugging purposes
//     }
//     /**
// 	 * Add an item to the audio catalog.
// 	 * @param name - The name of the sound.
// 	 * @param sprite - The sound sprite data.
// 	 */
//     private _addCatalogItem(
//         name: string,
//         sprites?: Record<string, SoundSpriteData>
//     ): void {
//         if (sprites) {
//             const audioSprite = name;
//             for (let soundName in sprites) {
//                 const item: AudioCatalogItem = {
//                     name: soundName,
//                     audioSprite: audioSprite,
//                     duration: sprites[soundName].end - sprites[soundName].start,
//                 };
//                 this._catalog.set(soundName, item);
//             }
//         } else {
//             const item: AudioCatalogItem = {
//                 name: name,
//                 audioSprite: undefined,
//                 duration: sound.duration(name), // Duration is not available for single audio files
//             };
//             this._catalog.set(name, item);
//         }
//     }
//     /**
// 	 * It checks if a sound exists in the audio catalog by its name. 
// 	 * @param name - The name of the sound to check.
// 	 * @returns  {boolean} - Returns true if the sound exists in the catalog, false otherwise.
// 	 */
//     public exists(name: string): boolean {
//         return this._catalog.has(name);
//     }
//     /**
// 	 * Initialize the audio engine with the provided global configuration.
// 	 * @param globalConfig - The global configuration object.
// 	 */
//     public init(globalConfig?: Partial<AudioGlobalConfig>): void {
//         if (this._initialized) {
//             throw new Error("AudioEngine is already initialized");
//         }
//         this._initialized = true;
//
//         // Global Config initialization
//         if (globalConfig) {
//             AudioEngine.GLOBAL_CONFIG = {
//                 ...AudioEngine.GLOBAL_CONFIG,
//                 ...globalConfig,
//             };
//         }
//
//         // Ticker initialization
//         this._ticker.setFPS(AudioEngine.GLOBAL_CONFIG.ticker.fps);
//         if (AudioEngine.GLOBAL_CONFIG.ticker.autostart) {
//             this._ticker.start();
//         }
//     }
//     /**
// 	 * Add multiple sound sources to the audio engine.
// 	 * @param map - The map of sound sources to add to the audio engine.
// 	 * @returns  {AudioEngine} - The current instance of the audio engine.
// 	 */
//     public addSounds(map: SoundSourceMap): AudioEngine {
//         sound.add(map);
//         return this;
//     }
//     /**
// 	 * Load a sound file and add it to the audio engine.
// 	 * @param name - The name for the sound.
// 	 * @param url - The URL of the sound file.
// 	 * @returns {Promise<AudioEngine>} - A promise that resolves when the sound is loaded.
// 	 */
//     public async loadSound(
//         name: string,
//         options: AudioLoadOptions
//     ): Promise<AudioEngine> {
//         if (sound.exists(name)) {
//             throw new Error(`Sound with name "${name}" already exists.`);
//         }
//
//         return await new Promise<AudioEngine>((resolve, reject) => {
//             // Prepare options for loading the sound
//             const loadingData: AddSoundOptions = {
//                 preload: true,
//                 url: options.paths,
//                 sprites: options.sprite,
//                 loaded: (e: Error | null) => {
//                     if (e) {
//                         reject(e);
//                     } else {
//                         this._addCatalogItem(name, options.sprite);
//                         resolve(this);
//                     }
//                 },
//             };
//
//             // Load the sound.
//             sound.add(name, loadingData);
//         });
//     }
//     /**
// 	 * Play a sound with the specified name.
// 	 * @param name - The name of the sound to play.
// 	 * @param options - Optional parameters for playing the sound, such as volume, loop, and complete callback.
// 	 * @returns
// 	 */
//     public play(
//         name: string,
//         options?: PlayOptions
//     ): IMediaInstance | Promise<IMediaInstance> {
//         const audioItem = this._catalog.get(name);
//         if (!audioItem) {
//             throw new Error(
//                 `AudioEngine::play - Sound with name "${name}" does not exist in the catalog.`
//             );
//         }
//         if (audioItem.audioSprite) {
//             return sound.play(audioItem.audioSprite, {
//                 ...(options || {}),
//                 ...{ sprite: name },
//             });
//         } else {
//             return sound.play(name, options);
//         }
//     }
//     /**
// 	 * Stops all currently playing sounds.
// 	 * @returns {AudioEngine} - The current instance of the audio engine.
// 	 */
//     public stopAll(): AudioEngine {
//         sound.stopAll();
//         return this;
//     }
//     /**
// 	 * Pause all currently playing sounds.
// 	 * @returns {AudioEngine} - The current instance of the audio engine.
// 	 */
//     public pauseAll(): AudioEngine {
//         sound.pauseAll();
//         return this;
//     }
//     /**
// 	 * Resume all paused sounds.
// 	 * @returns {AudioEngine} - The current instance of the audio engine.
// 	 */
//     public resumeAll(): AudioEngine {
//         sound.resumeAll();
//         return this;
//     }
//
//     public async resume(): Promise<void> {
//         if (this.context.state === 'suspended') {
//             await this.context.resume();
//         }
//     }
//
//     public suspend(): void {
//         this.context.suspend();
//     }
// }
//
// const audioEngine = new AudioEngine();
// export default audioEngine;
