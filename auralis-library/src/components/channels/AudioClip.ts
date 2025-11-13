// Temporarily disabled while testing AudioLoader.
// Remove this wrapper to restore the original implementation.

// import { AUDIO_CLIP_OPTIONS_DEFAULT } from "../constants/AudioClipOptions";
// import type { Playable } from "../types";
// import type { AudioClipOptions, AudioBusEventInfo } from "./types";
// import { AudioBusEvents } from "./types";
// import AudioBus from "./AudioBus";
// import VirtualPlayer from "../timeline/VirtualPlayer";
// import { Deferred } from "../../utils/deferred";
// import { Parameter } from "../parameters/Parameter";
// import {
//     eParamAutomationEvent,
//     ParameterType,
//     type IFadeConfig,
// } from "../parameters/types";
// import Pitch from "../../utils/pitch";
// import FadeAutomation from "../parameters/FadeAutomation";
// import Interpolation from "../../utils/interpolation";
// import { GLOBAL_CONFIG } from "../../core/AudioGlobalConfig";
// import audioEngine from "../../core/AudioEngine";
// import { sound, type IMediaInstance } from "../../sound";
//
// /**
//  * @class AudioClip
//  * This class extends the AudioBus class and add the functionality to play, pause, and stop audio clips.
//  */
// export default class AudioClip extends AudioBus implements Playable {
//     /**
// 	 * Specific parameter automation for controlling volume along fade in and fade out possible fadings.
// 	 */
//     protected _fadeAutomation: FadeAutomation;
//     /**
// 	 * Sound instance of the clip
// 	 * @type {IMediaInstance | null}
// 	 * @private
// 	 */
//     protected _soundInstance: IMediaInstance | null = null;
//     /**
// 	 * The deferred object used for handling playback promises.
// 	 * It is also used to check whether the automation is playing or not.
// 	 * @type {Deferred<ParamAutomation> | undefined}
// 	 * @protected
// 	 * @default undefined
// 	 */
//     protected _playbackDeferred: Deferred<AudioClip> | undefined;
//     /**
// 	 * Number of times the clip has to be played in a row.
// 	 * 0 means no repeat.
// 	 * @type {number}
// 	 * @private
// 	 */
//     protected _currentRepeat: number = 0;
//     /**
// 	 * Indicates if the clip is paused
// 	 * @type {boolean}
// 	 * @private
// 	 */
//     protected _isPaused: boolean = false;
//     /**
// 	 * Indicates if the clip is stopping
// 	 * @type {boolean}
// 	 * @private
// 	 */
//     protected _isStopping: boolean = false;
//     /**
// 	 * Name of the audio clip
// 	 * @type {string}
// 	 * @private
// 	 */
//     protected _delayInstance: VirtualPlayer | null = null;
//     /**
// 	 * Number of times the clip has to be played in a row.
// 	 * 0 means no repeat.
// 	 * @type {number}
// 	 * @private
// 	 */
//     protected _repeat: number = 0;
//     /**
// 	 * Indicates if the clip is paused
// 	 * @type {boolean}
// 	 * @private
// 	 */
//     protected _loop: boolean = false;
//     /**
// 	 * Condition to play the clip
// 	 * @type {() => boolean}
// 	 * @private
// 	 */
//     protected _condition: () => boolean = () => true;
//     /**
// 	 * Pitch of the clip in semitones [-12 to 12]. This value will be converted to speed.
// 	 * 0 will be set as default.
// 	 * @type {number}
// 	 * @private
// 	 */
//     protected _pitch: Parameter;
//     /**
// 	 * Offset of the clip in milliseconds
// 	 * @type {number}
// 	 * @private
// 	 */
//     protected _offset: Parameter;
//     /**
// 	 * Get the name of the audio clip
// 	 * @returns {string} - The name of the audio clip
// 	 */
//     public get isPlaying(): boolean {
//         return this._playbackDeferred !== undefined;
//     }
//     /**
// 	 * Get the current time of the audio clip
// 	 * @returns {number} - The current time of the audio clip in milliseconds
// 	 */
//     public get currentTime(): number {
//         const soundTime = this._soundInstance
//             ? this._soundInstance.progress * sound.duration(this._name)
//             : 0;
//         const delayTime = this._delayInstance ? this._delayInstance.duration : 0;
//         return delayTime + soundTime;
//     }
//     /**
// 	 * Get the sound instance of the audio clip
// 	 * @returns {IMediaInstance | null} - The sound instance of the audio clip
// 	 */
//     public get soundInstance(): IMediaInstance | null {
//         return this._soundInstance;
//     }
//     /**
// 	 * Get the current pitch parameter of the audio clip
// 	 * @returns {Parameter} - The current pitch parameter of the audio clip
// 	 */
//     public get pitch(): Parameter {
//         return this._pitch;
//     }
//     /**
// 	 * Set the pitch of the audio clip in semitones [-24 to 24]
// 	 * Pitch relates to the speed of the audio clip.
// 	 * @param {number} pitch - The pitch to set
// 	 */
//     protected _onPitchParameterUpdate(pitch: number) {
//         this._pitch.value = pitch;
//         const speed = Pitch.pitchToSpeed(pitch);
//
//         if (this._delayInstance) {
//             this._delayInstance.speed = speed;
//         }
//         if (this._soundInstance) {
//             this._soundInstance.speed = speed;
//         }
//     }
//     /**
// 	 * Get the offset parameter of the audio clip
// 	 * @returns {Parameter} - The offset parameter of the audio clip
// 	 */
//     public get offset(): Parameter {
//         return this._offset;
//     }
//     /**
// 	 * Get the repeat count of the audio clip
// 	 * @returns {number} - The repeat count of the audio clip
// 	 */
//     public get repeat(): number {
//         return this._repeat;
//     }
//     /**
// 	 * Set the repeat count of the audio clip
// 	 * @param {number} repeat - The repeat count to set
// 	 * @throws {Error} - If the repeat count is not a positive integer
// 	 */
//     public set repeat(repeat: number) {
//         this._repeat = repeat;
//     }
//     /**
// 	 * Get the loop state of the audio clip
// 	 * @returns {boolean} - The loop state of the audio clip
// 	 */
//     public get loop(): boolean {
//         return this._loop;
//     }
//     /**
// 	 * Set the loop state of the audio clip
// 	 * @param {boolean} loop - The loop state to set
// 	 */
//     public set loop(loop: boolean) {
//         this._loop = loop;
//         if (this._soundInstance) {
//             this._soundInstance.loop = loop;
//         }
//     }
//     /**
// 	 * Get the condition function of the audio clip to be played
// 	 *  This is used to control the playback of the audio clip based on certain conditions.
// 	 * @returns {() => boolean} - The condition function of the audio clip
// 	 */
//     public get condition(): () => boolean {
//         return this._condition;
//     }
//     /**
// 	 * Set the condition function of the audio clip to be played
// 	 *  This is used to control the playback of the audio clip based on certain conditions.
// 	 * @param {() => boolean} condition - The condition function to set
// 	 */
//     public set condition(condition: () => boolean) {
//         this._condition = condition;
//     }
//     /**
// 	 * Get the fade in configuration of the audio clip
// 	 * @returns {IFadeConfig} - The fade in configuration of the audio clip
// 	 */
//     public set fadeInConfig(config: IFadeConfig) {
//         this._fadeAutomation.inConfig = config;
//     }
//     /**
// 	 * Get the fade out configuration of the audio clip
// 	 * @returns {IFadeConfig} - The fade out configuration of the audio clip
// 	 */
//     public set fadeOutConfig(config: IFadeConfig) {
//         this._fadeAutomation.outConfig = config;
//     }
//     /**
// 	 * Get the fade in configuration of the audio clip
// 	 * @returns {IFadeConfig} - The fade in configuration of the audio clip
// 	 */
//     public get fadeInConfig(): IFadeConfig {
//         return this._fadeAutomation.inConfig;
//     }
//     /**
// 	 * Get the fade out configuration of the audio clip
// 	 * @returns {IFadeConfig} - The fade out configuration of the audio clip
// 	 */
//     public get fadeOutConfig(): IFadeConfig {
//         return this._fadeAutomation.outConfig;
//     }
//     /**
// 	 * Get the duration of the audio clip in milliseconds
// 	 * @returns {number} - The duration of the audio clip in milliseconds
// 	 */
//     public get duration(): number {
//         return sound.duration(this._name);
//     }
//     /**
// 	 * Constructor for the AudioClip class.
// 	 * @param {AudioClipOptions} options - The options for the audio clip.
// 	 *  This includes the name, volume, mute state, pan value, repeat count, loop state,
// 	 *  condition function, delay, pitch, and offset.
// 	 */
//     constructor(options: AudioClipOptions) {
//         super(options, { disableOutput: false, disableInput: true });
//
//         const { repeat, loop, condition, delay, pitch, offset } = {
//             ...AUDIO_CLIP_OPTIONS_DEFAULT,
//             ...options,
//         };
//
//         this.repeat = repeat as number;
//         this.loop = loop as boolean;
//         this.condition = condition as () => boolean;
//
//         this._offset = new Parameter({
//             name: "offset",
//             type: ParameterType.CONTINUOUS,
//             range: GLOBAL_CONFIG.audioClip.offset.range,
//             value: offset || GLOBAL_CONFIG.audioClip.offset.value,
//         });
//
//         this._pitch = new Parameter({
//             name: "pitch",
//             type: ParameterType.CONTINUOUS,
//             range: GLOBAL_CONFIG.audioClip.pitch.range,
//             value: pitch || GLOBAL_CONFIG.audioClip.pitch.value,
//         });
//
//         this._fadeAutomation = new FadeAutomation();
//         this._fadeAutomation.on(
//             eParamAutomationEvent.UPDATE,
//             this._onVolumeChange,
//             this
//         );
//
//         this.on(AudioBusEvents.VOLUME_CHANGE, this._onVolumeChange, this);
//         this.on(AudioBusEvents.PAN_CHANGE, this._onPanChange, this);
//         this.on(AudioBusEvents.MUTE_CHANGE, this._onMuteChange, this);
//     }
//     /**
// 	 *  This function will be called when the sound is complete.
// 	 *  It will check if the sound should be played again or stopped.
// 	 */
//     protected _onComplete(): void {
//         if (this._loop) {
//             return;
//         }
//
//         this._currentRepeat++;
//         if (this._currentRepeat <= this._repeat) {
//             this.play();
//         } else {
//             this.stop();
//         }
//     }
//     /**
// 	 *  This function will play the sound using the sound library.
// 	 *  It will set the volume, speed, loop and start time of the sound.
// 	 */
//     protected async _playSound(): Promise<void> {
//         const startOffset = Math.max(0, this._offset.value) / 1000;
//
//         this._soundInstance = await audioEngine.play(this._name, {
//             volume: this._calculateSoundVolume(),
//             muted: this._routing.interpolatedMute,
//             speed: Pitch.pitchToSpeed(this._pitch.value),
//             start: startOffset,
//             complete: () => this._onComplete(),
//         });
//
//         if (this._soundInstance) {
//             this._soundInstance.loop = this._loop;
//         }
//     }
//     /**
// 	 * Calculates the volume that the sound instance should have from the routing and fade automation.
// 	 *
// 	 * @returns {number} - The volume calculated for the sound instance
// 	 */
//     protected _calculateSoundVolume(): number {
//         const routingVolume = this._routing.interpolatedVolume;
//         const fadingVolume = this._fadeAutomation.value;
//         return Interpolation.volume(routingVolume, fadingVolume);
//     }
//     /**
// 	 * Called when the volume of the audio clip changes or when the fade automation updates.
// 	 * It will set the volume of the sound instance to the new value from the interpolation of the routing and fade automation.
// 	 */
//     protected _onVolumeChange(): void {
//         if (this._soundInstance) {
//             this._soundInstance.volume = this._calculateSoundVolume();
//         }
//     }
//     /**
// 	 *  This function will be called when the pan of the audio clip changes.
// 	 *  It will set the pan of the sound instance to the new value.
// 	 * @param {AudioBusEventInfo} info - The event info object
// 	 */
//     protected _onPanChange(info: AudioBusEventInfo): void {
//         if (this._soundInstance) {
//             //this._soundInstance.pan = info.interpolatedValue as number;
//         }
//     }
//     /**
// 	 *  This function will be called when the mute state of the audio clip changes.
// 	 *  It will set the mute state of the sound instance to the new value.
// 	 * @param {AudioBusEventInfo} info - The event info object
// 	 */
//     protected _onMuteChange(info: AudioBusEventInfo): void {
//         if (this._soundInstance) {
//             this._soundInstance.muted = info.interpolatedValue as boolean;
//         }
//     }
//     /**
// 	 *  This function will return the duration of the audio clip in milliseconds.
// 	 *  If the sound instance is not available, it will return 0.
// 	 * @returns {number} - The duration of the audio clip in milliseconds
// 	 */
//     public getDuration(): number {
//         if (!this._soundInstance) {
//             return 0;
//         }
//         return sound.duration(this._name) * 1000 || 0; // Convert to ms
//     }
//     /**
// 	 *  This function will return the current time of the audio clip in milliseconds.
// 	 *  If the sound instance is not available, it will return 0.
// 	 * @returns {number} - The current time of the audio clip in milliseconds
// 	 */
//     public getCurrentTime(): number {
//         if (!this._soundInstance) {
//             return 0;
//         }
//         return this._soundInstance.progress * this.getDuration();
//     }
//     /**
// 	 *  This function will play the audio clip using the sound library.
// 	 *  It will set the volume, speed, and start time of the sound.
// 	 *  It will also set the loop state of the sound.
// 	 */
//     public async play(): Promise<any> {
//         if (!this._condition()) {
//             return;
//         }
//
//         // Unpause if paused
//         if (this._isPaused) {
//             // Resume from pause
//             if (this._delayInstance) {
//                 this._delayInstance.play();
//             } else if (this._soundInstance) {
//                 this._soundInstance.paused = false;
//             }
//
//             // Unpuase possible fade
//             if (this._fadeAutomation.isPaused) {
//                 this._fadeAutomation.play();
//             }
//             return;
//         }
//
//         // Already Playing?
//         if (this.isPlaying) {
//             return;
//         }
//
//         // Start new playback
//         const delay = this._offset.value * -1; // Negative offset is a delay time before starting the sound.
//         this._playbackDeferred = new Deferred<AudioClip>();
//
//         // Play fade in
//         this._fadeAutomation.in();
//
//         if (delay > 0) {
//             this._delayInstance = new VirtualPlayer(delay, () => {
//                 this._playSound();
//                 this._delayInstance = null;
//             });
//             this._delayInstance.speed = Pitch.pitchToSpeed(this._pitch.value);
//             this._delayInstance.play();
//         } else {
//             this._playSound();
//         }
//
//
//
//         return this._playbackDeferred.promise;
//     }
//     /**
// 	 *  This function will pause the audio clip using the sound library.
// 	 *  It will set the paused state of the sound instance to true.
// 	 */
//     public pause(): void {
//         if (!this.isPlaying) {
//             return;
//         }
//
//         if (this._delayInstance) {
//             this._delayInstance.pause();
//         }
//         if (this._soundInstance) {
//             this._soundInstance.paused = true;
//         }
//
//         // Pause possible fade
//         this._fadeAutomation.pause();
//
//         this._isPaused = true;
//     }
//     /**
// 	 *  This function will stop the audio clip using the sound library.
// 	 *  It will destroy the sound instance and set it to null.
// 	 *  It will also reset the repeat count and paused state of the audio clip.
// 	 */
//     public async stop(): Promise<void> {
//         if (!this.isPlaying || this._isStopping) {
//             return;
//         }
//
//         this._isStopping = true;
//
//         // Fade out before stop
//         await this._fadeAutomation.out(this._soundInstance?.volume);
//
//         // Stop all
//         if (this._delayInstance) {
//             this._delayInstance.stop();
//             this._delayInstance = null;
//         }
//         if (this._soundInstance) {
//             this._soundInstance.stop();
//             this._soundInstance.destroy();
//             this._soundInstance = null;
//         }
//
//         if (this._playbackDeferred) {
//             this._playbackDeferred.resolve(this);
//             this._playbackDeferred = undefined;
//         }
//
//         this._currentRepeat = 0;
//         this._isPaused = false;
//         this._isStopping = false;
//     }
//     /**
// 	 *  This function will destroy the audio clip and all its resources.
// 	 *  It will stop any fade automation and remove all event listeners.
// 	 */
//     public destroy(): void {
//         super.destroy();
//
//         this._fadeAutomation.stop();
//         this._fadeAutomation.off(
//             eParamAutomationEvent.UPDATE,
//             this._onVolumeChange,
//             this
//         );
//         this.off(AudioBusEvents.VOLUME_CHANGE, this._onVolumeChange, this);
//         this.off(AudioBusEvents.PAN_CHANGE, this._onPanChange, this);
//         this.off(AudioBusEvents.MUTE_CHANGE, this._onMuteChange, this);
//
//         this._pitch.destroy();
//         this._offset.destroy();
//         this._soundInstance?.destroy();
//     }
// }
