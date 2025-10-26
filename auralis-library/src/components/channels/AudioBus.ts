import EventEmitter from "eventemitter3";
import {
    AudioBusEvents,
    type AudioBusEventInfo,
    type AudioBusOptions
} from "./types";
import { ROUTING_OPTIONS_DEFAULT } from "../constants";
import { Parameter, ParameterEvent, ParameterType } from "../parameters";
import { GLOBAL_CONFIG } from "../../core";
import { RoutingHandler, type RoutingHandlerOptions } from "../routing";

/**
 * Class representing virtually an audio bus in the audio engine.
 * This class manager the volume, panning, and muting of audio clips from calculated values resulted
 * from the "n" number of virtual buses nested along the tree created by output and input connections.
 */
export default class AudioBus extends EventEmitter implements AudioBus {
    /**
	 * Name of the bus
	 */
    protected _name: string;
    /**
	 * Routing handler that manages the connections of the bus
	 */
    protected _routing: RoutingHandler;
    /**
	 * Volume parameter of the bus
	 */
    protected _volume: Parameter;
    /**
	 * Mute state of the bus [false | true]
	 */
    protected _mute: boolean = false;
    /**
	 * Pan parameter of the bus
	 */
    protected _pan: Parameter;
    /**
	 * Get bus name
	 * @returns {string} - The name of the bus
	 */
    public get name(): string {
        return this._name;
    }
    /**
	 * Get bus routing handler
	 * @returns {RoutingHandler} - The routing handler of the bus
	 */
    public get routing(): RoutingHandler {
        return this._routing;
    }
    /**
	 * Set bus mute state [false | true]
	 * @param {boolean} value - The mute state to set
	 */
    public set mute(value: boolean) {
        value = !!value;

        if (value !== this._mute) {
            const previousValue = this._mute;
            this._mute = value;
            this._routing.updateInterpolatedValues();
            this.emit(
                AudioBusEvents.MUTE_CHANGE,
                this._createEventInfo(
                    AudioBusEvents.MUTE_CHANGE,
                    previousValue,
                    value,
                    this._routing.interpolatedMute
                )
            );
        }
    }
    /**
	 * Returns current bus mute state
	 * @returns {boolean} - The current mute state of the bus
	 */
    public get mute(): boolean {
        return this._mute;
    }
    /**
	 * Returns current bus volume parameter
	 * @returns {Parameter} - The volume parameter of the bus
	 */
    public get volume(): Parameter {
        return this._volume;
    }
    /**
	 * Returns current bus panning parameter
	 * @returns {Parameter} - The current panning parameter of the bus.
	 */
    public get pan(): Parameter {
        return this._pan;
    }
    /**
	 * Constructor for the AudioBus class.
	 * @param {AudioBusOptions} options - The options for the audio bus.
	 *  This includes the name, volume, mute state, and pan value.
	 * @param {Partial<RoutingHandlerOptions>} routingOptions - The options for the routing handler.
	 *  This includes the owner of the routing handler.
	 *  The owner is the audio bus that will be used to create the routing handler.
	 */
    constructor(
        options: AudioBusOptions,
        routingOptions?: Partial<RoutingHandlerOptions>
    ) {
        super();

        this._name = options.name;
        this._volume = new Parameter({
            type: ParameterType.CONTINUOUS,
            name: `${this._name}-volume`,
            range: GLOBAL_CONFIG.audioBus.volume.range,
            value: options.volume || GLOBAL_CONFIG.audioBus.volume.value,
        });
        this._mute = !!options.mute;
        this._pan = new Parameter({
            type: ParameterType.CONTINUOUS,
            name: `${this._name}-pan`,
            range: GLOBAL_CONFIG.audioBus.pan.range,
            value: options.pan || GLOBAL_CONFIG.audioBus.pan.value,
        });

        this._routing = new RoutingHandler({
            ...ROUTING_OPTIONS_DEFAULT,
            ...{ owner: this },
            ...routingOptions,
        });

        this._volume.on(
            ParameterEvent.UPDATE,
            this._onVolumeParameterUpdate,
            this
        );
        this._onVolumeParameterUpdate(this._volume);

        this._pan.on(ParameterEvent.UPDATE, this._onPanParameterUpdate, this);
        this._onPanParameterUpdate(this._pan);
    }
    /**
	 * Create event info object
	 * @param {AudioBusEvents} event - The event to create the info for
	 * @param {any} previousValue - The previous value of the parameter
	 * @param {any} value - The current value of the parameter
	 * @param {any} interpolatedValue - The interpolated value of the parameter
	 * @returns {AudioBusEventInfo} - The event info object
	 */
    protected _createEventInfo(
        event: AudioBusEvents,
        previousValue: any,
        value: any,
        interpolatedValue: any
    ): AudioBusEventInfo {
        return {
            target: this,
            event,
            previousValue,
            value,
            interpolatedValue,
        };
    }
    /**
	 * Set the volume of the bus [0,1]
	 * @param {number} value - The volume to set
	 */
    protected _onVolumeParameterUpdate(parameter: Parameter): void {

        const value = parameter.value;
        const previousValue = this._volume.value;

        this._routing.updateInterpolatedValues();

        this.emit(
            AudioBusEvents.VOLUME_CHANGE,
            this._createEventInfo(
                AudioBusEvents.VOLUME_CHANGE,
                previousValue,
                value,
                this._routing.interpolatedVolume
            )
        );
    }
    /**
	 * Set the pan of the bus [-1,1]
	 * @param {number} value - The pan to set
	 */
    protected _onPanParameterUpdate(parameter: Parameter): void {
        const value = parameter.value;
        const previousValue = this._pan.value;

        this._routing.updateInterpolatedValues();

        this.emit(
            AudioBusEvents.PAN_CHANGE,
            this._createEventInfo(
                AudioBusEvents.PAN_CHANGE,
                previousValue,
                value,
                this._routing.interpolatedPan
            )
        );
    }
    /**
	 * Connect the bus to another bus
	 * @param {AudioBus} destination - The bus to connect to
	 * @returns {AudioBus | undefined} - The connected bus or undefined if the connection failed
	 */
    public connect(destination: AudioBus): AudioBus | undefined {
        return this._routing.connectOutput(destination);
    }
    /**
	 * Disconnect the bus from another bus
	 * @returns {boolean} - True if the disconnection was successful, false otherwise
	 */
    public disconnect(): boolean {
        return this._routing.disconnectOutput();
    }
    /**
	 * Disconnect the bus from another bus
	 * @param {AudioBus} destination - The bus to disconnect from
	 * @returns {boolean} - True if the disconnection was successful, false otherwise
	 */
    public createChildBus(options: AudioBusOptions) {
        if (this._routing.disableInput) {
            console.warn(
                `AudioBus::createChildBus - AudioBus ${this._name} cannot create child bus ${options.name} because input is disabled`
            );
            return undefined;
        }

        const audioBus = new AudioBus(options);
        audioBus.connect(this);
        return audioBus;
    }
    /**
	 * It handles the actions before the destruction of the bus.
	 * @param {AudioBus} destination - The bus to disconnect from
	 * @returns {boolean} - True if the disconnection was successful, false otherwise
	 */
    public destroy(): void {
        this._volume.destroy();
        this._pan.destroy();
        this._routing.destroy();

        this._volume.off(
            ParameterEvent.UPDATE,
            this._onVolumeParameterUpdate,
            this
        );
        this._pan.off(ParameterEvent.UPDATE, this._onPanParameterUpdate, this);
    }
}
