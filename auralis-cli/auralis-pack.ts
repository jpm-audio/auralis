// tools/auralis-pack.ts
// Auralis Audio Packer - Multiple modes for audio processing
// Modes:
// --encode: Convert audio files from input/ to output/
// --sprites: Generate audio sprites from input/ folders
// --bank: Create binary audio banks (original functionality)

import { createWriteStream, readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { argv } from 'node:process';
import { TextEncoder } from 'node:util';
import * as path from 'node:path';
const ffmpeg = require('fluent-ffmpeg');
import * as ffmpegStatic from 'ffmpeg-static';
import { AudioCodec, inferAudioCodec } from './bank/audioCodecInferer';

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic as unknown as string);

// Types and interfaces
type OperationMode = 'encode' | 'sprites' | 'bank';

interface CLIArgs {
    mode: OperationMode;
    inputDir: string;
    outputDir: string;
    format: string;
    quality: string;
    bankId?: string;
    outFile?: string;
}

interface AudioSprite {
    src: string[];
    sprite: { [key: string]: [number, number] };
}

interface InputAsset {
    id: string; // logical name (e.g., "ui_click")
    file: string; // path
    codec: AudioCodec;
    data: Buffer; // file bytes
}

const AURBANK_HEADER_SIZE = 64;
const MAGIC = 0x41555242; // "AURB"

function hash32(str: string) {
    // Simple FNV-1a
    let h = 0x811c9dc5 >>> 0;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h >>> 0;
}

function parseArgs(): CLIArgs {
    const args = argv.slice(2);
    
    // Show help
    if (args.includes('--help') || args.includes('-h') || args.length === 0) {
        showHelp();
        process.exit(0);
    }

    // Determine mode
    let mode: OperationMode;
    if (args.includes('--encode')) {
        mode = 'encode';
    } else if (args.includes('--sprites')) {
        mode = 'sprites';
    } else if (args.includes('--bank')) {
        mode = 'bank';
    } else {
        // Default to bank for backward compatibility
        mode = 'bank';
    }

    const inputDir = getArgValue(args, '--input', './input') as string;
    const outputDir = getArgValue(args, '--output', './output') as string;
    const format = getArgValue(args, '--format', 'ogg') as string;
    const quality = getArgValue(args, '--quality', 'high') as string;
    const bankId = getArgValue(args, '--id');
    const outFile = getArgValue(args, '--out');

    return {
        mode,
        inputDir,
        outputDir,
        format,
        quality,
        bankId,
        outFile
    };
}

function getArgValue(args: string[], flag: string, defaultValue?: string): string | undefined {
    const index = args.indexOf(flag);
    if (index >= 0 && index < args.length - 1) {
        return args[index + 1];
    }
    return defaultValue;
}

function showHelp() {
    console.log(`
Auralis Audio Packer

USAGE:
  node auralis-pack.js <MODE> [OPTIONS]

MODES:
  --encode    Convert audio files from input/ to output/
  --sprites   Generate audio sprites from input/ folders  
  --bank      Create binary audio banks (default)

COMMON OPTIONS:
  --input <dir>     Input directory (default: ./input)
  --output <dir>    Output directory (default: ./output)
  --format <fmt>    Audio format: ogg, mp3, wav (default: ogg)
  --quality <q>     Quality: low, medium, high (default: high)
  --help, -h        Show this help

ENCODE MODE:
  Converts audio files maintaining filenames but changing format.
  
SPRITES MODE:
  Creates one audiosprite per subfolder in input/, with JSON metadata.
  
BANK MODE:
  --out <file>      Output bank file path
  --id <id>         Bank identifier
  
EXAMPLES:
  node auralis-pack.js --encode --format mp3
  node auralis-pack.js --sprites --format ogg --quality high
  node auralis-pack.js --bank --out dist/ui.bank --id ui_bank
    `);
}

// Utility functions
function getAllAudioFiles(dir: string): string[] {
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

function convertAudioFile(inputPath: string, outputPath: string, format: string, quality: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const command = ffmpeg(inputPath);
        
        // Set quality based on format and quality parameter
        if (format === 'ogg') {
            const qualityMap = { low: '-q:a 4', medium: '-q:a 6', high: '-q:a 8' };
            command.audioCodec('libvorbis').addOptions(qualityMap[quality as keyof typeof qualityMap]?.split(' ') || ['-q:a', '6']);
        } else if (format === 'mp3') {
            const bitrateMap = { low: '128k', medium: '192k', high: '256k' };
            command.audioCodec('libmp3lame').audioBitrate(bitrateMap[quality as keyof typeof bitrateMap] || '192k');
        } else if (format === 'wav') {
            command.audioCodec('pcm_s16le');
        }
        
        command
            .output(outputPath)
            .on('end', () => resolve())
            .on('error', (err: any) => reject(err))
            .run();
    });
}

