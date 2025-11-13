import EventEmitter from "eventemitter3";
import type { AudioEventHandler, AudioManagerOptions, EventCallback } from "./types";
import { audioEngine } from "@/core/AudioEngine";
import type { AudioGlobalConfig } from "@/core/types";

export class AudioManager {
    protected _initialized: boolean = false;
    protected _dispatcher: EventEmitter;
    // TODO: Fix wrapper API integration
    // protected _wrapper: WrapperAPIModel;
    protected _eventMap: Map<string, EventCallback>;
    constructor(options: AudioManagerOptions) {
        this._dispatcher = options.dispatcher;
        // this._wrapper = game.wrapperAPIModel;
        this._eventMap = new Map<string, EventCallback>();

        // TODO: Fix wrapper API integration
        // this._dispatcher.on(WrapperAPIConstants.events.SOUND_VOLUME_UPDATED, this._onSoundVolumeUpdated.bind(this));
    }

    /**
     *
     * @param event
     */
    protected _onSoundVolumeUpdated(): void {
       
    }

    public initialize(globalConfig?: Partial<AudioGlobalConfig>): void {
        if (this._initialized) {
            throw new Error("AudioManager is already initialized");
        }
        this._initialized = true;

        // Start the audio engine.
        audioEngine.init(globalConfig);
        // Set initial global state
        this._onSoundVolumeUpdated();
    }

    public addEvent(name: string, audioEventHandler: AudioEventHandler): void {
        if (this._eventMap.has(name)) {
            throw new Error(`Event ${name} already exists`);
        }
        const eventCallback = (data: any) => {
            audioEventHandler.handle(name, data);
        };
        this._eventMap.set(name, eventCallback);
        this._dispatcher.on(name, eventCallback);
    }

    public removeEvent(name: string): void {
        if (this._eventMap.has(name)) {
            const eventCallback = this._eventMap.get(name);
            if (eventCallback) {
                this._dispatcher.off(name, eventCallback);
            }
            this._eventMap.delete(name);
        }
    }
}
