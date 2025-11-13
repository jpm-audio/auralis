import { Deferred } from "./deferred";
import { generateId } from "./generateId";
import { Interpolation } from "./interpolation";
import { Pitch } from "./pitch";

/**
 * @description Utils class
 *  This class holds the utils for the audio engine.
 */
export class Utils {
    public static readonly generateId = generateId;
    public static readonly interpolation = Interpolation;
    public static readonly pitch = Pitch;
    public static readonly deferred = Deferred;
}