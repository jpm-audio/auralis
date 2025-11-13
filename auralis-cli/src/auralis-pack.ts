// tools/auralis-pack.ts
// Auralis Audio Packer - Multiple modes for audio processing
// Modes:
// --encode: Convert audio files from input/ to output/
// --sprites: Generate audio sprites from input/ folders
// --bank: Create binary audio banks (original functionality)

import { existsSync, mkdirSync } from 'fs';
import { argv } from 'node:process';
import { CLIArgs, OperationMode } from './types/packTypes';
import { runEncodeMode } from './modules/encode-mode';
import { runSpritesMode } from './modules/sprite-mode';
import { runBankMode } from './modules/bank-mode';

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
