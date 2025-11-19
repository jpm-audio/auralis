/**
 * AudioTicker: Schedules tick events based on tempo (BPM) and subdivisions.
 * Useful for metronome events, parameter automation, and more.
 *
 * Uses the Web Audio API's AudioContext.currentTime for sample-accurate timing.
 */
import EventEmitter from 'eventemitter3';
import type { AudioTickerOptions, AudioTickerTickCallback } from './types';

/**
 * AudioTicker emits 'tick' events at calculated intervals.
 */
export class AudioTicker extends EventEmitter {
    private _audioContext: AudioContext;
    private _tempo: number; // Beats per minute
    private _subdivision: number; // Number of ticks per beat
    private _lookahead: number; // Scheduler polling interval (ms)
    private _scheduleAheadTime: number; // How far ahead to schedule ticks (s)
    private _nextTickTime: number; // Next tick timestamp (audioContext.currentTime)
    private _tickCount: number; // Count of ticks since start
    private _isRunning: boolean;
    private _schedulerTimerID: number | null;
    private _tickTimerIDs: Set<number>; // Use Set for better performance
    private _startTime: number; // Start time for elapsed time calculations

    /**
     * Get current tempo.
     */
    public get tempo(): number {
        return this._tempo;
    }

    public set tempo(value: number) {
        this._tempo = Math.max(1, value);
        this.emit('tempoChange', value);
    }

    /**
     * Get current subdivision.
     */
    public get subdivision(): number {
        return this._subdivision;
    }

    public set subdivision(value: number) {
        this._subdivision = Math.max(1, value);
        this.emit('subdivisionChange', value);
    }

    /**
     * Get elapsed time since start in seconds.
     */
    public get elapsedFromStart(): number {
        if (!this._isRunning) return 0;
        return this._audioContext.currentTime - this._startTime;
    }

    /**
     * Get the time interval between ticks in seconds.
     */
    public get elapsedSeconds(): number {
        return 60 / this._tempo / this._subdivision;
    }

    /**
     * Get the time interval between ticks in milliseconds.
     */
    public get elapsedMs(): number {
        return this.elapsedSeconds * 1000;
    }

    /**
     * Get running state.
     */
    public get isRunning(): boolean {
        return this._isRunning;
    }

    /**
     * @param audioContext     The AudioContext for timing
     * @param tempo       Initial tempo in BPM (default 120)
     * @param subdivision Ticks per beat (default 1)
     * @param lookahead   Scheduler interval in ms (default 25)
     * @param scheduleAheadTime How far ahead to schedule in seconds (default 0.1)
     */
    constructor({
        audioContext,
        tempo = 120,
        subdivision = 1,
        lookahead = 25,
        scheduleAheadTime = 0.1,
    }: AudioTickerOptions) {
        super();

        this._audioContext = audioContext;
        this._tempo = tempo;
        this._subdivision = subdivision;
        this._lookahead = lookahead;
        this._scheduleAheadTime = scheduleAheadTime;
        this._nextTickTime = 0;
        this._tickCount = 0;
        this._isRunning = false;
        this._schedulerTimerID = null;
        this._tickTimerIDs = new Set<number>();
        this._startTime = 0;
    }

    /**
     * Start emitting tick events.
     */
    public start(): void {
        if (this._isRunning) return;
        this._isRunning = true;
        this._nextTickTime = this._audioContext.currentTime;
        this._startTime = this._audioContext.currentTime;
        this._tickCount = 0;
        this._scheduler();
        this.emit('start');
    }

    /**
     * Stop the ticker and clear all pending timeouts.
     */
    public stop(): void {
        if (!this._isRunning) return;
        this._isRunning = false;

        // Clear scheduler loop
        if (this._schedulerTimerID !== null) {
            clearTimeout(this._schedulerTimerID);
            this._schedulerTimerID = null;
        }

        // Clear all scheduled tick timeouts
        this._tickTimerIDs.forEach((id) => clearTimeout(id));
        this._tickTimerIDs.clear();

        this.emit('stop');
    }

    /**
     * Scheduler loop: schedules ticks ahead of time.
     */
    private _scheduler = (): void => {
        if (!this._isRunning) return;

        // Schedule all ticks within the lookahead window
        while (
            this._nextTickTime <
            this._audioContext.currentTime + this._scheduleAheadTime
        ) {
            this._scheduleTick(this._nextTickTime, this._tickCount);
            this._nextTickTime += 60 / this._tempo / this._subdivision;
            this._tickCount++;
        }

        // Re-run scheduler after lookahead ms
        this._schedulerTimerID = window.setTimeout(
            this._scheduler,
            this._lookahead
        );
    };

    /**
     * Schedule a tick callback via setTimeout to fire at the exact moment.
     */
    private _scheduleTick(time: number, count: number): void {
        const delay = Math.max(
            0,
            (time - this._audioContext.currentTime) * 1000
        );
        const id = window.setTimeout(() => {
            this.emit('tick', time, count);
            // Remove this timer ID from the set
            this._tickTimerIDs.delete(id);
        }, delay);
        this._tickTimerIDs.add(id);
    }

    /**
     * Register a listener for tick events.
     * @param callback Receives (time, tickCount)
     * @param audioContext Optional audioContext for the callback
     * @return AudioTicker instance for chaining
     */
    public add(callback: AudioTickerTickCallback, audioContext?: any): AudioTicker {
        this.on('tick', callback, audioContext);
        return this;
    }

    /**
     *
     * @param callback Callback to remove
     * @param audioContext Optional audioContext for the callback
     * @returns AudioTicker instance for chaining
     */
    public remove(callback: AudioTickerTickCallback, audioContext?: any): AudioTicker {
        this.off('tick', callback, audioContext);
        return this;
    }

    /**
     * Reset the ticker to initial state without stopping.
     */
    public reset(): void {
        if (this._isRunning) {
            this.stop();
            this.start();
        } else {
            this._tickCount = 0;
            this._startTime = 0;
        }
    }
}
