import { readdirSync } from "fs";
import { AudioSprite, CLIArgs } from "../types/packTypes";
import * as path from 'node:path';
import { statSync } from "fs";
import { existsSync, writeFileSync } from "node:fs";
import { getAllAudioFiles, getAudioDuration } from "./audio-codec";
const ffmpeg = require('fluent-ffmpeg');

export async function generateAudioSprite(inputDir: string, outputDir: string, spriteName: string, format: string, quality: string, silenceGapMs: number): Promise<void> {
    const audioFiles = getAllAudioFiles(inputDir).sort(); // Sort for consistent order
    if (audioFiles.length === 0) {
        console.log(`No audio files found in ${inputDir}`);
        return;
    }
    
    const outputFile = path.join(outputDir, `${spriteName}.${format}`);
    const jsonFile = path.join(outputDir, `${spriteName}.json`);
    
    // Build ffmpeg command for concatenation
    const tempListFile = path.resolve(outputDir, `temp_${spriteName}_list.txt`);
    const silenceGapSeconds = silenceGapMs / 1000;
    let silenceFile: string | undefined;

    if (!existsSync(outputDir)) {
        require('fs').mkdirSync(outputDir, { recursive: true });
    }
console.log(silenceGapMs);
    if (silenceGapMs > 0 && audioFiles.length > 1) {
        silenceFile = path.resolve(outputDir, `temp_${spriteName}_silence.wav`);
        await createSilenceAudio(silenceFile, silenceGapSeconds);
    }

    const listEntries: string[] = [];
    audioFiles.forEach((file, index) => {
        listEntries.push(`file '${path.resolve(file)}'`);
        if (silenceFile && index < audioFiles.length - 1) {
            listEntries.push(`file '${silenceFile}'`);
        }
    });
    const fileList = listEntries.join('\n');
    
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
        for (let index = 0; index < audioFiles.length; index++) {
            const audioFile = audioFiles[index];
            const fileName = path.basename(audioFile, path.extname(audioFile));
            
            // Get duration using ffprobe
            const duration = await getAudioDuration(audioFile);
            const startMs = Math.round(currentTime * 1000);
            const durationMs = Math.round(duration * 1000);
            sprite.sprite[fileName] = [startMs, durationMs];
            currentTime += duration;
            if (silenceGapMs > 0 && index < audioFiles.length - 1) {
                currentTime += silenceGapSeconds;
            }
        }
        
        writeFileSync(jsonFile, JSON.stringify(sprite, null, 2));
        
        // Cleanup temp file
        if (existsSync(tempListFile)) {
            require('fs').unlinkSync(tempListFile);
        }
        if (silenceFile && existsSync(silenceFile)) {
            require('fs').unlinkSync(silenceFile);
        }
        
        console.log(`✅ Generated sprite: ${spriteName} (${audioFiles.length} sounds)`);
        
    } catch (error) {
        console.error(`❌ Failed to generate sprite ${spriteName}:`, error);
        
        // Cleanup temp file on error
        if (existsSync(tempListFile)) {
           // require('fs').unlinkSync(tempListFile);
        }
        if (silenceFile && existsSync(silenceFile)) {
            require('fs').unlinkSync(silenceFile);
        }
    }
}

async function createSilenceAudio(filePath: string, durationSeconds: number): Promise<void> {
    const sampleRate = 44100;
    const channels = 1;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const totalSamples = Math.max(1, Math.round(durationSeconds * sampleRate));
    const dataSize = totalSamples * channels * bytesPerSample;
    const buffer = Buffer.alloc(44 + dataSize); // 44-byte WAV header
    let offset = 0;

    buffer.write('RIFF', offset); offset += 4;
    buffer.writeUInt32LE(36 + dataSize, offset); offset += 4;
    buffer.write('WAVE', offset); offset += 4;
    buffer.write('fmt ', offset); offset += 4;
    buffer.writeUInt32LE(16, offset); offset += 4; // Subchunk1 size (PCM)
    buffer.writeUInt16LE(1, offset); offset += 2; // Audio format PCM
    buffer.writeUInt16LE(channels, offset); offset += 2;
    buffer.writeUInt32LE(sampleRate, offset); offset += 4;
    buffer.writeUInt32LE(sampleRate * channels * bytesPerSample, offset); offset += 4; // Byte rate
    buffer.writeUInt16LE(channels * bytesPerSample, offset); offset += 2; // Block align
    buffer.writeUInt16LE(bitsPerSample, offset); offset += 2;
    buffer.write('data', offset); offset += 4;
    buffer.writeUInt32LE(dataSize, offset); offset += 4;
    // Remaining bytes already zero-filled -> silence

    writeFileSync(filePath, buffer);
}

export async function runSpritesMode(args: CLIArgs): Promise<void> {
    console.log(`🎼 Generating audio sprites from ${args.inputDir}`);
    
    // Get all subdirectories in input
    const inputItems = readdirSync(args.inputDir);
    const subdirs = inputItems.filter(item => {
        const fullPath = path.join(args.inputDir, item);
        return statSync(fullPath).isDirectory();
    });
    
    if (subdirs.length === 0) {
        // If no subdirectories, treat input directory as single sprite
        await generateAudioSprite(args.inputDir, args.outputDir, 'sprite', args.format, args.quality, args.silenceGapMs ?? 0);
    } else {
        // Generate one sprite per subdirectory
        for (const subdir of subdirs) {
            const inputPath = path.join(args.inputDir, subdir);
            await generateAudioSprite(inputPath, args.outputDir, subdir, args.format, args.quality, args.silenceGapMs ?? 0);
        }
    }
}
