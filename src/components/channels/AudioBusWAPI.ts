export class AudioBus {
    protected _name: string;

    protected _context: AudioContext;
    protected _input: GainNode;
    protected _preFaderEffects: AudioNode[] = [];
    protected _gainNode: GainNode;
    protected _postFaderEffects: AudioNode[] = [];
    protected _panner: StereoPannerNode;

    protected _output: AudioNode;
    protected _parent?: AudioBus;
    protected _children: AudioBus[] = [];

    protected _isMuted = false;
    protected _isSoloed = false;
    protected _volume = 1;
    protected _pan = 0;

    public get children(): AudioBus[] {
        return this._children;
    }

    public get parent(): AudioBus | undefined {
        return this._parent;
    }

    public get name(): string {
        return this._name;
    }

    public get input(): AudioNode {
        return this._input;
    }

    /** Set volume (0.0 - 1.0) */
    public set volume(value: number) {
        this._volume = Math.max(0.0, Math.min(1.0, value));
        this._updateGain();
    }

    /** Set stereo pan (-1 left, 0 center, 1 right) */
    public set pan(value: number) {
        this._pan = Math.max(-1, Math.min( 1, value));
        this._panner.pan.value = value;
    }

    public get volume(): number {
        return this._volume;
    }

    public get pan(): number {
        return this._pan;
    }

    constructor(context: AudioContext, name: string = 'UnnamedBus') {
        this._context = context;
        this._name = name;

        this._input = context.createGain(); // Entry point
        this._gainNode = context.createGain(); // Volume control
        this._panner = context.createStereoPanner(); // Pan control

        // Default connections
        this._input.connect(this._gainNode);
        this._gainNode.connect(this._panner);

        // By default, connect to destination
        this._panner.connect(context.destination);

        this._output = this._panner;
    }

    protected _updateGain(): void {
        this._gainNode.gain.value = this._isMuted ? 0 : this._volume;
        // TODO: En el futuro: gestión global de solo/mute con contexto completo
    }

    /** Connect this bus to another bus */
    public connectTo(bus: AudioBus): void {
        this.disconnect();
        this._panner.disconnect();
        this._panner.connect(bus.input);
        this._parent = bus;
        bus.addChild(this);
    }

    /** Disconnect from current parent or output */
    public disconnect(): void {
        this._panner.disconnect();
        this._output = this._panner;
    }

    /** Add effect node before fader */
    public addPreFaderEffect(node: AudioNode): void {
        this._input.disconnect();
        this._input.connect(node);
        node.connect(this._gainNode);
        this._preFaderEffects.push(node);
    }

    /** Add effect node after fader */
    public addPostFaderEffect(node: AudioNode): void {
        this._gainNode.disconnect();
        this._gainNode.connect(node);
        node.connect(this._panner);
        this._postFaderEffects.push(node);
    }

    public mute(): void {
        this._isMuted = true;
        this._updateGain();
    }

    public unmute(): void {
        this._isMuted = false;
        this._updateGain();
    }

    public solo(): void {
        this._isSoloed = true;
        this._updateGain();
    }

    public unsolo(): void {
        this._isSoloed = false;
        this._updateGain();
    }

    protected addChild(child: AudioBus): void {
        this._children.push(child);
    }

}
