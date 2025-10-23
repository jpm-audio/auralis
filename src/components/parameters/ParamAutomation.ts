import EventEmitter from "eventemitter3";
import audioEngine from "../../core/AudioEngine";
import { IPlayable, TCurveFunction } from "../types";
import { Curve } from "./Curve";
import { eParamAutomationEvent, ParamAutomationOptions } from "./types";
import { Deferred } from "../../utils/deferred";
import Ticker from "../timeline/Ticker";

/**
 * ParamAutomation class for automating parameter changes over time.
 * It allows you to define a range of values, a duration for the automation,
 * and a curve function to control the interpolation between the values.
 */
export default class ParamAutomation extends EventEmitter implements IPlayable {
    /**
	 * Reference to the Curve class for curve functions.
	 * @type {typeof Curve}
	 * @static
	 */
    public static Curves = Curve;
    /**
	 * current elapsed time of the automation.
	 * @type {number}
	 * @protected
	 * @default 0
	 */
    protected _elapsed: number = 0;
    /**
	 * Indicates whether the automation is currently paused.
	 * @type {boolean}
	 * @protected
	 * @default false
	 */
    protected _isPaused: boolean = false;
    /**
	 * The current value of the parameter being automated.
	 * @type {number}
	 * @protected
	 * @default 0
	 */
    protected _value: number = 0;
    /**
	 * The deferred object used for handling playback promises.
	 * It is also used to check whether the automation is playing or not.
	 * @type {Deferred<ParamAutomation> | undefined}
	 * @protected
	 * @default undefined
	 */
    protected _playbackDeferred: Deferred<ParamAutomation> | undefined;
    /**
	 * The starting value of the automation.
	 * @type {number}
	 * @default 0
	 */
    public from: number = 0;
    /**
	 * The ending value of the automation.
	 * @type {number}
	 * @default 0
	 */
    public to: number = 0;
    /**
	 * The duration of the automation in milliseconds.
	 * @type {number}
	 * @default 0
	 */
    public duration: number = 0;
    /**
	 * The curve function used for interpolation between the start and end values.
	 * @type {TCurveFunction}
	 * @default Curve.linear
	 */
    public curve: TCurveFunction = Curve.linear;
    /**
	 * Flag to indicate whether the automation is currently playing.
	 * @type {boolean}
	 * @default false
	 */
    public get isPlaying(): boolean {
        return this._playbackDeferred !== undefined;
    }
    /**
	 * Flag to indicate whether the automation is currently paused.
	 * @type {boolean}
	 * @default false
	 */
    public get isPaused(): boolean {
        return this._isPaused;
    }
    /**
	 * The current time of the automation in milliseconds.
	 * @type {number}
	 * @default 0
	 * @readonly
	 */
    public get currentTime(): number {
        return this._elapsed;
    }
    /**
	 * Current progression of the automation as a value between 0 and 1.
	 * @type {number}
	 * @default 0
	 * @readonly
	 */
    public get progress(): number {
        return this.duration > 0 ? this._elapsed / this.duration : 0;
    }
    /**
	 * The current value of the parameter being automated.
	 * @type {number}
	 * @default 0
	 * @readonly
	 */
    public get value(): number {
        return this._value;
    }
    /**
	 *  Constructor for the ParamAutomation class.
	 *  It initializes the automation with the provided options if any.
	 * @param options - Options for the ParamAutomation instance.
	 */
    constructor(options?: ParamAutomationOptions) {
        super();
        if (options) {
            this.init(options, false);
        }
    }
    /**
	 * Checks if the automation is ready to play.
	 * It verifies if the automation is not already playing, has a valid duration,
	 * has a variation between the start and end values, and if the current value
	 * is not already at the destination.
	 * @returns {boolean} - Returns true if the automation is ready to play, false otherwise.
	 * @protected
	 */
    protected _isPlayReady(): boolean {
        // Check if the automation is in a state ready to play
        const isStateReady = !this.isPlaying || this._isPaused;

        // Ensure there is a variation between the start and end values
        const hasValueVariation = this.from !== this.to;

        // Check if the current value is not already at the destination
        const targetValue = this.to;
        const isValueNotAtDestination = targetValue !== this._value;

        return isStateReady && hasValueVariation && isValueNotAtDestination;
    }

