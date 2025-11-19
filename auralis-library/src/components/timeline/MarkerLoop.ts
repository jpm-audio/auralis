import { Marker } from "./Marker";
import { eMarkerType, type MarkerLoopOptions } from "./types";

export class MarkerLoop extends Marker {
    protected _timeLength: number;

    public get timeLength(): number {
        return this.timeLength;
    }

    public set timeLength(timeLength: number) {
        this._timeLength = timeLength;
    }

    constructor(options: MarkerLoopOptions) {
        super(options);
        this._type = eMarkerType.LOOP;
        this._timeLength = options.timeLength;
    }
}
