import { Deferred } from "./Deferred";
import generateId from "./generateId";
import Interpolation from "./Interpolation";
import Pitch from "./Pitch";
import { wait } from "./wait";

/**
* @description Utils class
*  This class holds the utils for the audio engine.
*/
export class Utils {
    public static readonly generateId = generateId;
    public static readonly interpolation = Interpolation;
    public static readonly pitch = Pitch;
    public static readonly deferred = Deferred;
    public static readonly wait = wait;
}
