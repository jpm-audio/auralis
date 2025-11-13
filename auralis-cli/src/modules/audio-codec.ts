import { existsSync, readdirSync, statSync } from "node:fs";
import { AudioCodec } from "../types/packTypes";
import * as path from 'node:path';
const ffmpeg = require('fluent-ffmpeg');

function inferAudioCodecFromExtension(path: string): AudioCodec {
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'wav':
            return 'wav';
        case 'ogg':
            return 'ogg';
        case 'aac':
        case 'm4a':
        case 'mp4':
            return 'aac';
        case 'opus':
            return 'opus';
        case 'mp3':
            return 'mp3';
        default:
            return 'unknown';
    }
}

function inferAudioCodecFromHeader(bytes: Uint8Array): AudioCodec {
    const header = bytes.subarray(0, 12);

    // "RIFF....WAVE"
    if (
        header[0] === 0x52 &&
        header[1] === 0x49 &&
        header[2] === 0x46 &&
        header[3] === 0x46 &&
        header[8] === 0x57 &&
        header[9] === 0x41 &&
        header[10] === 0x56 &&
        header[11] === 0x45
    ) {
        return 'wav';
    }

    // "OggS"
    if (
        header[0] === 0x4f &&
        header[1] === 0x67 &&
        header[2] === 0x67 &&
        header[3] === 0x53
    ) {
        return 'ogg'; // luego ya en runtime puedes distinguir Vorbis vs Opus si quisieras
    }

    // "ID3" → típico de MP3 con tag
    if (header[0] === 0x49 && header[1] === 0x44 && header[2] === 0x33) {
        return 'mp3';
    }

    // etc... (AAC/ADTS, MP4, etc.)
    return 'unknown';
}

export function getAllAudioFiles(dir: string): string[] {
    const audioExtensions = ['.wav', '.ogg', '.mp3', '.aac', '.opus', '.m4a'];
    const files: string[] = [];
    
    if (!existsSync(dir)) {
        return files;
    }
    
    function scanDirectory(currentDir: string) {
        const items = readdirSync(currentDir);
        for (const item of items) {
            const fullPath = path.join(currentDir, item);
            const stat = statSync(fullPath);
            
            if (stat.isDirectory()) {
                scanDirectory(fullPath);
            } else if (audioExtensions.includes(path.extname(item).toLowerCase())) {
                files.push(fullPath);
            }
        }
    }
    
    scanDirectory(dir);
    return files;
}

export function getAudioDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err: any, metadata: any) => {
            if (err) {
                reject(err);
            } else {
                resolve(metadata.format.duration || 0);
            }
        });
    });
}

export function inferAudioCodec(path: string, bytes: Uint8Array): AudioCodec {
    const extCodec = inferAudioCodecFromExtension(path);
    const headerCodec = inferAudioCodecFromHeader(bytes);

    if (headerCodec !== 'unknown') {
        if (extCodec !== 'unknown' && extCodec !== headerCodec) {
            // warning con sorna: "oye, tu .wav huele a mp3"
            console.warn(
                `Codec mismatch: extension says "${extCodec}", header says "${headerCodec}"`
            );
        }
        return headerCodec;
    }

    return extCodec;
}
