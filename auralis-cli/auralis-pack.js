"use strict";
// tools/auralis-pack.ts
// Auralis Audio Packer - Multiple modes for audio processing
// Modes:
// --encode: Convert audio files from input/ to output/
// --sprites: Generate audio sprites from input/ folders
// --bank: Create binary audio banks (original functionality)
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var node_process_1 = require("node:process");
var node_util_1 = require("node:util");
var path = require("node:path");
var ffmpeg = require('fluent-ffmpeg');
var ffmpegStatic = require("ffmpeg-static");
var audioCodecInferer_1 = require("./bank/audioCodecInferer");
// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);
var AURBANK_HEADER_SIZE = 64;
var MAGIC = 0x41555242; // "AURB"
function hash32(str) {
    // Simple FNV-1a
    var h = 0x811c9dc5 >>> 0;
    for (var i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h >>> 0;
}
function parseArgs() {
    var args = node_process_1.argv.slice(2);
    // Show help
    if (args.includes('--help') || args.includes('-h') || args.length === 0) {
        showHelp();
        process.exit(0);
    }
    // Determine mode
    var mode;
    if (args.includes('--encode')) {
        mode = 'encode';
    }
    else if (args.includes('--sprites')) {
        mode = 'sprites';
    }
    else if (args.includes('--bank')) {
        mode = 'bank';
    }
    else {
        // Default to bank for backward compatibility
        mode = 'bank';
    }
    var inputDir = getArgValue(args, '--input', './input');
    var outputDir = getArgValue(args, '--output', './output');
    var format = getArgValue(args, '--format', 'ogg');
    var quality = getArgValue(args, '--quality', 'high');
    var bankId = getArgValue(args, '--id');
    var outFile = getArgValue(args, '--out');
    return {
        mode: mode,
        inputDir: inputDir,
        outputDir: outputDir,
        format: format,
        quality: quality,
        bankId: bankId,
        outFile: outFile
    };
}
function getArgValue(args, flag, defaultValue) {
    var index = args.indexOf(flag);
    if (index >= 0 && index < args.length - 1) {
        return args[index + 1];
    }
    return defaultValue;
}
function showHelp() {
    console.log("\nAuralis Audio Packer\n\nUSAGE:\n  node auralis-pack.js <MODE> [OPTIONS]\n\nMODES:\n  --encode    Convert audio files from input/ to output/\n  --sprites   Generate audio sprites from input/ folders  \n  --bank      Create binary audio banks (default)\n\nCOMMON OPTIONS:\n  --input <dir>     Input directory (default: ./input)\n  --output <dir>    Output directory (default: ./output)\n  --format <fmt>    Audio format: ogg, mp3, wav (default: ogg)\n  --quality <q>     Quality: low, medium, high (default: high)\n  --help, -h        Show this help\n\nENCODE MODE:\n  Converts audio files maintaining filenames but changing format.\n  \nSPRITES MODE:\n  Creates one audiosprite per subfolder in input/, with JSON metadata.\n  \nBANK MODE:\n  --out <file>      Output bank file path\n  --id <id>         Bank identifier\n  \nEXAMPLES:\n  node auralis-pack.js --encode --format mp3\n  node auralis-pack.js --sprites --format ogg --quality high\n  node auralis-pack.js --bank --out dist/ui.bank --id ui_bank\n    ");
}
// Utility functions
function getAllAudioFiles(dir) {
    var audioExtensions = ['.wav', '.ogg', '.mp3', '.aac', '.opus', '.m4a'];
    var files = [];
    if (!(0, fs_1.existsSync)(dir)) {
        return files;
    }
    function scanDirectory(currentDir) {
        var items = (0, fs_1.readdirSync)(currentDir);
        for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
            var item = items_1[_i];
            var fullPath = path.join(currentDir, item);
            var stat = (0, fs_1.statSync)(fullPath);
            if (stat.isDirectory()) {
                scanDirectory(fullPath);
            }
            else if (audioExtensions.includes(path.extname(item).toLowerCase())) {
                files.push(fullPath);
            }
        }
    }
    scanDirectory(dir);
    return files;
}
function convertAudioFile(inputPath, outputPath, format, quality) {
    return new Promise(function (resolve, reject) {
        var _a;
        var command = ffmpeg(inputPath);
        // Set quality based on format and quality parameter
        if (format === 'ogg') {
            var qualityMap = { low: '-q:a 4', medium: '-q:a 6', high: '-q:a 8' };
            command.audioCodec('libvorbis').addOptions(((_a = qualityMap[quality]) === null || _a === void 0 ? void 0 : _a.split(' ')) || ['-q:a', '6']);
        }
        else if (format === 'mp3') {
            var bitrateMap = { low: '128k', medium: '192k', high: '256k' };
            command.audioCodec('libmp3lame').audioBitrate(bitrateMap[quality] || '192k');
        }
        else if (format === 'wav') {
            command.audioCodec('pcm_s16le');
        }
        command
            .output(outputPath)
            .on('end', function () { return resolve(); })
            .on('error', function (err) { return reject(err); })
            .run();
    });
}
function runEncodeMode(args) {
    return __awaiter(this, void 0, void 0, function () {
        var inputFiles, processed, _i, inputFiles_1, inputFile, relativePath, outputFile, outputDir, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("\uD83C\uDFB5 Encoding audio files from ".concat(args.inputDir, " to ").concat(args.outputDir));
                    inputFiles = getAllAudioFiles(args.inputDir);
                    if (inputFiles.length === 0) {
                        console.log('No audio files found in input directory');
                        return [2 /*return*/];
                    }
                    processed = 0;
                    _i = 0, inputFiles_1 = inputFiles;
                    _a.label = 1;
                case 1:
                    if (!(_i < inputFiles_1.length)) return [3 /*break*/, 6];
                    inputFile = inputFiles_1[_i];
                    relativePath = path.relative(args.inputDir, inputFile);
                    outputFile = path.join(args.outputDir, path.dirname(relativePath), path.basename(relativePath, path.extname(relativePath)) + '.' + args.format);
                    outputDir = path.dirname(outputFile);
                    if (!(0, fs_1.existsSync)(outputDir)) {
                        (0, fs_1.mkdirSync)(outputDir, { recursive: true });
                    }
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, convertAudioFile(inputFile, outputFile, args.format, args.quality)];
                case 3:
                    _a.sent();
                    console.log("\u2705 ".concat(relativePath, " \u2192 ").concat(path.basename(outputFile)));
                    processed++;
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error("\u274C Failed to convert ".concat(relativePath, ":"), error_1);
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6:
                    console.log("\n\uD83C\uDF89 Processed ".concat(processed, "/").concat(inputFiles.length, " files"));
                    return [2 /*return*/];
            }
        });
    });
}
function runSpritesMode(args) {
    return __awaiter(this, void 0, void 0, function () {
        var inputItems, subdirs, _i, subdirs_1, subdir, inputPath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("\uD83C\uDFBC Generating audio sprites from ".concat(args.inputDir));
                    inputItems = (0, fs_1.readdirSync)(args.inputDir);
                    subdirs = inputItems.filter(function (item) {
                        var fullPath = path.join(args.inputDir, item);
                        return (0, fs_1.statSync)(fullPath).isDirectory();
                    });
                    if (!(subdirs.length === 0)) return [3 /*break*/, 2];
                    // If no subdirectories, treat input directory as single sprite
                    return [4 /*yield*/, generateAudioSprite(args.inputDir, args.outputDir, 'sprite', args.format, args.quality)];
                case 1:
                    // If no subdirectories, treat input directory as single sprite
                    _a.sent();
                    return [3 /*break*/, 6];
                case 2:
                    _i = 0, subdirs_1 = subdirs;
                    _a.label = 3;
                case 3:
                    if (!(_i < subdirs_1.length)) return [3 /*break*/, 6];
                    subdir = subdirs_1[_i];
                    inputPath = path.join(args.inputDir, subdir);
                    return [4 /*yield*/, generateAudioSprite(inputPath, args.outputDir, subdir, args.format, args.quality)];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function generateAudioSprite(inputDir, outputDir, spriteName, format, quality) {
    return __awaiter(this, void 0, void 0, function () {
        var audioFiles, outputFile, jsonFile, tempListFile, fileList, sprite, currentTime, _i, audioFiles_1, audioFile, fileName, duration, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    audioFiles = getAllAudioFiles(inputDir).sort();
                    if (audioFiles.length === 0) {
                        console.log("No audio files found in ".concat(inputDir));
                        return [2 /*return*/];
                    }
                    outputFile = path.join(outputDir, "".concat(spriteName, ".").concat(format));
                    jsonFile = path.join(outputDir, "".concat(spriteName, ".json"));
                    tempListFile = path.join(outputDir, "temp_".concat(spriteName, "_list.txt"));
                    fileList = audioFiles.map(function (file) { return "file '".concat(file, "'"); }).join('\n');
                    (0, fs_1.writeFileSync)(tempListFile, fileList);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 7, , 8]);
                    // Create concatenated audio file
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            var _a;
                            var command = ffmpeg();
                            command.input(tempListFile);
                            command.inputOptions(['-f', 'concat', '-safe', '0']);
                            // Set quality
                            if (format === 'ogg') {
                                var qualityMap = { low: '-q:a 4', medium: '-q:a 6', high: '-q:a 8' };
                                command.audioCodec('libvorbis').addOptions(((_a = qualityMap[quality]) === null || _a === void 0 ? void 0 : _a.split(' ')) || ['-q:a', '6']);
                            }
                            else if (format === 'mp3') {
                                var bitrateMap = { low: '128k', medium: '192k', high: '256k' };
                                command.audioCodec('libmp3lame').audioBitrate(bitrateMap[quality] || '192k');
                            }
                            command
                                .output(outputFile)
                                .on('end', function () { return resolve(); })
                                .on('error', function (err) { return reject(err); })
                                .run();
                        })];
                case 2:
                    // Create concatenated audio file
                    _a.sent();
                    sprite = {
                        src: ["".concat(spriteName, ".").concat(format)],
                        sprite: {}
                    };
                    currentTime = 0;
                    _i = 0, audioFiles_1 = audioFiles;
                    _a.label = 3;
                case 3:
                    if (!(_i < audioFiles_1.length)) return [3 /*break*/, 6];
                    audioFile = audioFiles_1[_i];
                    fileName = path.basename(audioFile, path.extname(audioFile));
                    return [4 /*yield*/, getAudioDuration(audioFile)];
                case 4:
                    duration = _a.sent();
                    sprite.sprite[fileName] = [currentTime * 1000, duration * 1000]; // Convert to ms
                    currentTime += duration;
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6:
                    (0, fs_1.writeFileSync)(jsonFile, JSON.stringify(sprite, null, 2));
                    // Cleanup temp file
                    if ((0, fs_1.existsSync)(tempListFile)) {
                        require('fs').unlinkSync(tempListFile);
                    }
                    console.log("\u2705 Generated sprite: ".concat(spriteName, " (").concat(audioFiles.length, " sounds)"));
                    return [3 /*break*/, 8];
                case 7:
                    error_2 = _a.sent();
                    console.error("\u274C Failed to generate sprite ".concat(spriteName, ":"), error_2);
                    // Cleanup temp file on error
                    if ((0, fs_1.existsSync)(tempListFile)) {
                        require('fs').unlinkSync(tempListFile);
                    }
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
function getAudioDuration(filePath) {
    return new Promise(function (resolve, reject) {
        ffmpeg.ffprobe(filePath, function (err, metadata) {
            if (err) {
                reject(err);
            }
            else {
                resolve(metadata.format.duration || 0);
            }
        });
    });
}
function runBankMode(args) {
    return __awaiter(this, void 0, void 0, function () {
        var bankId, files;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!args.outFile) {
                        throw new Error('Bank mode requires --out parameter');
                    }
                    bankId = args.bankId || path.basename(args.outFile);
                    files = getAllAudioFiles(args.inputDir);
                    if (files.length === 0) {
                        throw new Error('No audio files found in input directory');
                    }
                    console.log("\uD83C\uDFE6 Creating audio bank: ".concat(args.outFile));
                    return [4 /*yield*/, createAudioBank(files, args.outFile, bankId)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function createAudioBank(files, outBase, bankId) {
    return __awaiter(this, void 0, void 0, function () {
        var assets, textEncoder, indexEntries, offset, indexSize, _i, assets_1, a, nameBytes, indexOffset, chunksOffset, chunkPtr, _a, assets_2, a, nameBytes, entry, fileSize, bank, dv, p, _b, indexEntries_1, e, i, e, a, start, outBank, meta;
        return __generator(this, function (_c) {
            assets = files.map(function (file) {
                var id = path.basename(file, path.extname(file)); // logical id from filename
                var buffer = (0, fs_1.readFileSync)(file);
                var bytes = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
                var codec = (0, audioCodecInferer_1.inferAudioCodec)(file, bytes);
                return { id: id, file: file, codec: codec, data: buffer };
            });
            textEncoder = new node_util_1.TextEncoder();
            indexEntries = [];
            offset = BigInt(AURBANK_HEADER_SIZE);
            indexSize = 0;
            for (_i = 0, assets_1 = assets; _i < assets_1.length; _i++) {
                a = assets_1[_i];
                nameBytes = textEncoder.encode(a.id);
                indexSize += 26 + nameBytes.length; // per spec
            }
            indexOffset = AURBANK_HEADER_SIZE;
            chunksOffset = indexOffset + indexSize;
            chunkPtr = BigInt(chunksOffset);
            for (_a = 0, assets_2 = assets; _a < assets_2.length; _a++) {
                a = assets_2[_a];
                nameBytes = textEncoder.encode(a.id);
                entry = {
                    idHash32: hash32(a.id),
                    offset: chunkPtr,
                    length: BigInt(a.data.byteLength),
                    codec: a.codec === 'wav'
                        ? 0
                        : a.codec === 'ogg'
                            ? 1
                            : a.codec === 'aac'
                                ? 2
                                : 3,
                    flags: 0,
                    nameBytes: nameBytes,
                };
                indexEntries.push(entry);
                chunkPtr += BigInt(a.data.byteLength);
            }
            fileSize = Number(chunkPtr);
            bank = Buffer.alloc(fileSize);
            dv = new DataView(bank.buffer, bank.byteOffset, bank.byteLength);
            dv.setUint32(0, MAGIC, true);
            dv.setUint16(4, 0x0100, true); // version 1.0
            dv.setUint16(6, 0, true); // flags
            dv.setUint32(8, assets.length, true);
            dv.setUint32(12, indexOffset, true);
            dv.setUint32(16, indexSize, true);
            dv.setUint32(20, fileSize >>> 0, true);
            dv.setUint32(24, 0, true); // hi (not used for <4GB)
            p = indexOffset;
            for (_b = 0, indexEntries_1 = indexEntries; _b < indexEntries_1.length; _b++) {
                e = indexEntries_1[_b];
                dv.setUint32(p + 0, e.idHash32, true);
                dv.setUint32(p + 4, Number(e.offset & BigInt(0xffffffff)), true);
                dv.setUint32(p + 8, Number((e.offset >> BigInt(32)) & BigInt(0xffffffff)), true);
                dv.setUint32(p + 12, Number(e.length & BigInt(0xffffffff)), true);
                dv.setUint32(p + 16, Number((e.length >> BigInt(32)) & BigInt(0xffffffff)), true);
                dv.setUint8(p + 20, e.codec);
                dv.setUint8(p + 21, e.flags);
                // 22..23 reserved
                dv.setUint16(p + 24, e.nameBytes.length, true);
                new Uint8Array(bank.buffer, bank.byteOffset + p + 26, e.nameBytes.length).set(e.nameBytes);
                p += 26 + e.nameBytes.length;
            }
            // Write chunks
            for (i = 0; i < assets.length; i++) {
                e = indexEntries[i];
                a = assets[i];
                start = Number(e.offset);
                bank.set(a.data, start);
            }
            outBank = outBase.endsWith('.bank') ? outBase : "".concat(outBase, ".bank");
            (0, fs_1.writeFileSync)(outBank, bank);
            meta = {
                bankId: bankId,
                version: 1,
                compression: 'none',
                assets: indexEntries.map(function (e, i) { return ({
                    id: assets[i].id,
                    offset: Number(e.offset),
                    length: Number(e.length),
                    codec: assets[i].codec,
                    mode: assets[i].codec === 'ogg' || assets[i].codec === 'opus'
                        ? 'lazy'
                        : 'preload',
                }); }),
            };
            (0, fs_1.writeFileSync)("".concat(outBank, ".meta.json"), JSON.stringify(meta, null, 2));
            console.log("\u2705 Built bank: ".concat(outBank, " (").concat(fileSize, " bytes)"));
            return [2 /*return*/];
        });
    });
}
(function main() {
    return __awaiter(this, void 0, void 0, function () {
        var args, _a, error_3;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 9, , 10]);
                    args = parseArgs();
                    // Ensure output directory exists
                    if (!(0, fs_1.existsSync)(args.outputDir)) {
                        (0, fs_1.mkdirSync)(args.outputDir, { recursive: true });
                    }
                    _a = args.mode;
                    switch (_a) {
                        case 'encode': return [3 /*break*/, 1];
                        case 'sprites': return [3 /*break*/, 3];
                        case 'bank': return [3 /*break*/, 5];
                    }
                    return [3 /*break*/, 7];
                case 1: return [4 /*yield*/, runEncodeMode(args)];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 8];
                case 3: return [4 /*yield*/, runSpritesMode(args)];
                case 4:
                    _b.sent();
                    return [3 /*break*/, 8];
                case 5: return [4 /*yield*/, runBankMode(args)];
                case 6:
                    _b.sent();
                    return [3 /*break*/, 8];
                case 7: throw new Error("Unknown mode: ".concat(args.mode));
                case 8: return [3 /*break*/, 10];
                case 9:
                    error_3 = _b.sent();
                    console.error('Error:', error_3);
                    process.exit(1);
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    });
})();
