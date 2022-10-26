#!/usr/bin/env node 

'use strict';

var FS = require('node:fs');
var PATH = require('node:path');
var svgParser = require('svg-parser');
var rgba = require('color-rgba');

function svg2icon(svgString, options = {}) {
    var _a, _b, _c;
    const { scaleX = 1, scaleY = 1, translateX = 0, translateY = 0, preserveFill = true } = options;
    const svgRoot = svgParser.parse(svgString);
    const svgNode = svgRoot.children[0];
    if (typeof svgNode === 'string' || svgNode.type === 'text') {
        throw new Error('Detected a text string within the SVG, which is not supported.');
    }
    let output = '';
    let width = 0;
    let height = 0;
    if (typeof ((_a = svgNode.properties) === null || _a === void 0 ? void 0 : _a.viewBox) === 'string') {
        width = parseInt(svgNode.properties.viewBox.split(' ')[2]) || 0;
        height = parseInt(svgNode.properties.viewBox.split(' ')[3]) || 0;
    }
    else {
        width = parseInt(`${(_b = svgNode.properties) === null || _b === void 0 ? void 0 : _b.width}`) || 0;
        height = parseInt(`${(_c = svgNode.properties) === null || _c === void 0 ? void 0 : _c.height}`) || 0;
    }
    if (width === 0 || height === 0) {
        throw new Error('<svg> width and/or height could not be parsed');
    }
    if (width !== height) {
        throw new Error('<svg> width and height must be equal in order to produce accurate conversion');
    }
    if (width !== 48) {
        output += 'CANVAS_DIMENSIONS, ' + width + ',\n';
    }
    output += handleNode(svgNode, scaleX, scaleY, translateX, translateY, preserveFill);
    output = output.slice(0, -2);
    output += '\n';
    return output;
}
function toCommand(letter) {
    switch (letter) {
        case 'M':
            return 'MOVE_TO';
        case 'm':
            return 'R_MOVE_TO';
        case 'L':
            return 'LINE_TO';
        case 'l':
            return 'R_LINE_TO';
        case 'H':
            return 'H_LINE_TO';
        case 'h':
            return 'R_H_LINE_TO';
        case 'V':
            return 'V_LINE_TO';
        case 'v':
            return 'R_V_LINE_TO';
        case 'A':
            return 'ARC_TO';
        case 'a':
            return 'R_ARC_TO';
        case 'C':
            return 'CUBIC_TO';
        case 'S':
            return 'CUBIC_TO_SHORTHAND';
        case 'c':
        case 's':
            return 'R_CUBIC_TO';
        case 'Q':
            return 'QUADRATIC_TO';
        case 'T':
            return 'QUADRATIC_TO_SHORTHAND';
        case 'q':
        case 't':
            return 'R_QUADRATIC_TO';
        case 'Z':
        case 'z':
            return 'CLOSE';
    }
    return '~UNKNOWN~';
}
function lengthForSvgDirective(letter) {
    switch (letter) {
        case 'C':
        case 'c':
        case 's':
            return 6;
        case 'S':
        case 'Q':
        case 'q':
        case 't':
            return 4;
        case 'T':
        case 'L':
        case 'l':
        case 'H':
        case 'h':
        case 'V':
        case 'v':
        case 'm':
        case 'M':
            return 2;
        case 'A':
        case 'a':
            return 7;
    }
    return 999;
}
function toFloat(val) {
    return val === undefined ? 0 : parseFloat(`${val}`) || 0;
}
function isFloat(val) {
    return typeof val == 'number' && (val * 10) % 10 != 0;
}
function num2str(val) {
    return isFloat(val) ? `${val}f` : `${val}`;
}
function roundToHundredths(x) {
    return Math.floor(x * 100 + 0.5) / 100;
}
function componentToHex(c) {
    const hex = c.toString(16);
    return (hex.length == 1 ? '0' + hex : hex).toUpperCase();
}
function parsePathColorCommand(svgElement) {
    var _a;
    const fill = (_a = svgElement.properties) === null || _a === void 0 ? void 0 : _a.fill;
    if (typeof fill !== 'string') {
        return '';
    }
    const color = rgba(fill);
    if (color) {
        const [r, g, b, a] = color;
        return `PATH_COLOR_ARGB, 0x${componentToHex((a * 255) | (1 << 8))}, 0x${componentToHex(r)}, 0x${componentToHex(g)}, 0x${componentToHex(b)},\n`;
    }
    return '';
}
function handleNode(svgNode, scaleX = 1, scaleY = 1, translateX = 0, translateY = 0, preserveFill = true, inheritedFillCommand = '') {
    let output = '';
    svgNode.children.forEach((svgChildNode) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
        if (typeof svgChildNode === 'string' || svgChildNode.type === 'text') {
            throw new Error('Detected a text string within the SVG, which is not supported.');
        }
        const fillCommand = preserveFill
            ? parsePathColorCommand(svgChildNode) || inheritedFillCommand
            : '';
        switch (svgChildNode.tagName) {
            case 'g': {
                if ((_a = svgChildNode.properties) === null || _a === void 0 ? void 0 : _a.transform) {
                    throw new Error('<g> with a transform not handled');
                }
                else {
                    output += handleNode(svgChildNode, scaleX, scaleY, translateX, translateY, preserveFill, fillCommand);
                }
                break;
            }
            case 'path': {
                if (((_b = svgChildNode.properties) === null || _b === void 0 ? void 0 : _b.fill) === 'none') {
                    break;
                }
                const commands = [];
                let path = typeof ((_c = svgChildNode.properties) === null || _c === void 0 ? void 0 : _c.d) === 'string' ? (_d = svgChildNode.properties) === null || _d === void 0 ? void 0 : _d.d : '';
                path = path.replace(/,/g, ' ').trim();
                if (path.slice(-1).toLowerCase() !== 'z') {
                    path += 'z';
                }
                while (path) {
                    let point = parseFloat(path);
                    if (point !== point) {
                        const letter = path[0];
                        path = path.substr(1);
                        commands.push({ command: letter, args: [] });
                    }
                    else {
                        let currentCommand = commands[commands.length - 1];
                        let svgDirective = currentCommand.command;
                        if (currentCommand.args.length == lengthForSvgDirective(svgDirective)) {
                            if (svgDirective == 'm') {
                                svgDirective = 'l';
                            }
                            else if (svgDirective == 'M') {
                                svgDirective = 'L';
                            }
                            commands.push({ command: svgDirective, args: [] });
                            currentCommand = commands[commands.length - 1];
                            svgDirective = currentCommand.command;
                        }
                        let pathNeedsPruning = true;
                        if (svgDirective.toLowerCase() == 'a' &&
                            currentCommand.args.length >= 3 &&
                            currentCommand.args.length <= 4) {
                            point = parseInt(path[0]);
                            if (point == 0 || point == 1) {
                                path = path.substr(1);
                                pathNeedsPruning = false;
                            }
                            else {
                                throw new Error(`Unexpected arc argument: ${point}`);
                            }
                        }
                        const isQuadraticOrCubic = svgDirective.toLowerCase() == 's' || svgDirective.toLowerCase() == 't';
                        if (isQuadraticOrCubic && currentCommand.args.length == 0) {
                            if (svgDirective == 's' || svgDirective == 't') {
                                const lastCommand = commands[commands.length - 2];
                                if ((svgDirective == 's' &&
                                    toCommand(lastCommand.command).indexOf('CUBIC_TO') >= 0) ||
                                    (svgDirective == 't' &&
                                        toCommand(lastCommand.command).indexOf('QUADRATIC_TO') >= 0)) {
                                    const argsLength = lastCommand.args.length;
                                    currentCommand.args.push(roundToHundredths(lastCommand.args[argsLength - 2] - lastCommand.args[argsLength - 4]));
                                    currentCommand.args.push(roundToHundredths(lastCommand.args[argsLength - 1] - lastCommand.args[argsLength - 3]));
                                }
                                else {
                                    currentCommand.args.push(0);
                                    currentCommand.args.push(0);
                                }
                            }
                        }
                        let transformArg = true;
                        let xAxis = currentCommand.args.length % 2 == 0;
                        if (svgDirective.toLowerCase() == 'a') {
                            if (currentCommand.args.length < 5) {
                                transformArg = false;
                            }
                            xAxis = currentCommand.args.length % 2 == 1;
                        }
                        else if (svgDirective.toLowerCase() == 'v') {
                            xAxis = false;
                        }
                        if (transformArg) {
                            point *= xAxis ? scaleX : scaleY;
                            if (svgDirective != svgDirective.toLowerCase()) {
                                point += xAxis ? translateX : translateY;
                            }
                        }
                        point = roundToHundredths(point);
                        currentCommand.args.push(point);
                        if (pathNeedsPruning) {
                            let dotsSeen = 0;
                            for (let i = 0; i < path.length; ++i) {
                                if (i == 0 && path[i] == '-')
                                    continue;
                                if (!isNaN(parseInt(path[i])))
                                    continue;
                                if (path[i] == '.' && ++dotsSeen == 1)
                                    continue;
                                path = path.substr(i);
                                break;
                            }
                        }
                    }
                    path = path.trim();
                }
                output += 'NEW_PATH,\n';
                output += fillCommand;
                commands.forEach((command) => {
                    output += `${toCommand(command.command)}`;
                    for (let key in command.args) {
                        output += `, ${num2str(command.args[key])}`;
                    }
                    output += ',\n';
                });
                break;
            }
            case 'circle': {
                if (((_e = svgChildNode.properties) === null || _e === void 0 ? void 0 : _e.fill) === 'none') {
                    break;
                }
                output += 'NEW_PATH,\n';
                output += fillCommand;
                let cx = toFloat((_f = svgChildNode.properties) === null || _f === void 0 ? void 0 : _f.cx);
                cx *= scaleX;
                cx += translateX;
                let cy = toFloat((_g = svgChildNode.properties) === null || _g === void 0 ? void 0 : _g.cy);
                cy *= scaleY;
                cy += translateY;
                const rad = toFloat((_h = svgChildNode.properties) === null || _h === void 0 ? void 0 : _h.r);
                output = `CIRCLE, ${num2str(cx)}, ${num2str(cy)}, ${num2str(rad)},\n`;
                break;
            }
            case 'rect': {
                if (((_j = svgChildNode.properties) === null || _j === void 0 ? void 0 : _j.fill) === 'none') {
                    break;
                }
                output += 'NEW_PATH,\n';
                output += fillCommand;
                let x = toFloat((_k = svgChildNode.properties) === null || _k === void 0 ? void 0 : _k.x);
                x *= scaleX;
                x += translateX;
                let y = toFloat((_l = svgChildNode.properties) === null || _l === void 0 ? void 0 : _l.y);
                y *= scaleY;
                y += translateY;
                const width = toFloat((_m = svgChildNode.properties) === null || _m === void 0 ? void 0 : _m.width);
                const height = toFloat((_o = svgChildNode.properties) === null || _o === void 0 ? void 0 : _o.width);
                const rx = toFloat((_p = svgChildNode.properties) === null || _p === void 0 ? void 0 : _p.rx);
                output = `ROUND_RECT, ${num2str(x)}, ${num2str(y)}, ${num2str(width)}, ${num2str(height)}, ${num2str(rx)},\n`;
                break;
            }
            case 'ellipse': {
                if (((_q = svgChildNode.properties) === null || _q === void 0 ? void 0 : _q.fill) === 'none') {
                    break;
                }
                output += 'NEW_PATH,\n';
                output += fillCommand;
                let cx = toFloat((_r = svgChildNode.properties) === null || _r === void 0 ? void 0 : _r.cx);
                cx *= scaleX;
                cx += translateX;
                let cy = toFloat((_s = svgChildNode.properties) === null || _s === void 0 ? void 0 : _s.cy);
                cy *= scaleY;
                cy += translateY;
                const rx = toFloat((_t = svgChildNode.properties) === null || _t === void 0 ? void 0 : _t.rx);
                const ry = toFloat((_u = svgChildNode.properties) === null || _u === void 0 ? void 0 : _u.ry);
                output = `OVAL, ${num2str(cx)}, ${num2str(cy)}, ${num2str(rx)}, ${num2str(ry)},\n`;
                break;
            }
            default: {
                throw new Error(`Unsupported svg element: <${svgChildNode.tagName}>`);
            }
        }
    });
    return output;
}

