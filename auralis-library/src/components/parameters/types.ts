import Parameter from "./Parameter";

export type TParameterRelation = (parameter: Parameter) => number;

export enum ParameterType {
	CONTINUOUS = "continuous",
	DISCRETE = "discrete",
}

export enum eParamAutomationEvent {
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

export interface IValueRelation {
	name: string;
	input: number;
	readonly output: number;
}

export interface IValueRelationOptions {
	input: Parameter;
	transferFunction: TParameterRelation;
}

export enum eValueRelationEvent {
	UPDATE = "update",
}

export interface ParamAutomationOptions {
	from: number;
	to: number;
	duration: number;
	curve?: CurveFunction;
}
