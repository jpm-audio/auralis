import { readdirSync } from "fs";
import { AudioSprite, CLIArgs } from "../types/packTypes";
import * as path from 'node:path';
import { statSync } from "fs";
import { existsSync, writeFileSync } from "node:fs";
import { getAllAudioFiles, getAudioDuration } from "./audio-codec";
const ffmpeg = require('fluent-ffmpeg');

export async function generateAudioSprite(inputDir: string, outputDir: string, spriteName: string, format: string, quality: string): Promise<void> {
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
    //s        require('fs').unlinkSync(tempListFile);
        }
    }
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
        await generateAudioSprite(args.inputDir, args.outputDir, 'sprite', args.format, args.quality);
    } else {
        // Generate one sprite per subdirectory
        for (const subdir of subdirs) {
            const inputPath = path.join(args.inputDir, subdir);
            await generateAudioSprite(inputPath, args.outputDir, subdir, args.format, args.quality);
        }
    }
}