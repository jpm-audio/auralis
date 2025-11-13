import type { CurveFunction } from "@/components/types";
import type { AudioClip } from "../channels";

export interface TimelineClipDefinition {
    startTime: number;
    timeLength: number;
    audioClip: AudioClip;
}

export enum MarkerType {
    MARK,
    LOOP,
    TRANSITION
}

export interface TickerOptions {
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

export interface MarkerTransitionOptions extends MarkerLoopOptions {
    destination: string;
    fadeOutDuration: number;
    fadeOutCurve?: CurveFunction;
    fadeInOffset?: number;
    fadeInDuration: number;
    fadeInCurve?: CurveFunction;
}