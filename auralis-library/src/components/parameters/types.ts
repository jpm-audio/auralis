import type { CurveFunction } from "@/components/types";
import { Parameter } from "./Parameter";

export type ParameterRelationType = (parameter: Parameter) => number;

export enum ParameterType {
	CONTINUOUS = "continuous",
	DISCRETE = "discrete",
}

export enum ParamAutomationEvents {
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

export interface ParameterOptions {
	type: ParameterType;
	name: string;
	range: [number, number];
	value: number;
}

export interface FadeConfig {
	duration: number;
	curve: CurveFunction;
}

export interface ValueModulationInterface {
	modulate(value: number, elapsedTime: number): number;
}

export type TransferFunctionType = (input: number) => number;

export interface ValueRelationInterface {
	name: string;
	input: number;
	readonly output: number;
}

export interface ValueRelationOptions {
	input: Parameter;
	transferFunction: ParameterRelationType;
}

export enum ValueRelationEvents {
	UPDATE = "update",
}

export interface ParamAutomationOptions {
	from: number;
	to: number;
	duration: number;
	curve?: CurveFunction;
}
