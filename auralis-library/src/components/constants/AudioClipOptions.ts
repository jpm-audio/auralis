import type { AudioClipOptions } from "@/components/channels";

export const AUDIO_CLIP_OPTIONS_DEFAULT: Partial<AudioClipOptions> = {
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
