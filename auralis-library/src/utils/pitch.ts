/**
 * Pitch class
 * @class Pitch
 * @description It holds util functions for pitch conversion.
 * @example
 * const speed = Pitch.pitchToSpeed(12);
 * const semitones = Pitch.speedToPitch(2);
 * console.log(speed); // 2
 * console.log(semitones); // 12
 */
export class Pitch {
    /** 
     * @description Convert semitones to speed.
    *  This function will convert the semitones to speed using the formula:
    *  speed = 2^(semitones / 12)
    * @param {number} semitones - The pitch in semitones to convert
    * @returns {number} - The speed of the audio clip
    */
    public static pitchToSpeed(semitones: number): number {
        return Math.pow(2, semitones / 12);
    }
    /**
    * @description Convert speed to semitones.
    *  This function will convert the playback speed to semitones using the formula:
    *  semitones = log2(speed) * 12
    * @param {number} speed - The playback speed of the audio to convert
    * @returns {number} - The pitch in semitones
    */
    public static speedToPitch(speed: number): number {
        return Math.log2(speed) * 12;
    }
}
