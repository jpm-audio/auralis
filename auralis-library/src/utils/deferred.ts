
enum EDeferredStatus {
    PENDING = "DeferredStatusPending",
    FULFILLED = "DeferredStatusFulfilled",
    REJECTED = "DeferredStatusRejected",
}

/**
 * Deferred is a class that represents a promise that can be resolved or rejected from outside.
 *
 * The Deferred pattern is useful for working with Promises when you need to resolve or reject them from outside their constructor.
 * This Deferred class provides a clean way to create and manage promises when you need to resolve or reject them outside of their initial declaration context.
 */
export class Deferred<T> {
    public static readonly Status = EDeferredStatus;
    protected _promise: Promise<T>;
    protected _status: EDeferredStatus;
    protected _resolve!: (value: T | PromiseLike<T>) => void;
    protected _reject!: (reason?: any) => void;

    /**
     * Returns the promise of the Deferred instance.
     */
    public get promise(): Promise<T> {
        return this._promise;
    }

    /**
     * Returns the status of the promise.
     */
    public get status(): EDeferredStatus {
        return this._status;
    }

    /**
     * Check if the promise is still pending
     */
    public get isPending(): boolean {
        return this.status === EDeferredStatus.PENDING;
    }

    /**
     * Check if the promise has been resolved
     */
    public get isResolved(): boolean {
        return this.status === EDeferredStatus.FULFILLED;
    }

    /**
     * Check if the promise has been rejected
     */
    public get isRejected(): boolean {
        return this.status === EDeferredStatus.REJECTED;
    }

    /**
     * Constructs a new Deferred instance.
     *
     * @param callback An optional callback that will be executed with
     * the resolve and reject functions as arguments. This allows you to use the Deferred as a Promise is used.
     */
    constructor(callback?: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void) {
        this._status = EDeferredStatus.PENDING;
        this._promise = new Promise((resolve?: any, reject?: any) => {
            this._resolve = (resolution) => {
                this._status = EDeferredStatus.FULFILLED;
                resolve(resolution);
            };
            this._reject = (rejection) => {
                this._status = EDeferredStatus.REJECTED;
                reject(rejection);
            };
            if (callback) {
                callback(this._resolve, this._reject);
            }
        });
    }

    /**
     * Resolves the promise with the given value.
     *
     * @param resolution The value to resolve the promise with.
     * @returns
     */
    public resolve(resolution: T): Deferred<T> {
        this._resolve(resolution);
        return this;
    }

    /**
     * Rejects the promise with the given value.
     *
     * @param rejection The value to reject the promise with.
     * @returns
     */
    public reject(rejection?: any): Deferred<T> {
        this._reject(rejection);
        return this;
    }
}
