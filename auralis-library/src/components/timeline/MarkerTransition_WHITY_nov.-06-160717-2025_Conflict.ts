
import { Curve } from "@/components/parameters/Curve";
import type { CurveFunction } from "@/components/types";
import { MarkerLoop } from "./MarkerLoop";
import { MarkerType, type MarkerTransitionOptions } from "./types";

export class MarkerTransition extends MarkerLoop {
    protected _destination: string;

    protected _fadeOutDuration: number;
    protected _fadeOutCurve: CurveFunction;

    protected _fadeInOffset: number;
    protected _fadeInDuration: number;
    protected _fadeInCurve: CurveFunction;

    constructor(options: MarkerTransitionOptions) {
        super(options);
        this._type = MarkerType.TRANSITION;
        this._destination = options.destination;
        this._fadeOutDuration = options.fadeOutDuration;
        this._fadeOutCurve = options.fadeOutCurve || Curve.linear;
        this._fadeInOffset = options.fadeInOffset || 0;
        this._fadeInDuration = options.fadeInDuration;
        this._fadeInCurve = options.fadeInCurve || Curve.linear;
    }

}