async function runEncodeMode(args: CLIArgs): Promise<void> {
    console.log(`🎵 Encoding audio files from ${args.inputDir} to ${args.outputDir}`);
    
    const inputFiles = getAllAudioFiles(args.inputDir);
    if (inputFiles.length === 0) {
        console.log('No audio files found in input directory');
        return;
    }
    
    let processed = 0;
    for (const inputFile of inputFiles) {
        const relativePath = path.relative(args.inputDir, inputFile);
        const outputFile = path.join(args.outputDir, path.dirname(relativePath), path.basename(relativePath, path.extname(relativePath)) + '.' + args.format);
        
        // Ensure output directory exists
        const outputDir = path.dirname(outputFile);
        if (!existsSync(outputDir)) {
            mkdirSync(outputDir, { recursive: true });
        }
        
        try {
            await convertAudioFile(inputFile, outputFile, args.format, args.quality);
            console.log(`✅ ${relativePath} → ${path.basename(outputFile)}`);
            processed++;
        } catch (error) {
            console.error(`❌ Failed to convert ${relativePath}:`, error);
        }
    }
    
    console.log(`\n🎉 Processed ${processed}/${inputFiles.length} files`);
}

async function runSpritesMode(args: CLIArgs): Promise<void> {
    console.log(`🎼 Generating audio sprites from ${args.inputDir}`);
    
    // Get all subdirectories in input
    const inputItems = readdirSync(args.inputDir);
    const subdirs = inputItems.filter(item => {
        const fullPath = path.join(args.inputDir, item);
        return statSync(fullPath).isDirectory();
    });
    
    if (subdirs.length === 0) {
        // If no subdirectories, treat input directory as single sprite
        await generateAudioSprite(args.inputDir, args.outputDir, 'sprite', args.format, args.quality);
    } else {
        // Generate one sprite per subdirectory
        for (const subdir of subdirs) {
            const inputPath = path.join(args.inputDir, subdir);
            await generateAudioSprite(inputPath, args.outputDir, subdir, args.format, args.quality);
        }
    }
}

async function generateAudioSprite(inputDir: string, outputDir: string, spriteName: string, format: string, quality: string): Promise<void> {
    const audioFiles = getAllAudioFiles(inputDir).sort(); // Sort for consistent order
    if (audioFiles.length === 0) {
        console.log(`No audio files found in ${inputDir}`);
        return;
    }
    
    const outputFile = path.join(outputDir, `${spriteName}.${format}`);
    const jsonFile = path.join(outputDir, `${spriteName}.json`);
    
    // Build ffmpeg command for concatenation
    const tempListFile = path.join(outputDir, `temp_${spriteName}_list.txt`);
    const fileList = audioFiles.map(file => `file '${file}'`).join('\n');
    writeFileSync(tempListFile, fileList);
    
    try {
        // Create concatenated audio file
        await new Promise<void>((resolve, reject) => {
            const command = ffmpeg();
            command.input(tempListFile);
            command.inputOptions(['-f', 'concat', '-safe', '0']);
            
            // Set quality
            if (format === 'ogg') {
                const qualityMap = { low: '-q:a 4', medium: '-q:a 6', high: '-q:a 8' };
                command.audioCodec('libvorbis').addOptions(qualityMap[quality as keyof typeof qualityMap]?.split(' ') || ['-q:a', '6']);
            } else if (format === 'mp3') {
                const bitrateMap = { low: '128k', medium: '192k', high: '256k' };
                command.audioCodec('libmp3lame').audioBitrate(bitrateMap[quality as keyof typeof bitrateMap] || '192k');
            }
            
            command
                .output(outputFile)
                .on('end', () => resolve())
                .on('error', (err: any) => reject(err))
                .run();
        });
        
        // Generate sprite metadata
        const sprite: AudioSprite = {
            src: [`${spriteName}.${format}`],
            sprite: {}
        };
        
        let currentTime = 0;
        for (const audioFile of audioFiles) {
            const fileName = path.basename(audioFile, path.extname(audioFile));
            
            // Get duration using ffprobe
            const duration = await getAudioDuration(audioFile);
            sprite.sprite[fileName] = [currentTime * 1000, duration * 1000]; // Convert to ms
            currentTime += duration;
        }
        
        writeFileSync(jsonFile, JSON.stringify(sprite, null, 2));
        
        // Cleanup temp file
        if (existsSync(tempListFile)) {
            require('fs').unlinkSync(tempListFile);
        }
        
        console.log(`✅ Generated sprite: ${spriteName} (${audioFiles.length} sounds)`);
        
    } catch (error) {
        console.error(`❌ Failed to generate sprite ${spriteName}:`, error);
        
        // Cleanup temp file on error
        if (existsSync(tempListFile)) {
            require('fs').unlinkSync(tempListFile);
        }
    }
}

