import audioEngine, { AudioEngine } from "@/core/AudioEngine";
import { AudioClip } from "./AudioClip";
import {
    AudioMultipleClipMode,
    type AudioMultipleClipOptions,
    type ClipListItem,
} from "./types";
import { Pitch, Interpolation } from "@/utils";

/**
 * AudioMultipleClip class extends AudioClip to handle multiple audio clips with different playback modes.
 * It supports sequential, random, and shuffle playback of audio clips.
 */
export class AudioMultipleClip extends AudioClip {
    /**
	 * List of audio clips to be played.
	 * Each item in the list should have a name and can optionally have a weight and volume.
	 */
    protected _clipList: ClipListItem[];
    /**
	 * The mode of playback for the audio clips.
	 * It can be one of the following:
	 * - SEQUENTIAL: Clips are played in the order they are defined.
	 * - RANDOM: Clips are played in random order based on their weight.
	 * - SHUFFLE: Clips are played in random order without considering their weight.
	 */
    protected _mode!: AudioMultipleClipMode;
    /**
	 * Current index of the clip being played in the playback list.
	 * This is used to track which clip is currently active.
	 */
    protected _currentClipIndex: number = -1;
    /**
	 * Playback list that determines the order of clips to be played.
	 * This is generated based on the mode and the clip list.
	 */
    protected _playbackList: number[] = [];
    /**
	 * Returns the list of audio clips that can be played.
	 * Each item in the list should have a name and can optionally have a weight and volume.
	 */
    public get clipList(): ClipListItem[] {
        return this._clipList;
    }
    /**
	 * Current mode of playback for the audio clips.
	 */
    public get mode(): AudioMultipleClipMode {
        return this._mode;
    }
    /**
	 * Sets the mode of playback for the audio clips.
	 * When the mode is changed, the clip playback is reset to start from the beginning.
	 * @param value - The new mode to set for playback.
	 */
    public set mode(value: AudioMultipleClipMode) {
        this._mode = value;
        this.resetClipPlayback();
    }
    /**
	 *  Constructor for the AudioMultipleClip class.
	 * @param options - The options for the audio multiple clip, including the clip list and mode.
	 */
    constructor(options: AudioMultipleClipOptions) {
        super(options);

        this._clipList = options.clipList;
        this.mode =
			options.mode || AudioEngine.GLOBAL_CONFIG.audioClip.multipleClipMode;
    }
    /**
	 * Move one item forwrad in the playback list and return the next clip to play.
	 * @returns The next clip to play based on the current mode and playback list.
	 */
    protected _nextClip(): ClipListItem | undefined {
        if (this._currentClipIndex >= this._playbackList.length - 1) {
            this.resetClipPlayback();
        }
        this._currentClipIndex++;

        return this._clipList[this._playbackList[this._currentClipIndex]];
    }
    /**
	 * Plays the next clip in the playback list.
	 */
    protected async _playSound(): Promise<void> {
        const startOffset = Math.max(0, this._offset.value) / 1000;
        const nextClip = this._nextClip();

        if (!nextClip) {
            console.warn(`No clip available to play for ${this._name}`);
            return;
        }

        this._soundInstance = await audioEngine.play(nextClip.name, {
            volume: this._calculateSoundVolume(),
            muted: this._routing.interpolatedMute,
            speed: Pitch.pitchToSpeed(this._pitch.value),
            start: startOffset,
            complete: () => this._onComplete(),
        });

        if (this._soundInstance) {
            this._soundInstance.loop = this._loop;
        }
    }
    /**
	 * Calculates the volume that the sound instance should have from the routing and fade automation.
	 *
	 * @returns {number} - The volume calculated for the sound instance
	 */
    protected _calculateSoundVolume(): number {
        const clipVolume = this._clipList[this._currentClipIndex]?.volume ?? 1;
        const routingVolume = this._routing.interpolatedVolume;
        const fadingVolume = this._fadeAutomation.value;
        return Interpolation.volume(clipVolume, routingVolume, fadingVolume);
    }
    /**
	 * Resets the playback list and current clip index to start playing from the beginning.
	 * This method should be called when the mode changes, clip list changes or when you want to restart playback.
	 */
    public resetClipPlayback(): void {	

        // RANDOM
        // Set items in random order into the list using the weight of the clips
        if (this._mode === AudioMultipleClipMode.RANDOM) {
            const weightCheckpoints: number[] = [];
            const totalWeight = this._clipList.reduce((acc, clipItem) => {
                const checkpoint = acc + Math.max(0,(clipItem.weight ?? 1));
                weightCheckpoints.push(checkpoint);
                return checkpoint;
            }, 0);

            this._playbackList = this._clipList.map((clipItem, index) => {
                const randomValue = Math.random() * totalWeight;
                return weightCheckpoints.findIndex(
                    (checkpoint) => randomValue <= checkpoint
                );
            });
        }
        // SHUFFLE
        // Set shuffled for pure and unbalanced random order into the list
        else if (this._mode === AudioMultipleClipMode.SHUFFLE) {
            this._playbackList = this._clipList.map((_, index) => index);
            this._playbackList.sort(() => Math.random() - 0.5); // Shuffle the indices
        }
        // SEUENTIAL
        // Set sequential order into the list
        else{
            this._playbackList = this._clipList.map((_, index) => index);
        }

        // Reset the current clip index to start from the beginning
        this._currentClipIndex = -1;
    }
}
