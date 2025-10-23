export type TNumberRange = [number, number];

export type TCurveFunction = (t: number) => number;

export interface IPlayable {
    play(): void;
    pause(): void;
    stop(): void;
    readonly duration: number;
    readonly currentTime: number;
    readonly isPlaying: boolean;
}
