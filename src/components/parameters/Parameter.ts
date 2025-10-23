import EventEmitter from "eventemitter3";
import { TCurveFunction } from "../types";
import { Curve } from "./Curve";
import ParamAutomation from "./ParamAutomation";
import {
    eParamAutomationEvent,
    eParameterEvent,
    eParameterType,
    eValueRelationEvent,
    IParameterOptions,
    IValueRelationOptions,
} from "./types";
import ValueRelation from "./ValueRelation";

/**
 * Parameter class
 * This class represents a parameter that can be automated in an abstract way,
 * so it can be used for discrete and continuous parameters.
 */
export default class Parameter extends EventEmitter {
    protected _valueRelations: Map<string, ValueRelation> = new Map();
    /**
	 * The automation object that handles the parameter changes.
	 * This is used to create smooth transitions between values.
	 */
    protected _automation: ParamAutomation;
    /**
	 * The type of the parameter.
	 *  This can be either continuous or discrete.
	 */
    protected _type: eParameterType;
    /**
	 * The name of the parameter.
	 *  This is used to identify the parameter, so better to be unique.
	 */
    protected _name: string;
    /**
	 * The range of values the parameter can take.
	 * This is a tuple with the minimum and maximum values.
	 */
    protected _range: [number, number];
    /**
	 * Value the parameter is currently set to.
	 */
    protected _value: number;
    /**
	 * The velocity of the parameter change.
	 *  This is used to determine how quickly the parameter is allowed to change.
	 * It is measured in units per second.
	 */
    public velocity: number;
    /**
	 * The current value of the parameter.
	 */
    public get name(): string {
        return this._name;
    }
    /**
	 * The type of the parameter.
	 */
    public get type(): eParameterType {
        return this._type;
    }
    /**
	 * The range of the parameter.
	 * This is a tuple with the minimum and maximum values.
	 */
    public get range(): [number, number] {
        return this._range;
    }
    /**
	 * The current value of the parameter.
	 * This is a number between the minimum and maximum values.
	 */
    public get value(): number {
        return this._value;
    }
    /**
	 * Set the current value of the parameter.
	 * This is a number between the minimum and maximum values.
	 * If the parameter is continuous, it will be a float.
	 * If the parameter is discrete, it will be an integer.
	 */
    public set value(value: number) {
        if (this.velocity > 0) {
            const duration = Math.abs((value - this._value) / this.velocity);
            this._automation.init(
                {
                    from: this._value,
                    to: value,
                    duration,
                    curve: Curve.linear,
                },
                true
            );
        } else {
            this._updateValue(value);
        }
    }
    /**
	 * Constructor for the Parameter class.
	 * @param options The options for the parameter.
	 *  This includes the type, name, range, and initial value.
	 */
    constructor(options: IParameterOptions) {
        super();

        this._type = options.type;
        this._name = options.name;
        this._range = options.range;
        this._value = options.value;
        this.velocity = 0;

        this._automation = new ParamAutomation();
        this._automation.on(
            eParamAutomationEvent.UPDATE,
            this._onAutomationUpdate,
            this
        );
    }
    /**
	 * This function will be called when the automation is updated.
	 * @param automation
	 */
    protected _onAutomationUpdate(automation: ParamAutomation): void {
        this._updateValue(automation.value);
    }
    /**
	 * This function will be called when a value relation is updated.
	 * It will interpolate all value relations outputs into a final value,
	 * that will be set to the parameter, overriding the current value.
	 * @private
	 * @returns {void}
	 */
    protected _onValueRelationUpdate = (): void => {
        // Apply all ValueRelations to the parameter value
        let value = 1;
        for (const valueRelation of this._valueRelations.values()) {
            value *= valueRelation.output;
        }
        this._updateValue(value);
    };

    /**
	 *  Update the value of the parameter.
	 *  It will clamp the value to the range of the parameter.
	 *  If the parameter is discrete, it will round the value to the nearest integer.
	 *  If the value has changed, it will emit an update event.
	 * @param value The value to set the parameter to.
	 */
    protected _updateValue(value: number): void {
        // Round whether the parameter is discrete
        if (this._type === eParameterType.DISCRETE) {
            value = Math.round(value);
        }

        // Clamp the value to the range
        const newValue = Math.max(this._range[0], Math.min(value, this._range[1]));

        // Update and emit the update event if the value has changed
        if (newValue !== this._value) {
            this._value = newValue;
            this.emit(eParameterEvent.UPDATE, this);
        }
    }
    /**
	 * Allows to change the value of the parameter over time.
	 * This is done by using an automation object that will handle the transition.
	 * @param value
	 * @param duration
	 * @param curve
	 * @returns
	 */
    public async valueTo(
        value: number,
        duration: number,
        curve?: TCurveFunction
    ): Promise<Parameter> {
        this._automation.init({
            from: this._value,
            to: value,
            duration,
            curve,
        });
        await this._automation.play();
        return this;
    }
    /**
	 * Adds a value relation to the parameter.
	 * @param options
	 * @returns
	 */
    public addRelation(options: IValueRelationOptions): Parameter {
        const valueRelation = new ValueRelation(options);

        this._valueRelations.set(valueRelation.name, valueRelation);

        valueRelation.on(
            eValueRelationEvent.UPDATE,
            this._onValueRelationUpdate,
            this
        );
        this._onValueRelationUpdate();

        return this;
    }
    /**
	 *  Removes a value relation from the parameter.
	 * @param valueRelation
	 * @returns
	 */
    public removeRelation(valueRelation: ValueRelation): Parameter {
        valueRelation.off(
            eValueRelationEvent.UPDATE,
            this._onValueRelationUpdate,
            this
        );
        this._valueRelations.delete(valueRelation.name);
        return this;
    }
    /**
	 * Removes all value relations from the parameter.
	 * @returns
	 */
    public destroy(): void {
        this._automation.on(
            eParamAutomationEvent.UPDATE,
            this._onAutomationUpdate,
            this
        );
    }
}
