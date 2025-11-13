import EventEmitter from "eventemitter3";
import type { Parameter } from "@/components/parameters";
import type { NumberRange } from "@/components/types";
import type { RoutingHandler } from "../routing";

/**
 * Enumeration of audio bus events
 */
export enum AudioBusEvents {
	VOLUME_CHANGE = "AUDIO_CHANNEL_VOLUME_CHANGE",
	MUTE_CHANGE = "AUDIO_CHANNEL_MUTE_CHANGE",
	PAN_CHANGE = "AUDIO_CHANNEL_PAN_CHANGE",
}

/**
 * Interface for the event information of an audio bus event
 */
export interface AudioBusEventInfo {
	/**
	 * Event triggered
	 */
	event: AudioBusEvents;
	/**
	 * Object that triggered the event.
	 */
	target: AudioBus;
	/**
	 * Value previous to the event.
	 */
	previousValue: number | boolean;
	/**
	 * Value after the event.
	 */
	value: number | boolean;
	/**
	 * Value interpolated value after routing processing.
	 */
	interpolatedValue: number | boolean;
}

/**
 * Default options for audio bus
 */
export interface AudioBusOptions {
	/**
	 * Name of the audio bus
	 */
	name: string; 
	/**
	 * Initial volume [0 to 1]. 1 will be set as default.
	 */
	volume?: number;
	/**
	 * Initial mute state. False will be set ad default.
	 */
	mute?: boolean;
	/**
	 * Initial pan value [-1 to 1]. 0 will be set as default.
	 */
	pan?: number;
}

/**
 * Interface for the audio clip
 */
export interface AudioBus extends EventEmitter {
	/**
	 * Name of the audio bus/clip
	 */
	name: string;
	/**
	 * Volume of the audio bus/clip [0 to 1]
	 */
	mute: boolean;
	/**
	 * Pan value of the audio bus/clip [-1 to 1]
	 */
	volume: Parameter;
	/**
	 * Pan value of the audio bus/clip [-1 to 1]
	 */
	pan: Parameter;
	/**
	 * Routing handler for this audio bus
	 */
	readonly routing: RoutingHandler;
	/**
	 * It handles the actions before the destruction of the bus.
	 */
	destroy(): void;
}

/**
 * Interface for the audio clip options
 */
export interface AudioClipOptions extends AudioBusOptions {
	/**
	 * Number of times to repeat the clip. 0 means infinite.
	 */
	repeat?: number;
	/**
	 * Indicates if the clip should be played in a loop
	 */
	loop?: boolean;
	/**
	 * Condition to play the clip
	 *  
	 * @returns True if the clip should be played
	 */
	condition?: () => boolean;
	/**
	 * Delay before playing the clip. 0 means no delay.
	 */
	delay?: number | NumberRange;
	/**
	 * Pitch of the clip in semitones [-12 to 12]. This value will be converted to speed.
	 * 0 will be set as default.
	 */
	pitch?: number;
	/**
	 * Offset in seconds to start playing the clip
	 */
	offset?: number;
}
/**
 * Interface for the audio clip item in a list
 */
export interface ClipListItem {
	/**
	 * Name of the audio clip
	 */
	name: string;
	/**
	 * Probability weight of the clip in the list when playing in random mode. Higher values mean more likely to be played.
	 */
	weight?: number;
	/**
	 * Volume of the clip in the list that is interpolated with the main volumen level. 1 will be set as default.
	 */
	volume?: number;
}
/**
 * Enumeration of audio multiple clip modes
 */
export enum AudioMultipleClipMode {
	/**
	 * Clips will be played in the order they are defined in the list.
	 */
	SEQUENTIAL = "SEQUENTIAL",
	/**
	 * Clips will be played in random order based on their weight.
	 */
	RANDOM = "RANDOM",
	/**
	 * Clips will be played in random order without considering their weight.
	 */
	SHUFFLE = "SHUFFLE",
}
/**
 * Interface for the audio multiple clip options
 */
export interface AudioMultipleClipOptions extends AudioClipOptions {
	clipList: ClipListItem[];
	mode?: AudioMultipleClipMode;
}
