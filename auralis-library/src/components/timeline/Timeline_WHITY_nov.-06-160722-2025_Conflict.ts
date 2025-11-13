import { generateId } from "@/utils/generateId";
import { AudioBus } from "@/components/channels/AudioBus";
import { AudioClip } from "@/components/channels/AudioClip";
import type { AudioClipOptions } from "@/components/channels/types";
import { Marker } from "./Marker";
import { MarkerLoop } from "./MarkerLoop";
import { MarkerTransition } from "./MarkerTransition";
import { MarkerType, type MarkerLoopOptions, type MarkerOptions, type MarkerTransitionOptions, type TimelineClipDefinition } from "./types";

export class Timeline extends AudioBus {
    protected _audioClips: Map<string, TimelineClipDefinition> = new Map();
    protected _markers: Map<string, { marker: Marker, startTime: number }> = new Map();

    protected _currentTime: number = 0;
    protected _isPlaying: boolean = false;
    protected _pitch: number = 0;

    public get currentTime(): number {
        return this._currentTime;
    }

    /**
     * Add an audio clip to the timeline to a specific point in time.
     * @param audioClipOptions Options to create a new audio clip
     * @param startTime The time position to place the clip
     * @param timeLength Optional specific duration for the clip
     */
    addAudioClip(audioClipOptions: AudioClipOptions, startTime: number, timeLength?: number): Timeline;
    /**
     * Add an audio clip to the timeline to a specific point in time.
     * The time the audio clip will be played is the audio clip duration by default, 
     * but it can be changed by the timeLength parameter, so could be shorter or longer.
     * 
     * @param audioClip 
     * @param startTime 
     * @param timeLength 
     */
    addAudioClip(audioClip: AudioClip, startTime: number, timeLength?: number): Timeline;


    addAudioClip(clipOrOptions: AudioClip | AudioClipOptions, startTime: number, timeLength?: number): Timeline {
        const id = `ac-${generateId()}}`;

        const audioClip = clipOrOptions instanceof AudioClip ? clipOrOptions : new AudioClip(clipOrOptions);
        
        timeLength = timeLength || audioClip.duration;

        audioClip.connect(this);
        this._audioClips.set(id, { audioClip, startTime, timeLength });

        return this;
    }

    removeAudioClip(audioClip: AudioClip): boolean {
        for (const [id, entry] of this._audioClips.entries()) {
            if (entry.audioClip === audioClip) {
                this._audioClips.delete(id);
                return true;
            }
        };
        return false;
    }

    addLoopMarker(markerOptions: MarkerLoopOptions, startTime:number): Marker {
        return this._createMarker(MarkerType.LOOP, markerOptions, startTime);
    }

    addTransitionMarker(markerOptions: MarkerTransitionOptions, startTime:number): Marker {
        return this._createMarker(MarkerType.TRANSITION, markerOptions, startTime);
    }

    addDestinationMarker(markerOptions: MarkerOptions, startTime:number): Marker {
        return this._createMarker(MarkerType.MARK, markerOptions, startTime);
    }

    removeMarker(marker:Marker): boolean {
        for (const [id, entry] of this._markers.entries()) {
            if (entry.marker === marker) {
                this._markers.delete(id);
                return true;
            }
        };
        return false;
    }

    removeMarkers(): void {
        this._markers.clear();
    }

    protected _createMarker(type:MarkerType, markerOptions: MarkerOptions | MarkerTransitionOptions, startTime:number): Marker {
        const id = `${type}-${generateId()}}`;
        let marker: Marker;

        switch (type) {
        case MarkerType.LOOP:
            marker = new MarkerLoop(markerOptions as MarkerLoopOptions);
        case MarkerType.TRANSITION:
            marker = new MarkerTransition(markerOptions as MarkerTransitionOptions);
        default:
            marker = new Marker(markerOptions);
        }

        this._markers.set(id, { marker, startTime });
        return marker;
    }


}