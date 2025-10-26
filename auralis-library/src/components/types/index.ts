export type NumberRange = [number, number];

export type CurveFunction = (t: number) => number;

export interface Playable {
    play(): void;
    pause(): void;
    stop(): void;
    readonly duration: number;
    readonly currentTime: number;
    readonly isPlaying: boolean;
}
