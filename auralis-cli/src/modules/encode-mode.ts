import { existsSync, mkdirSync } from "fs";
import { CLIArgs } from "../types/packTypes";
import * as path from 'node:path';
import { getAllAudioFiles } from "./audio-codec";
const ffmpeg = require('fluent-ffmpeg');

export function convertAudioFile(inputPath: string, outputPath: string, format: string, quality: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const command = ffmpeg(inputPath);
        
        // Set quality based on format and quality parameter
        if (format === 'ogg') {
            const qualityMap = { low: '-q:a 4', medium: '-q:a 6', high: '-q:a 8' };
            command.audioCodec('libvorbis').addOptions(qualityMap[quality as keyof typeof qualityMap]?.split(' ') || ['-q:a', '6']);
        } else if (format === 'mp3') {
            const bitrateMap = { low: '128k', medium: '192k', high: '256k' };
            console.log("Set the codec");
            command.audioCodec('libmp3lame').audioBitrate(bitrateMap[quality as keyof typeof bitrateMap] || '192k');
            console.log("After setting bitrate");
        } else if (format === 'wav') {
            command.audioCodec('pcm_s16le');
        }
        
        console.log(outputPath);
        command
            .output(outputPath)
            .on('end', () => resolve())
            .on('error', (err: any) => reject(err))
            .run();
    });
}

export async function runEncodeMode(args: CLIArgs): Promise<void> {
    console.log(`Encoding audio files from ${args.inputDir} to ${args.outputDir}`);
    
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