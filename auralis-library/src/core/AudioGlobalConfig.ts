import { AudioMultipleClipMode, Curve } from "@/components";
import type { AudioGlobalConfig } from "./types";

export const GLOBAL_CONFIG: AudioGlobalConfig = {
    ticker: {
        autostart: true,
        fps: 60,
    },
    fadeIn: {
        from: 0,
        to: 1,
        duration: 0,
        curve: Curve.linear,
    },
    fadeOut: {
        from: 1,
        to: 0,
        duration: 0,
        curve: Curve.linear,
    },
    audioBus: {
        volume: {
            value: 1,
            range: [0, 1],
        },
        pan: {
            value: 0,
            range: [-1, 1],
        },
    },
    audioClip: {
        pitch: {
            value: 0,
            range: [-24, 24],
        },
        offset: {
            value: 0,
            range: [-Infinity, Infinity],
        },
        multipleClipMode: AudioMultipleClipMode.SEQUENTIAL
    },
};
