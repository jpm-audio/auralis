import AudioClip from "../channels/AudioClip";
import { TCurveFunction } from "../types";

export interface ITimelineClipDefinition {
    startTime: number;
    timeLength: number;
    audioClip: AudioClip;
}

export enum eMarkerType {
    MARK,
    LOOP,
    TRANSITION
}

export interface ITickerOptions {
    audioContext: AudioContext;
    autostart?: boolean;
    fps?: number;
}

export interface IMarkerOptions {
    name: string;
}

export interface IMarkerLoopOptions extends IMarkerOptions {
    timeLength: number;
}

export interface IMarkerTransitionOptions extends IMarkerLoopOptions {
    destination: string;
    fadeOutDuration: number;
    fadeOutCurve?: TCurveFunction;
    fadeInOffset?: number;
    fadeInDuration: number;
    fadeInCurve?: TCurveFunction;
}