    /**
	 *  Updates the automation state based on the elapsed time.
	 * @param ticker - The Ticker instance used for timing.
	 * @returns
	 */
    protected _update(ticker: Ticker): void {
        let isComplete = false;
        this._elapsed += ticker.deltaSeconds;

        if (this._elapsed >= this.duration) {
            this._elapsed = this.duration;
            isComplete = true;
        }

        const t = Math.min(this._elapsed / this.duration, 1);
        const value = this.from + (this.to - this.from) * this.curve(t);

        this._updateValue(value);

        if (isComplete) {
            this.stop();
            this.emit(eParamAutomationEvent.COMPLETE, this);
            return;
        }
    }
    /**
	 *  Updates the value of the parameter being automated.
	 * It emits an event to notify that the value has been updated.
	 * @param value - The new value to set.
	 * @protected
	 */
    protected _updateValue(value: number): void {
        if (this._value !== value) {
            this._value = value;
            this.emit(eParamAutomationEvent.UPDATE, this);
        }
    }
    /**
	 * Initializes the ParamAutomation instance with the provided options.
	 * It will automatically start playing if autoplay is set to true.
	 * @param options - Options for the ParamAutomation instance.
	 * @param autoplay - Flag to indicate whether to start playing immediately.
	 * @returns {ParamAutomation} - The ParamAutomation instance.
	 */
    public init(
        options: ParamAutomationOptions,
        autoplay: boolean = false
    ): ParamAutomation {
        this.from = options.from;
        this.to = options.to;
        this.duration = options.duration;
        this.curve = options.curve || Curve.linear;

        this.reset();

        if (autoplay) {
            this.play();
        }

        return this;
    }
    /**
	 * Starts the automation playback.
	 * If the automation is already playing but paused, it will resume from the paused state.
	 * @returns {Promise<ParamAutomation>} - A promise that resolves returning a ParamAutomation instance when the automation is complete.
	 */
    public async play(): Promise<ParamAutomation> {
        // Check if the automation is ready to play
        if (!this._isPlayReady()) {
            return this;
        }

        // If the duration is less than the ticker delta time, we can immediately set the value and resolve
        if (this.duration <= audioEngine.ticker.targetDeltaSeconds) {
            this._updateValue(this.to);
            return this;
        }

        // If the automation is paused, we resume it, otherwise we start a new playback
        if (this._isPaused) {
            this._isPaused = false;
            this.emit(eParamAutomationEvent.RESUME);
        } else {
            this._playbackDeferred = new Deferred<ParamAutomation>();
            this._elapsed = 0;
            this.emit(eParamAutomationEvent.PLAY, this);
        }

        audioEngine.ticker.add(this._update, this);
        return (this._playbackDeferred as Deferred<ParamAutomation>).promise;
    }
    /**
	 * Pauses the automation playback.
	 * If the automation is already paused or not playing, it will not do anything.
	 * @returns {ParamAutomation} - The ParamAutomation instance.
	 */
    public pause(): ParamAutomation {
        if (this.isPlaying && !this._isPaused) {
            this._isPaused = true;

            audioEngine.ticker.remove(this._update, this);

            this.emit(eParamAutomationEvent.PAUSE, this);
        }

        return this;
    }
    /**
	 * It stops a playing automation.
	 * If the automation is not playing, it will not do anything.
	 * @returns {ParamAutomation} - The ParamAutomation instance.
	 */
    public stop(): ParamAutomation {
        if (this.isPlaying) {
            this._isPaused = false;
            this._elapsed = 0;
            this._playbackDeferred?.resolve(this);
            this._playbackDeferred = undefined;

            audioEngine.ticker.remove(this._update, this);

            this.emit(eParamAutomationEvent.STOP, this);
        }

        return this;
    }
    /**
	 * Resets the automation to its initial state.
	 * It sets the elapsed time to 0 and the current value to the starting value.
	 * This method does not stop the automation.
	 * @returns {ParamAutomation} - The ParamAutomation instance.
	 */
    public reset(): ParamAutomation {
        this._elapsed = 0;
        this._updateValue(this.from);

        return this;
    }
}