const VERSION = '3.0.0';
function error(msg) {
    console.error(`Error: ${msg}`);
}
function warn(msg) {
    console.error(`Warning: ${msg}`);
}
function errorExit(msg) {
    error(msg);
    process.exit(1);
}
function isDir(path) {
    try {
        return FS.statSync(path).isDirectory();
    }
    catch (e) { }
    return false;
}
function parseArgs() {
    const result = {
        help: false,
        version: false,
        inputs: [],
        trailings: [],
        outputs: [],
        quiet: false,
        preserveFill: false,
        stdInData: '',
    };
    const inputPrefix = '--input';
    const outputPrefix = '--output';
    let i = 2;
    while (i < process.argv.length) {
        const arg = process.argv[i];
        if (arg == '--help' || arg == '-h') {
            result.help = true;
        }
        else if (arg == '--version' || arg == '-v') {
            result.version = true;
        }
        else if (arg == inputPrefix || arg.startsWith(inputPrefix + '=')) {
            if (arg == inputPrefix || arg == inputPrefix + '=')
                errorExit(`no argument specified for ${inputPrefix}`);
            const path = arg.substr(inputPrefix.length + 1);
            result.inputs.push({ type: isDir(path) ? 'd' : 'f', value: path });
        }
        else if (arg == '-i') {
            i++;
            if (i == process.argv.length)
                errorExit(`no argument specified for ${arg}`);
            const path = process.argv[i];
            result.inputs.push({ type: isDir(path) ? 'd' : 'f', value: path });
        }
        else if (arg == outputPrefix || arg.startsWith(outputPrefix + '=')) {
            if (arg == outputPrefix || arg == outputPrefix + '=')
                errorExit(`no argument specified for ${outputPrefix}`);
            const path = arg.substr(outputPrefix.length + 1);
            result.outputs.push({ type: isDir(path) ? 'd' : 'f', value: path, cmdline: arg });
        }
        else if (arg == '-o') {
            i++;
            if (i == process.argv.length)
                errorExit(`no argument specified for ${arg}`);
            const path = process.argv[i];
            result.outputs.push({ type: isDir(path) ? 'd' : 'f', value: path, cmdline: `-o ${path}` });
        }
        else if (arg == '-q' || arg == '--quiet') {
            result.quiet = true;
        }
        else if (arg == '-c') {
            result.preserveFill = true;
        }
        else {
            for (; i < process.argv.length; i++) {
                const path = process.argv[i];
                result.trailings.push({ type: isDir(path) ? 'd' : 'f', value: path });
            }
            break;
        }
        i++;
    }
    if (!Boolean(process.stdin.isTTY)) {
        result.trailings.push({ type: 'f', value: '-' });
    }
    return result;
}
function usage() {
    console.log(`Node.js based chromium devtools for converting SVG files to Skia Vector Icon files

    Usage:
    svg2icon [OPTIONS] [ARGS]

    Options:
      -h, --help: Help
      -v, --version : Version
      -i INPUT, --input=INPUT : Input file or folder, "-" for STDIN (for folder, convert all *.svg files to *.icon files)
      -o OUTPUT, --output=OUTPUT : Output file or folder, "-" for STDOUT
      -q, --quiet: Only show error messages
      -c : Output color (default: no)

    Arguments:
    INPUT : Alias to --input
    `);
}
function helpExit() {
    usage();
    process.exit(0);
}
function findAllFilesInDir(dir, ext) {
    function impl(dir, ext, result) {
        for (const name of FS.readdirSync(dir)) {
            const path = PATH.join(dir, name);
            if (FS.statSync(path).isDirectory()) {
                impl(path, ext, result);
            }
            else if (!ext || name.endsWith(ext)) {
                result.push(path);
            }
        }
    }
    const result = [];
    impl(dir, ext, result);
    for (let i = 0; i < result.length; i++) {
        result[i] = PATH.relative(dir, result[i]);
    }
    return result;
}
function mkdirP(parentDir, childDir) {
    const list = childDir.split(PATH.sep);
    let path = '';
    for (const item of list) {
        if (path) {
            path = PATH.join(path, item);
        }
        else {
            path = item;
        }
        const target = PATH.join(parentDir, path);
        if (isDir(target))
            continue;
        try {
            FS.mkdirSync(target);
        }
        catch (e) {
            error(`mkdir ${target} failed, reason: ${e}`);
            return false;
        }
    }
    return true;
}
function svg2IconWrite(args, source, target, data) {
    const iconData = svg2icon(data, { preserveFill: !!args.preserveFill });
    if (target == '-') {
        console.log(iconData);
        return;
    }
    try {
        FS.writeFileSync(target, iconData);
        if (!args.quiet) {
            console.log(`${source} --> ${target}`);
        }
    }
    catch (e) {
        error(`write ${target} failed, reason: ${e}, source: ${source}`);
    }
}
function processFile(args, source, target) {
    if (source == '-') {
        const data = args.stdInData;
        svg2IconWrite(args, source, target, data);
    }
    else {
        try {
            const data = FS.readFileSync(source, 'utf8');
            svg2IconWrite(args, source, target, data);
        }
        catch (e) {
            error(`read failed, file: ${source}, reason: ${e}`);
        }
    }
}
function processFiles(args, files, fromDir, targetDir, createDir = false) {
    for (const file of files) {
        if (createDir && !mkdirP(targetDir, PATH.dirname(file))) {
            const dir = PATH.join(targetDir, PATH.dirname(file));
            error(`mkdir failed: ${dir}`);
            continue;
        }
        const source = PATH.join(fromDir, file);
        const target = PATH.join(targetDir, PATH.dirname(file), PATH.basename(file, '.svg') + '.icon');
        processFile(args, source, target);
    }
}
function genIconFile(file) {
    if (file == '-')
        return file;
    let result = file;
    let index = result.lastIndexOf('.');
    if (index != -1) {
        result = result.substr(0, index);
    }
    result += '.icon';
    return result;
}
function processOne(args, input, output) {
    if (input.type == 'd') {
        const fromDir = input.value;
        const files = findAllFilesInDir(fromDir, '.svg');
        if (files.length == 0)
            return;
        if (output) {
            if (output.type == 'd') {
                processFiles(args, files, fromDir, output.value, true);
            }
            else {
                {
                    const file = files[0];
                    files.splice(0, 1);
                    const source = PATH.join(fromDir, file);
                    processFile(args, source, output.value);
                }
                processFiles(args, files, fromDir, fromDir);
            }
        }
        else {
            processFiles(args, files, fromDir, fromDir);
        }
    }
    else {
        if (output) {
            if (output.type == 'd') {
                const target = input.value == '-'
                    ? '-'
                    : PATH.join(output.value, genIconFile(PATH.basename(input.value)));
                processFile(args, input.value, target);
            }
            else {
                processFile(args, input.value, output.value);
            }
        }
        else {
            const target = genIconFile(input.value);
            processFile(args, input.value, target);
        }
    }
}
function doWork(args) {
    const pairsLen = Math.min(args.inputs.length, args.outputs.length);
    const pairInputs = args.inputs.splice(0, pairsLen);
    const pairOutputs = args.outputs.splice(0, pairsLen);
    let defaultOutputFolder = null;
    let ignoreOutputs = [];
    for (let i = 0; i < args.outputs.length; i++) {
        if (args.outputs[i].type == 'd') {
            defaultOutputFolder = args.outputs[i];
            ignoreOutputs = args.outputs.splice(i + 1);
            break;
        }
    }
    if (ignoreOutputs.length > 0) {
        let list = [];
        for (const item of ignoreOutputs) {
            list.push(item.cmdline);
        }
        const mesg = list.join(' ');
        warn(`ignore extra output arguments: ${mesg}`);
    }
    for (let i = 0; i < pairsLen; i++) {
        processOne(args, pairInputs[i], pairOutputs[i]);
    }
    const inputs = args.inputs.concat(args.trailings);
    for (let i = 0; i < inputs.length; i++) {
        processOne(args, inputs[i], i < args.outputs.length ? args.outputs[i] : defaultOutputFolder);
    }
}
function run() {
    const args = parseArgs();
    if (args.help) {
        helpExit();
    }
    if (args.version) {
        console.log(VERSION);
        process.exit(0);
    }
    if (args.inputs.length == 0 && args.trailings.length == 0) {
        if (process.argv.length == 2) {
            helpExit();
        }
        usage();
        error('no inputs found');
        process.exit(1);
    }
    function hasStdIn(list) {
        for (const item of list) {
            if (item.value == '-')
                return true;
        }
        return false;
    }
    if (hasStdIn(args.inputs) || hasStdIn(args.trailings)) {
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        let stdInData = '';
        process.stdin.on('data', function (chunk) {
            stdInData += chunk;
        });
        process.stdin.on('end', function () {
            args.stdInData = stdInData;
            doWork(args);
        });
    }
    else {
        doWork(args);
    }
}
run();
