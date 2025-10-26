import WrapperAPIModel from "api/WrapperAPIModel";
import { WrapperAPIConstants } from "constants/WrapperAPIConstants";
import EventEmitter from "eventemitter3";
import { IAudioManagerOptions, iAudioEventHandler, TEventCallback } from "./types";
import audioEngine from "audio/core/AudioEngine";
import { AudioGlobalConfig } from "audio/core/types";

export default class AudioManager {
    protected _initialized: boolean = false;
    protected _dispatcher: EventEmitter;
    protected _wrapper: WrapperAPIModel;
    protected _eventMap: Map<string, TEventCallback>;
    constructor({ game }: IAudioManagerOptions) {
        this._dispatcher = game.dispatcher;
        this._wrapper = game.wrapperAPIModel;
        this._eventMap = new Map<string, TEventCallback>();

        this._dispatcher.on(WrapperAPIConstants.events.SOUND_VOLUME_UPDATED, this._onSoundVolumeUpdated.bind(this));
    }

    /**
     *
     * @param event
     */
    protected _onSoundVolumeUpdated(): void {
        if (!this._wrapper.api) {
            return;
        }

        // Update MUTE state if needed.
        if (this._wrapper.api.soundEnabled && audioEngine.mute) {
            audioEngine.mute = false;
        } else if (!this._wrapper.api.soundEnabled && !audioEngine.mute) {
            audioEngine.mute = true;
        }

        // Update volume if needed.
        if (this._wrapper.api.soundVolume !== audioEngine.volume) {
            audioEngine.volume = this._wrapper.api.soundVolume;
        }
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

    public addEvent(name: string, audioEventHandler: iAudioEventHandler): void {
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
