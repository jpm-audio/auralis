import { iAudioEventHandler } from "./types";
import AudioClip from "audio/components/channels/AudioClip";

export default class PlaySoundHandler implements iAudioEventHandler {
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
