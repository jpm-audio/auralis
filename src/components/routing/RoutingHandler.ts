import Interpolation from "../../utils/interpolation";
import {
    eAudioBusEvents,
    IAudioBus,
    IAudioBusEventInfo,
} from "../channels/types";
import { IRoutingHandler, IRoutingHandlerOptions } from "./types";

/**
 * Class that manages the routing of an audio bus.
 * This class is used to manage the connections between audio buses and
 * to calculate the final volume, panning, and muting of the audio route.
 */
export default class RoutingHandler implements IRoutingHandler {
    /**
	 * The audio bus that owns this routing handler
	 */
    protected _owner: IAudioBus;
    /**
	 * The output channel of this routing handler
	 */
    protected _destination: IAudioBus | undefined;
    /**
	 * The input channels of this routing handler
	 */
    protected _inputs: Map<string, IAudioBus>;
    /**
	 * The volume value interpolated with the output channel value and this one
	 */
    protected _interpolatedVolume: number = 1.0;
    /**
	 * The mute value interpolated with the output channel value and this one
	 */
    protected _interpolatedMute: boolean = false;
    /**
	 * The pan value interpolated with the output channel value and this one
	 */
    protected _interpolatedPan: number = 0.0;
    /**
	 * Indicates if the output connection is disabled
	 */
    protected _disableOutput: boolean = false;
    /**
	 * Indicates if the input connection is disabled
	 */
    protected _disableInput: boolean = false;
    /**
	 * Returns the output channel of this routing handler
	 */
    public get output(): IAudioBus | undefined {
        return this._destination;
    }
    /**
	 * Returns the mute value interpolated with the output channel value and this one.
	 */
    public get interpolatedMute(): boolean {
        return this._interpolatedMute;
    }
    /**
	 * Returns the volume value interpolated with the output channel value and this one.
	 */
    public get interpolatedVolume(): number {
        return this._interpolatedVolume;
    }
    /**
	 * Returns the pan value interpolated with the output channel value and this one.
	 */
    public get interpolatedPan(): number {
        return this._interpolatedPan;
    }
    /**
	 * Indicates if the output connection is disabled
	 */
    public get disableOutput(): boolean {
        return this._disableOutput;
    }
    /**
	 * Indicates if the input connection is disabled
	 */
    public get disableInput(): boolean {
        return this._disableInput;
    }
    /**
	 * Constructor for the RoutingHandler class.
	 * @param options The options for the routing handler
	 */
    constructor(options: IRoutingHandlerOptions) {
        this._owner = options.owner;
        this._inputs = new Map();

        this._interpolatedVolume = options.owner.volume.value;
        this._interpolatedMute = options.owner.mute;
        this._interpolatedPan = options.owner.pan.value;

        this._disableOutput = !!options.disableOutput;
        this._disableInput = !!options.disableInput;
    }
    /**
	 * Add all listeners of output events.
	 * @param audioBus The output channel to add listeners to
	 */
    protected _addOutputListeners() {
        if (!this._destination) return;

        this._destination.on(
            eAudioBusEvents.VOLUME_CHANGE,
            this._onOutputVolumeChange,
            this
        );
        this._destination.on(
            eAudioBusEvents.MUTE_CHANGE,
            this._onOutputMuteChange,
            this
        );
        this._destination.on(
            eAudioBusEvents.PAN_CHANGE,
            this._onOutputPanChange,
            this
        );
    }
    /**
	 * Remove all listeners of output events.
	 * @param audioBus The output channel to remove listeners from
	 */
    protected _removeOutputListeners(): void {
        if (!this._destination) return;

        this._destination.off(
            eAudioBusEvents.VOLUME_CHANGE,
            this._onOutputVolumeChange,
            this
        );
        this._destination.off(
            eAudioBusEvents.MUTE_CHANGE,
            this._onOutputMuteChange,
            this
        );
        this._destination.off(
            eAudioBusEvents.PAN_CHANGE,
            this._onOutputPanChange,
            this
        );
    }
    /**
	 * Listener triggered when the output channel volume changes.
	 * This method will update the interpolated volume value and
	 * will emit the event with the new volume values.
	 *
	 * @param previous
	 */
    protected _onOutputVolumeChange(eventInfo: IAudioBusEventInfo): void {
        // Update interpolated value
        this._interpolatedVolume = Interpolation.volume(
			eventInfo.interpolatedValue as number,
			this._owner.volume.value
        );

        // Populate the AudioBus Event
        const info: IAudioBusEventInfo = {
            ...eventInfo,
            interpolatedValue: this._interpolatedVolume,
        };
        this._owner.emit(eAudioBusEvents.VOLUME_CHANGE, info);
    }
    /**
	 * Listener triggered when the output channel mute state changes.
	 * This method will update the interpolated mute value and
	 * will emit the event with the new mute values.
	 *
	 * @param previous
	 */
    protected _onOutputMuteChange(eventInfo: IAudioBusEventInfo): void {
        // Update interpolated value
        this._interpolatedMute = Interpolation.mute(
			eventInfo.interpolatedValue as boolean,
			this._owner.mute
        );

        // Populate the AudioBus Event
        const info: IAudioBusEventInfo = {
            ...eventInfo,
            interpolatedValue: this._interpolatedMute,
        };

        this._owner.emit(eAudioBusEvents.MUTE_CHANGE, info);
    }
    /**
	 * Listener triggered when the output channel pan value changes.
	 * This method will update the interpolated pan value and
	 * will emit the event with the new pan values.
	 *
	 * @param previous
	 */
    protected _onOutputPanChange(eventInfo: IAudioBusEventInfo): void {
        // Update interpolated value
        this._interpolatedPan = Interpolation.pan(
			eventInfo.interpolatedValue as number,
			this._owner.pan.value
        );

        // Populate the AudioBus Event
        const info: IAudioBusEventInfo = {
            ...eventInfo,
            interpolatedValue: this._interpolatedPan,
        };

        this._owner.emit(eAudioBusEvents.PAN_CHANGE, info);
    }
    /**
	 * Get an input channel by name
	 * @param name The name of the input channel
	 */
    public getInput(name: string): IAudioBus | undefined {
        return this._inputs.get(name);
    }
    /**
	 * Check if this handler has an output connection
	 */
    public isOutputConnected(): boolean {
        return this._destination !== undefined;
    }
    /**
	 * Check if an input with the given name is connected
	 * @param name The name of the input to check
	 */
    public isInputConnected(name: string): boolean {
        return this._inputs.has(name);
    }
    /**
	 * Connect the output of this channel to another channel.
	 * @param destination The channel to connect to
	 * @returns The connected channel or undefined if the connection failed
	 */
    public connectOutput(destination: IAudioBus): IAudioBus | undefined {
        if (this._disableOutput) {
            console.warn(
                `RoutingHandler::connectOutput - AudioBus ${this._owner.name} cannot connect to ${destination.name} because output is disabled`
            );
            return;
        }

        if (destination.routing.connectInput(this._owner)) {
            // Disconnect previous output
            this.disconnectOutput();

            // Connect new output
            this._destination = destination;
            this.updateInterpolatedValues();
            this._addOutputListeners();

            return destination;
        }
    }
    /**
	 * Disconnect the current output channel.
	 * @returns True if the disconnection was successful, false otherwise
	 */
    public disconnectOutput(): boolean {
        if (this._destination) {
            const source = this._destination;

            this._removeOutputListeners();
            this._destination = undefined;
            this.updateInterpolatedValues();

            // Notify output to disconnect this channel from its inputs
            source.routing.disconnectInput(this._owner as IAudioBus);

            return true;
        }

        return false;
    }
    /**
	 * Connect an input source to this channel.
	 * @param source The source channel to connect
	 * @returns True if the connection was successful, false otherwise
	 */
    public connectInput(source: IAudioBus): boolean {
        if (this._disableInput) {
            console.warn(
                `RoutingHandler::connectInput - AudioBus ${this._owner.name} cannot connect to ${source.name} because input is disabled`
            );
            return false;
        }

        // Check if the source is already connected
        if (!this._inputs.has(source.name)) {
            this._inputs.set(source.name, source);
            return true;
        }

        console.warn(
            `RoutingHandler::connectInput - AudioBus ${source.name} already connected to ${this._owner.name}`
        );
        return false;
    }
    /**
	 * Disconnect input connection from an AudioBus or all of them whether no source is given.
	 *
	 * @param audioBus Bus to disconnect from inputs
	 * @returns The name of the disconnectd channel or undefined if not found
	 */
    public disconnectInput(source?: IAudioBus): boolean {
        // Remove All
        if (source === undefined) {
            if (this._inputs.size > 0) {
                this._inputs.forEach((input) => {
                    this.disconnectInput(input as IAudioBus);
                });
                return true;
            }
            return false;
        }

        // Remove a specific one
        if (this._inputs.has(source.name)) {
            this._inputs.delete(source.name);
            return true;
        }

        return false;
    }
    /**
	 * Update the interpolated values of the routing handler.
	 * This method will update the interpolated volume, mute, and pan values
	 * based on the current state of the routing handler and its destination.
	 */
    public updateInterpolatedValues(): void {
        if(this._destination) {
            this._interpolatedVolume = Interpolation.volume(
                this._destination.routing.interpolatedVolume,
                this._owner.volume.value
            );
            this._interpolatedMute = Interpolation.mute(
                this._destination.routing.interpolatedMute,
                this._owner.mute
            );
            this._interpolatedPan = Interpolation.pan(
                this._destination.routing.interpolatedPan,
                this._owner.pan.value
            );
        }else{
            this._interpolatedVolume = this._owner.volume.value;
            this._interpolatedMute = this._owner.mute;
            this._interpolatedPan = this._owner.pan.value;
        }
    }
    /**
	 * It handles the actions before the destruction of the bus.
	 * @returns {void}
	 */
    public destroy(): void {
        this.disconnectOutput();
        this.disconnectInput();
    }
}
