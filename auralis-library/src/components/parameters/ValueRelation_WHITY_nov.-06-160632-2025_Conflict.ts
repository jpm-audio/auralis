import EventEmitter from "eventemitter3";
import {
    ParameterEvent,
    ValueRelationEvent,
    type ParameterRelation,
    type ValueRelationOptions,
} from "./types";
import { Parameter } from "./Parameter";

/**
 * ValueRelation class
 * This class represents a relation between two parameters.
 * It takes the value of the input parameter and applies a transfer function to it,
 * producing an output value.
 */
export class ValueRelation
    extends EventEmitter
    implements ValueRelation
{
    /**
     * The name of the value relation.
     */
    public name: string = "";
    /**
	 * The input parameter that is used to calculate the output value.
	 */
    protected _inputParameter: Parameter;
    /**
	 * The transfer function that is applied to the input parameter value.
	 * This function takes the input parameter and returns a number.
	 */
    protected _transferFunction: ParameterRelation;
    /**
	 * The output value that is calculated from the input parameter.
	 */
    protected _output: number = 0;
    /**
	 * The input parameter that is used to calculate the output value.
	 */
    public get input(): number {
        return this._inputParameter.value;
    }
    /**
	 * The output value that is calculated from the input parameter.
	 */
    public get output(): number {
        return this._output;
    }
    /**
	 * The transfer function that is applied to the input parameter value.
	 * This function takes the input parameter and returns a number.
	 */
    public set transferFunction(value: ParameterRelation) {
        this._transferFunction = value;
        this._onUpdate();
    }
    /**
	 *  The constructor for the ValueRelation class.
	 * @param options - The options for the ValueRelation class.
	 */
    constructor(options: ValueRelationOptions) {
        super();

        this.name = options.input.name;
        this._inputParameter = options.input;
        this._transferFunction = options.transferFunction;

        this._inputParameter.on(ParameterEvent.UPDATE, this._onUpdate, this);
        this._onUpdate();
    }
    /**
     * The function that is called when the input parameter is updated.
     * This function calculates the output value from the input parameter
     * and emits an update event.
     */
    protected _onUpdate = (): void => {
        this._output = this._transferFunction(this._inputParameter);
        this.emit(ValueRelationEvent.UPDATE, this);
    };
    /**
     * The function that is called when the input parameter is destroyed.
     * This function removes the event listener from the input parameter.
     */
    public destroy(): void {
        this._inputParameter.off(ParameterEvent.UPDATE, this._onUpdate, this);
    }
}
