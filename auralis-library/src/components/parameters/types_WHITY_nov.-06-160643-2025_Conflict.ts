import type { CurveFunction } from "../types";
import { Parameter } from "./Parameter";

export type ParameterRelation = (parameter: Parameter) => number;

export enum ParameterType {
	CONTINUOUS = "continuous",
	DISCRETE = "discrete",
}

export enum ParamAutomationEvent {
	PLAY = "play",
	PAUSE = "pause",
	RESUME = "resume",
	STOP = "stop",
	COMPLETE = "complete",
	UPDATE = "update",
}

export enum ParameterEvent {
	UPDATE = "update",
}

export interface IParameterOptions {
	type: ParameterType;
	name: string;
	range: [number, number];
	value: number;
}

export interface IFadeConfig {
	duration: number;
	curve: CurveFunction;
}

export interface IValueModulation {
	modulate(value: number, elapsedTime: number): number;
}

export type TTransferFunction = (input: number) => number;

export interface ValueRelation {
	name: string;
	input: number;
	readonly output: number;
}

export interface ValueRelationOptions {
	input: Parameter;
	transferFunction: ParameterRelation;
}

export enum ValueRelationEvent {
	UPDATE = "update",
}

export interface ParamAutomationOptions {
	from: number;
	to: number;
	duration: number;
	curve?: CurveFunction;
}
