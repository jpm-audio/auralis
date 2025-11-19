import { AudioClip } from "@/components/channels/AudioClip";
import type { CurveFunction } from "@/components/types";

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

export interface MarkerOptions {
    name: string;
}

export interface MarkerLoopOptions extends MarkerOptions {
    timeLength: number;
}

export interface IMarkerTransitionOptions extends MarkerLoopOptions {
    destination: string;
    fadeOutDuration: number;
    fadeOutCurve?: CurveFunction;
    fadeInOffset?: number;
    fadeInDuration: number;
    fadeInCurve?: CurveFunction;
}
