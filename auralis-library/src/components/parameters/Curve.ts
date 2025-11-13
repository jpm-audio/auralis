// Temporarily disabled while testing AudioLoader.
// Remove this wrapper to restore the original implementation.

// import type { CurveFunction } from "./types";
//
// /**
//  * Collection of curve functions for audio automation
//  */
// export class Curve {
//     /**
//      * Linear interpolation (no easing)
//      */
//     public static linear: CurveFunction = (t: number): number => {
//         return t;
//     };
//
//     /**
//      * Sinusoidal easing in and out
//      */
//     public static inOutSine: CurveFunction = (t: number): number => {
//         return 0.5 * (1 - Math.cos(Math.PI * t));
//     };
//
//     /**
//      * Sinusoidal easing in
//      */
//     public static inSine: CurveFunction = (t: number): number => {
//         return 1 - Math.cos(t * Math.PI / 2);
//     };
//
//     /**
//      * Sinusoidal easing out
//      */
//     public static outSine: CurveFunction = (t: number): number => {
//         return Math.sin(t * Math.PI / 2);
//     };
//
//     /**
//      * Cubic easing in
//      */
//     public static inCubic: CurveFunction = (t: number): number => {
//         return t * t * t;
//     };
//
//     /**
//      * Cubic easing out
//      */
//     public static outCubic: CurveFunction = (t: number): number => {
//         return --t * t * t + 1;
//     };
//
//     /**
//      * Exponential easing in
//      */
//     public static inExpo: CurveFunction = (t: number): number => {
//         return t === 0 ? 0 : Math.pow(1024, t - 1);
//     };
//
//     /**
//      * Exponential easing out
//      */
//     public static outExpo: CurveFunction = (t: number): number => {
//         return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
//     };
//
//     /**
//      * Quadratic easing in
//      */
//     public static inQuad: CurveFunction = (t: number): number => {
//         return t * t;
//     };
//
//     /**
//      * Quadratic easing out
//      */
//     public static outQuad: CurveFunction = (t: number): number => {
//         return t * (2 - t);
//     };
//
//     /**
//      * Quadratic easing in and out
//      */
//     public static inOutQuad: CurveFunction = (t: number): number => {
//         return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
//     };
//
//     /**
//      * Cubic easing in and out
//      */
//     public static inOutCubic: CurveFunction = (t: number): number => {
//         return t < 0.5
//             ? 4 * t * t * t
//             : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
//     };
//
//     /**
//      * Quartic easing in
//      */
//     public static inQuart: CurveFunction = (t: number): number => {
//         return t * t * t * t;
//     };
//
//     /**
//      * Quartic easing out
//      */
//     public static outQuart: CurveFunction = (t: number): number => {
//         return 1 - (--t) * t * t * t;
//     };
//
//     /**
//      * Quartic easing in and out
//      */
//     public static inOutQuart: CurveFunction = (t: number): number => {
//         return t < 0.5
//             ? 8 * t * t * t * t
//             : 1 - 8 * (--t) * t * t * t;
//     };
//
//     /**
//      * Quintic easing in
//      */
//     public static inQuint: CurveFunction = (t: number): number => {
//         return t * t * t * t * t;
//     };
//
//     /**
//      * Quintic easing out
//      */
//     public static outQuint: CurveFunction = (t: number): number => {
//         return 1 + (--t) * t * t * t * t;
//     };
//
//     /**
//      * Quintic easing in and out
//      */
//     public static inOutQuint: CurveFunction = (t: number): number => {
//         return t < 0.5
//             ? 16 * t * t * t * t * t
//             : 1 + 16 * (--t) * t * t * t * t;
//     };
//
//     /**
//      * Exponential easing in and out
//      */
//     public static inOutExpo: CurveFunction = (t: number): number => {
//         if (t === 0) return 0;
//         if (t === 1) return 1;
//         if (t < 0.5) return 0.5 * Math.pow(2, 20 * t - 10);
//         return 0.5 * (2 - Math.pow(2, -20 * t + 10));
//     };
//
//     /**
//      * Circular easing in
//      */
//     public static inCirc: CurveFunction = (t: number): number => {
//         return 1 - Math.sqrt(1 - t * t);
//     };
//
//     /**
//      * Circular easing out
//      */
//     public static outCirc: CurveFunction = (t: number): number => {
//         return Math.sqrt(1 - (--t) * t);
//     };
//
//     /**
//      * Circular easing in and out
//      */
//     public static inOutCirc: CurveFunction = (t: number): number => {
//         return t < 0.5
//             ? (1 - Math.sqrt(1 - 4 * t * t)) / 2
//             : (Math.sqrt(1 - 4 * (t - 1) * (t - 1)) + 1) / 2;
//     };
// }
