import type { MediaInstanceInterface, PlayOptions } from "./types";

export class SoundInstance implements MediaInstanceInterface {
	public id: string;
	public loop: boolean;
	public muted: boolean;
	public paused: boolean;
	public progress: number;
	public speed: number;
	public volume: number;
	private _onComplete?: () => void;
	private _timer?: number;

	constructor(id: string, options: PlayOptions = {}) {
		this.id = id;
		this.loop = !!options.loop;
		this.muted = !!options.muted;
		this.paused = false;
		this.progress = 0;
		this.speed = options.speed ?? 1;
		this.volume = options.volume ?? 1;
		this._onComplete = options.complete;
	}

	private clearTimer(): void {
		if (this._timer != null) {
			clearTimeout(this._timer);
			this._timer = undefined;
		}
	}

	private invokeComplete(): void {
		if (this._onComplete) {
			this._onComplete();
		}
	}

	public stop(): void {
		this.clearTimer();
		this.progress = 0;
		this.paused = false;
		this.invokeComplete();
	}

	public pause(): void {
		this.paused = true;
		this.clearTimer();
	}

	public resume(): void {
		if (!this.paused) return;
		this.paused = false;
		this.scheduleComplete(0);
	}

	public scheduleComplete(durationMs: number): void {
		this.clearTimer();
		if (durationMs <= 0) {
			this.invokeComplete();
			return;
		}
		this._timer = window.setTimeout(() => {
			this.progress = 1;
			this.invokeComplete();
		}, durationMs);
	}

	public destroy(): void {
		this.clearTimer();
		this._onComplete = undefined;
	}
}
