import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { CLIArgs, InputAsset } from '../types/packTypes';
import * as path from 'node:path';
import { TextEncoder } from 'node:util';
import { getAllAudioFiles, inferAudioCodec } from './audio-codec';

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

async function createAudioBank(inputDir:string , outputDir: string, subFolder: string): Promise<void> {
    const inputFolder = path.join(inputDir, subFolder);
    const audioFiles = getAllAudioFiles(inputFolder).sort(); // Sort for consistent order
    if (audioFiles.length === 0) {
        console.log(`/!\\ No audio files found in ${inputFolder}`);
        return;
    }

    const assets: InputAsset[] = audioFiles.map((file: string) => {
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
        dv.setUint32(
            p + 8,
            Number((e.offset >> BigInt(32)) & BigInt(0xffffffff)),
            true
        );
        dv.setUint32(p + 12, Number(e.length & BigInt(0xffffffff)), true);
        dv.setUint32(
            p + 16,
            Number((e.length >> BigInt(32)) & BigInt(0xffffffff)),
            true
        );
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
    const outBank = path.join(outputDir, `${subFolder}.aurbank`);
    writeFileSync(outBank, bank);

    const meta = {
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

    console.log(`- Built bank: ${outBank} (${fileSize} bytes)`);
}

export async function runBankMode(args: CLIArgs): Promise<void> {
    console.log(`- Generating auralis audio banks from ${args.inputDir}`);

    const inputItems = readdirSync(args.inputDir);
    const subdirs = inputItems.filter((item) => {
        const fullPath = path.join(args.inputDir, item);
        return statSync(fullPath).isDirectory();
    });

    for (const subdir of subdirs) {
        console.log(`- Creating audio bank: ${subdir}`);
        await createAudioBank( args.inputDir, args.outputDir, subdir );
    }
}
