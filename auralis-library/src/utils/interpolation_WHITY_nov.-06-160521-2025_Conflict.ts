/**
 * Interpolation class
 * @class Interpolation
 * @description It holds util functions for interpolation between several values types, volume, panning and mute.
 * @example
 * const interpolatedVolume = Interpolation.volume(0.5, 0.8, 1);
 * const interpolatedPan = Interpolation.pan(0.5, -0.5, 0);
 * const interpolatedMute = Interpolation.mute(false, true, false);
 * console.log(interpolatedVolume); // 0.4
 * console.log(interpolatedPan); // 0
 * console.log(interpolatedMute); // true
 */
export class Interpolation {
    /**
	 * Interpolate between several values of volume
	 * @param values - Values to interpolate
	 * @returns Interpolated value
	 */
    public static volume = (...values: number[]) => {
        return values.reduce((acc, value) => {
            return acc * value;
        }, 1);
    };
    /**
	 * Interpolate between several values of panning
	 * @param values - Values to interpolate
	 * @returns Interpolated value
	 */
    public static pan = (...values: number[]) => {
        return values.reduce((acc, value) => {
            return acc + value;
        }, 0);
    };
    /**
	 * Interpolate between several values of mute
	 * @param values - Values to interpolate
	 * @returns Interpolated value
	 */
    public static mute = (...values: boolean[]) => {
        return values.reduce((acc, value) => {
            return acc || value;
        }, false);
    };
}
