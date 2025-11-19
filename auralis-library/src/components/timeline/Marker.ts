import { eMarkerType, type MarkerOptions } from "./types";

export class Marker {
    protected _name: string;
    protected _type: eMarkerType = eMarkerType.MARK;

    public get type(): eMarkerType {
        return this._type;
    }

    public get name(): string {
        return this._name;
    }

    constructor(options: MarkerOptions){
        this._name = options.name;
    }
}
