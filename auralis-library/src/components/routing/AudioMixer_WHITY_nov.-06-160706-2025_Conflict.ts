import { AudioBus } from "@/components/channels/AudioBus";
import { MasterBus } from "@/components/channels/MasterBus";
import type { AudioBusOptions } from "@/components/channels/types";

/**
 * Class representing an audio mixer that manages audio buses and routing.
 * This class is used to create and manage audio buses, including the master bus.
 */
export class AudioMixer {
    /**
	 * The master bus of the audio mixer.
	 * This bus is used to manage the final output of the audio engine.
	 */
    protected _master: MasterBus;
    /**
	 * The master bus of the audio mixer.
	 * This bus is used to manage the final output of the audio engine.
	 */
    public get master(): MasterBus {
        return this._master;
    }
    /**
	 * Constructor for the AudioMixer class.
	 * This constructor initializes the master bus of the audio mixer.
	 */
    constructor() {
        this._master = new MasterBus({ name: "Master Bus" });
    }
    /**
	 * Creates a new audio bus with the specified options.
	 * @param options - The options for the audio bus.
	 * @returns The created audio bus.
	 */
    public createBus(options: AudioBusOptions): AudioBus {
        const audioBus = new AudioBus(options);
        audioBus.connect(this._master);
        return audioBus;
    }
}
