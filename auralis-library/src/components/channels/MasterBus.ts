import { AudioBus } from "./AudioBus";
import type { AudioBusOptions } from "./types";

/**
 * Class representing the master bus in the audio engine.
 * This class is used to manage the final output of the audio engine and it is meant to be
 * instanciated only once by the AudioEngine Mixer.
 */
export class MasterBus extends AudioBus {
    /**
	 * Constructor for the MasterBus class, that ensures the bus has no output connections
	 * @param config - The configuration options for the master bus
	 */
    constructor(config: AudioBusOptions) {
        super({ ...config, name: "Master Bus" }, {disableOutput: true, disableInput: false});
    }
}
