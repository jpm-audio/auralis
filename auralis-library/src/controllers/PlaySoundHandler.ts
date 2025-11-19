// Temporarily disabled while testing AudioLoader.
// Remove this wrapper to restore the original implementation.

// import { iAudioEventHandler } from "./types";
// import AudioClip from "audio/components/channels/AudioClip";
//
// export class PlaySoundHandler implements iAudioEventHandler {
//     protected _audioClip: AudioClip;
//
//     constructor(soundId: string) {        
//         this._audioClip = new AudioClip({
//             name: soundId
//         });
//     }
//
//     handle() {
//         this._audioClip.play();
//     }
// }
