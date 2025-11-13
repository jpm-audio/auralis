import { MarkerType, type MarkerOptions } from "./types";

export class Marker {
    protected _name: string;
    protected _type: MarkerType = MarkerType.MARK;

    public get type(): MarkerType {
        return this._type;
    }

    public get name(): string {
        return this._name;
    }

    constructor(options: MarkerOptions){
        this._name = options.name;
    }
}