import type { AudioEventHandler } from "./types";
import { AudioClip } from "@/components/channels/AudioClip";

export class PlaySoundHandler implements AudioEventHandler {
    protected _audioClip: AudioClip;

    constructor(soundId: string) {        
        this._audioClip = new AudioClip({
            name: soundId
        });
    }

    handle() {
        this._audioClip.play();
    }
}
