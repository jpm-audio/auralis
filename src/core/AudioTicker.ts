/**
 * AudioTicker: Schedules tick events based on tempo (BPM) and subdivisions.
 * Useful for metronome events, parameter automation, and more.
 * 
 * Uses the Web Audio API's AudioContext.currentTime for sample-accurate timing.
 */

import EventEmitter from 'eventemitter3';

/**
 * Signature for tick events.
 */
type TickCallback = (time: number, tickCount: number) => void;

/**
 * AudioTicker emits 'tick' events at calculated intervals.
 */
export class AudioTicker extends EventEmitter {
    private context: AudioContext;
    private tempo: number;                // Beats per minute
    private subdivision: number;          // Number of ticks per beat
    private lookahead: number;            // Scheduler polling interval (ms)
    private scheduleAheadTime: number;    // How far ahead to schedule ticks (s)
    private nextTickTime: number;         // Next tick timestamp (context.currentTime)
    private tickCount: number;            // Count of ticks since start
    private isRunning: boolean;
    private schedulerTimerID: number | null;
    private tickTimerIDs: number[];

    /**
     * @param context     The AudioContext for timing
     * @param tempo       Initial tempo in BPM (default 120)
     * @param subdivision Ticks per beat (default 1)
     * @param lookahead   Scheduler interval in ms (default 25)
     * @param scheduleAheadTime How far ahead to schedule in seconds (default 0.1)
     */
    constructor(
        context: AudioContext,
        tempo = 120,
        subdivision = 1,
        lookahead = 25,
        scheduleAheadTime = 0.1
    ) {
        super();
        this.context = context;
        this.tempo = tempo;
        this.subdivision = subdivision;
        this.lookahead = lookahead;
        this.scheduleAheadTime = scheduleAheadTime;
        this.nextTickTime = 0;
        this.tickCount = 0;
        this.isRunning = false;
        this.schedulerTimerID = null;
        this.tickTimerIDs = [];
    }

    /**
     * Start emitting tick events.
     */
    public start(): void {
        if (this.isRunning) return;
        this.isRunning = true;
        this.nextTickTime = this.context.currentTime;
        this.tickCount = 0;
        this.scheduler();
        this.emit('start');
    }

    /**
   * Stop the ticker and clear all pending timeouts.
   */
    public stop(): void {
        if (!this.isRunning) return;
        this.isRunning = false;

        // Clear scheduler loop
        if (this.schedulerTimerID !== null) {
            clearTimeout(this.schedulerTimerID);
            this.schedulerTimerID = null;
        }

        // Clear all scheduled tick timeouts
        this.tickTimerIDs.forEach((id) => clearTimeout(id));
        this.tickTimerIDs = [];

        this.emit('stop');
    }

    /**
     * Scheduler loop: schedules ticks ahead of time.
     */
    private scheduler = (): void => {
        if (!this.isRunning) return;

        // Schedule all ticks within the lookahead window
        while (this.nextTickTime < this.context.currentTime + this.scheduleAheadTime) {
            this.scheduleTick(this.nextTickTime, this.tickCount);
            this.nextTickTime += (60 / this.tempo) / this.subdivision;
            this.tickCount++;
        }

        // Re-run scheduler after lookahead ms
        this.schedulerTimerID = window.setTimeout(this.scheduler, this.lookahead);
    };

    /**
     * Schedule a tick callback via setTimeout to fire at the exact moment.
     */
    private scheduleTick(time: number, count: number): void {
        const delay = Math.max(0, (time - this.context.currentTime) * 1000);
        const id = window.setTimeout(() => {
            this.emit('tick', time, count);
            // Remove this timer ID from the list
            this.tickTimerIDs = this.tickTimerIDs.filter(tid => tid !== id);
        }, delay);
        this.tickTimerIDs.push(id);
    }


    /**
     * Register a listener for tick events.
     * @param callback Receives (time, tickCount)
     * @param context Optional context for the callback
     * @return AudioTicker instance for chaining
     */
    public add(callback: TickCallback, context?: any): AudioTicker {
        this.on('tick', callback, context);
        return this;
    }

    /**
     * 
     * @param callback Callback to remove
     * @param context Optional context for the callback
     * @returns AudioTicker instance for chaining
     */
    public remove(callback: TickCallback, context?: any): AudioTicker {
        this.off('tick', callback, context);
        return this;
    }

    /**
     * Update tempo (BPM) on-the-fly.
     */
    public setTempo(bpm: number): void {
        this.tempo = bpm;
        this.emit('tempoChange', bpm);
    }

    /**
     * Update subdivision (ticks per beat) on-the-fly.
     */
    public setSubdivision(subdivision: number): void {
        this.subdivision = subdivision;
        this.emit('subdivisionChange', subdivision);
    }
}
