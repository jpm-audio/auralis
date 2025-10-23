import { IPlayable } from "../types";

export default class VirtualPlayer implements IPlayable {
    protected _startTime: number = 0;
    protected _pausedTime: number = 0;
    protected _isPaused: boolean = false;
    protected _isPlaying: boolean = false;
    protected _duration: number;
    protected _speed: number = 1.0;
    protected _onComplete: () => void;

    public get isPaused(): boolean {
        return this._isPaused;
    }

    public get duration(): number {
        return this._duration;
    }

    public get speed(): number {
        return this._speed;
    }

    public set speed(speed: number) {
        if (this._isPaused) {
            // Adjust the start time to maintain the correct progress
            const elapsed = this._pausedTime - this._startTime;
            this._startTime = this._pausedTime - (elapsed * this._speed) / speed;
        }
        this._speed = speed;
    }

    public get currentTime(): number {
        return (this._duration / this._speed) * this.progress;
    }

    public get isPlaying(): boolean {
        return !this._isPaused;
    }

    public get progress(): number {
        if (this._isPaused) {
            return (
                (this._pausedTime - this._startTime) / (this._duration / this._speed)
            );
        }
        return (Date.now() - this._startTime) / (this._duration / this._speed);
    }

    constructor(duration: number, onComplete: () => void) {
        this._duration = duration;
        this._onComplete = onComplete;
    }

    public play(): void {
        if (this._isPaused) {
            // Resume from pause
            const pausedDuration = this._pausedTime - this._startTime;
            this._startTime = Date.now() - pausedDuration;
            this._isPaused = false;
            this._update();
        } else {
            // Start new delay
            this._startTime = Date.now();
            this._update();
            this._isPlaying = true;
        }
    }

    public pause(): void {
        if (this._isPlaying && !this._isPaused) {
            this._pausedTime = Date.now();
            this._isPaused = true;
        }
    }

    public stop(): void {
        if(this._isPlaying) {
            this._isPlaying = false;
            this._isPaused = false;
            this._startTime = 0;
            this._pausedTime = 0;
        }
    }

    protected _update(): void {
        if (this._isPaused) return;

        const progress = this.progress;
        if (progress >= 1.0) {
            this.stop();
            this._onComplete();
            return;
        }

        // Schedule next update
        // TODO - Change by a ticker call?
        const remainingTime = this.duration - this.currentTime;
        setTimeout(() => this._update(), Math.min(remainingTime, 16)); // Cap at 60fps
    }
}
