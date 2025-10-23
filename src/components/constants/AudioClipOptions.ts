import { IAudioClipOptions } from "../channels/types";

export const AUDIO_CLIP_OPTIONS_DEFAULT: Partial<IAudioClipOptions> = {
    repeat: 0,
    loop: false,
    condition: () => true,
    delay: 0,
    volume: 1.0,
    mute: false,
    pan: 0,
    pitch: 0,
    offset: 0,
};