function getAudioDuration(filePath: string): Promise<number> {
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

async function runBankMode(args: CLIArgs): Promise<void> {
    if (!args.outFile) {
        throw new Error('Bank mode requires --out parameter');
    }
    
    const bankId = args.bankId || path.basename(args.outFile);
    const files = getAllAudioFiles(args.inputDir);
    
    if (files.length === 0) {
        throw new Error('No audio files found in input directory');
    }
    
    console.log(`🏦 Creating audio bank: ${args.outFile}`);
    await createAudioBank(files, args.outFile, bankId);
}

async function createAudioBank(files: string[], outBase: string, bankId: string): Promise<void> {
    const assets: InputAsset[] = files.map((file: string) => {
        const id = path.basename(file, path.extname(file)); // logical id from filename
        const buffer = readFileSync(file);
        const bytes = new Uint8Array(
            buffer.buffer,
            buffer.byteOffset,
            buffer.byteLength
        );
        const codec = inferAudioCodec(file, bytes);
        return { id, file, codec, data: buffer };
    });

    // Build Index
    const textEncoder = new TextEncoder();
    const indexEntries: {
        idHash32: number;
        offset: bigint;
        length: bigint;
        codec: number;
        flags: number;
        nameBytes: Uint8Array;
    }[] = [];

    let offset = BigInt(AURBANK_HEADER_SIZE);
    // header first, index after? We'll place index right after header.
    // We need to compute index size first (variable). So we assemble index buffer then compute chunks offset.
    // For simplicity: [HEADER][INDEX][CHUNKS]

    let indexSize = 0;
    for (const a of assets) {
        const nameBytes = textEncoder.encode(a.id);
        indexSize += 26 + nameBytes.length; // per spec
    }
    const indexOffset = AURBANK_HEADER_SIZE;
    const chunksOffset = indexOffset + indexSize;
    let chunkPtr = BigInt(chunksOffset);

    for (const a of assets) {
        const nameBytes = textEncoder.encode(a.id);
        const entry = {
            idHash32: hash32(a.id),
            offset: chunkPtr,
            length: BigInt(a.data.byteLength),
            codec:
                a.codec === 'wav'
                    ? 0
                    : a.codec === 'ogg'
                    ? 1
                    : a.codec === 'aac'
                    ? 2
                    : 3,
            flags: 0,
            nameBytes,
        };
        indexEntries.push(entry);
        chunkPtr += BigInt(a.data.byteLength);
    }

    // Allocate full buffer
    const fileSize = Number(chunkPtr);
    const bank = Buffer.alloc(fileSize);

    // Write header
    const dv = new DataView(bank.buffer, bank.byteOffset, bank.byteLength);
    dv.setUint32(0, MAGIC, true);
    dv.setUint16(4, 0x0100, true); // version 1.0
    dv.setUint16(6, 0, true); // flags
    dv.setUint32(8, assets.length, true);
    dv.setUint32(12, indexOffset, true);
    dv.setUint32(16, indexSize, true);
    dv.setUint32(20, fileSize >>> 0, true);
    dv.setUint32(24, 0, true); // hi (not used for <4GB)
    // rest reserved (zeroed)

    // Write index
    let p = indexOffset;
    for (const e of indexEntries) {
        dv.setUint32(p + 0, e.idHash32, true);
        dv.setUint32(p + 4, Number(e.offset & BigInt(0xffffffff)), true);
        dv.setUint32(p + 8, Number((e.offset >> BigInt(32)) & BigInt(0xffffffff)), true);
        dv.setUint32(p + 12, Number(e.length & BigInt(0xffffffff)), true);
        dv.setUint32(p + 16, Number((e.length >> BigInt(32)) & BigInt(0xffffffff)), true);
        dv.setUint8(p + 20, e.codec);
        dv.setUint8(p + 21, e.flags);
        // 22..23 reserved
        dv.setUint16(p + 24, e.nameBytes.length, true);
        new Uint8Array(
            bank.buffer,
            bank.byteOffset + p + 26,
            e.nameBytes.length
        ).set(e.nameBytes);
        p += 26 + e.nameBytes.length;
    }

    // Write chunks
    for (let i = 0; i < assets.length; i++) {
        const e = indexEntries[i];
        const a = assets[i];
        const start = Number(e.offset);
        bank.set(a.data, start);
    }

    // Write outputs
    const outBank = outBase.endsWith('.bank') ? outBase : `${outBase}.bank`;
    writeFileSync(outBank, bank);

    const meta = {
        bankId,
        version: 1,
        compression: 'none',
        assets: indexEntries.map((e, i) => ({
            id: assets[i].id,
            offset: Number(e.offset),
            length: Number(e.length),
            codec: assets[i].codec,
            mode:
                assets[i].codec === 'ogg' || assets[i].codec === 'opus'
                    ? 'lazy'
                    : 'preload',
        })),
    };
    writeFileSync(`${outBank}.meta.json`, JSON.stringify(meta, null, 2));

    console.log(`✅ Built bank: ${outBank} (${fileSize} bytes)`);
}

(async function main() {
    try {
        const args = parseArgs();

        // Ensure output directory exists
        if (!existsSync(args.outputDir)) {
            mkdirSync(args.outputDir, { recursive: true });
        }

        switch (args.mode) {
            case 'encode':
                await runEncodeMode(args);
                break;
            case 'sprites':
                await runSpritesMode(args);
                break;
            case 'bank':
                await runBankMode(args);
                break;
            default:
                throw new Error(`Unknown mode: ${args.mode}`);
        }
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
})();
