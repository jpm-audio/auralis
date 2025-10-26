import type { AudioBus, AudioBusOptions } from "../channels";


/**
 * Interface for the options used to create a routing handler
 */
export interface RoutingHandlerOptions {
	/** The audio bus that will own the routing handler*/
	owner: AudioBus;

	/** Indicates if the output connection is disabled */
	disableOutput?: boolean;

	/** Indicates if the input connection is disabled */
	disableInput?: boolean;
}

/**
 * Interface for managing audio routing between AudioBus instances.
 */
export interface RoutingHandlerInterface {
	/**
	 * Gets the current output destination channel
	 */
	readonly output: AudioBus | undefined;
	/**
	 * Returns the mute value interpolated with the output channel value and this one
	 */
	readonly interpolatedMute: boolean;

	/**
	 * Returns the volume value interpolated with the output channel value and this one
	 */
	readonly interpolatedVolume: number;

	/**
	 * Returns the pan value interpolated with the output channel value and this one
	 */
	readonly interpolatedPan: number;

	/**
	 * Indicates if the output connection is disabled
	 */
	readonly disableOutput: boolean;

	/**
	 * Indicates if the input connection is disabled
	 */
	readonly disableInput: boolean;

	/**
	 * Gets an input channel by name
	 * @param name The name of the input channel
	 */
	getInput(name: string): AudioBus | undefined;

	/**
	 * Checks if this handler has an output connection
	 */
	isOutputConnected(): boolean;

	/**
	 * Checks if an input with the given name is connected
	 * @param name The name of the input to check
	 */
	isInputConnected(name: string): boolean;

	/**
	 * Connects this channel's output to a destination channel
	 * @param destination The channel to connect to
	 */
	connectOutput(destination: AudioBus): AudioBus | undefined;

	/**
	 * Disconnects the current output channel
	 */
	disconnectOutput(): boolean;

	/**
	 * Connects an input source to this channel
	 * @param source The source channel to connect
	 */
	connectInput(source: AudioBus): boolean;

	/**
	 * Disconnects an input source or all inputs if no source is specified
	 * @param source Optional source to disconnect
	 */
	disconnectInput(source?: AudioBus): boolean;

	/**
	 * Updates the interpolated values for volume, mute, and pan
	 */
	updateInterpolatedValues(): void;
	/**
	 * It handles all tasks before being destroyed, like disconnecting all connections
	 */
	destroy(): void;
}

/**
 * Interface for the audio mixer
 */
export interface IAudioMixer {
	/**
	 * Gets the master bus of the mixer
	 */
	readonly master: AudioBus;

	/**
	 * Creates a new audio bus with the given options
	 * @param options The options for the new audio bus
	 */
	createBus(options: AudioBusOptions): AudioBus;
}
