import type EventEmitter from "eventemitter3";


export type EventCallback = (data: any) => void;

export interface AudioManagerOptions {
    dispatcher: EventEmitter;
}

export interface AudioEventHandler {
    /**
     * Method called as listener for an audio event associated.
     * @param name - The name of the event to handle.
     * @param data - The data associated with the event.
     */
    handle(name: string, data: any): void;
}
