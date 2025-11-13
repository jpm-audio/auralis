export type AudioCodec = 'wav' | 'ogg' | 'aac' | 'opus' | 'mp3' | 'unknown';

export type OperationMode = 'encode' | 'sprites' | 'bank';

export interface CLIArgs {
    mode: OperationMode;
    inputDir: string;
    outputDir: string;
    format: string;
    quality: string;
    bankId?: string;
    outFile?: string;
}

export interface AudioSprite {
    src: string[];
    sprite: { [key: string]: [number, number] };
}

export interface InputAsset {
    id: string; // logical name (e.g., "ui_click")
    file: string; // path
    codec: AudioCodec;
    data: Buffer; // file bytes
}