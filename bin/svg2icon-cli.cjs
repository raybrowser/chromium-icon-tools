#!/usr/bin/env node 

'use strict';

var FS = require('node:fs');
var PATH = require('node:path');
var svgParser = require('svg-parser');
var colorString = require('color-string');

const SUPPORTED_ATTRIBUTES = {
    generic: ['fill', 'stroke', 'stroke-width', 'stroke-linecap'],
    path: ['d'],
    circle: ['cx', 'cy', 'r'],
    rect: ['x', 'y', 'width', 'height', 'rx'],
    ellipse: ['cx', 'cy', 'rx', 'ry'],
    line: ['x1', 'y1', 'x2', 'y2'],
};
function svg2icon(svgString, options = {}) {
    var _a, _b, _c;
    const { discardColors = false } = options;
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
    output += 'CANVAS_DIMENSIONS, ' + width + ',\n';
    output += handleNode(svgNode, discardColors);
    output = `${output.slice(0, -2)}\n`;
    return output;
}
function validateAttributes(svgNode) {
    const { properties } = svgNode;
    if (!properties)
        return;
    for (let propName in properties) {
        if (svgNode.tagName && SUPPORTED_ATTRIBUTES.hasOwnProperty(svgNode.tagName)) {
            const supportedNodeAttributes = [
                ...SUPPORTED_ATTRIBUTES.generic,
                ...SUPPORTED_ATTRIBUTES[svgNode.tagName],
            ];
            if (!supportedNodeAttributes.includes(propName)) {
                throw new Error(`Unsupported property in <${svgNode.tagName}> element: ${propName}`);
            }
        }
        else {
            if (!SUPPORTED_ATTRIBUTES.generic.includes(propName)) {
                throw new Error(`Unsupported property in <${svgNode.tagName}> element: ${propName}`);
            }
        }
        const propValue = properties[propName];
        if (propValue && typeof propValue === 'string' && propValue.slice(-1) === '%') {
            throw new Error(`Percentage values are not supported in <${svgNode.tagName}> ${propName} property`);
        }
    }
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
function parseColorData(svgColorString, inheritedColorData = undefined, discardColors = false) {
    if (svgColorString === 'none' || svgColorString === 'currentColor') {
        return svgColorString;
    }
    if (typeof svgColorString === 'string') {
        const color = colorString.get.rgb(svgColorString);
        if (color) {
            if (!discardColors) {
                return color;
            }
        }
        else {
            throw new Error(`Invalid color value: ${svgColorString}`);
        }
    }
    else if (svgColorString !== undefined) {
        throw new Error(`Invalid color value: ${svgColorString}`);
    }
    return inheritedColorData || undefined;
}
function createColorCommand(colorData) {
    if (colorData && colorData !== 'none' && colorData !== 'currentColor') {
        let hexColor = colorString.to.hex(colorData);
        if (hexColor.length === 7) {
            hexColor += 'FF';
        }
        const [_o, r1, r2, g1, g2, b1, b2, a1, a2] = hexColor;
        return `PATH_COLOR_ARGB, 0x${a1 + a2}, 0x${r1 + r2}, 0x${g1 + g2}, 0x${b1 + b2},\n`;
    }
    return '';
}
function parseStrokeData(svgElement, inheritedStrokeData = undefined, discardColors = false) {
    const { properties } = svgElement;
    if (!properties) {
        return inheritedStrokeData;
    }
    const color = parseColorData(properties.stroke, inheritedStrokeData === null || inheritedStrokeData === void 0 ? void 0 : inheritedStrokeData.color, discardColors);
    let width = inheritedStrokeData === null || inheritedStrokeData === void 0 ? void 0 : inheritedStrokeData.width;
    const strokeWidth = properties['stroke-width'];
    if (typeof strokeWidth === 'string') {
        if (strokeWidth) {
            if (strokeWidth.includes('%')) {
                throw new Error('Percentage values are not supported for stroke-width');
            }
            width = parseFloat(strokeWidth);
        }
    }
    else if (typeof strokeWidth === 'number') {
        width = strokeWidth;
    }
    if (width !== width || (typeof width === 'number' && width < 0)) {
        throw new Error(`Invalid stroke-width value: ${width}`);
    }
    let linecap = inheritedStrokeData === null || inheritedStrokeData === void 0 ? void 0 : inheritedStrokeData.linecap;
    const strokeLinecap = properties['stroke-linecap'];
    if (strokeLinecap === 'round' || strokeLinecap === 'square') {
        linecap = strokeLinecap;
    }
    else if (strokeLinecap) {
        throw new Error(`Invalid stroke-linecap value: ${strokeLinecap}`);
    }
    return {
        color,
        width,
        linecap,
    };
}
function createStrokeCommand(svgNode, strokeData) {
    let strokeOutput = '';
    strokeOutput += createColorCommand(strokeData.color);
    const { width = 1 } = strokeData;
    strokeOutput += `STROKE, ${num2str(width)},\n`;
    if (svgNode.tagName === 'path' || svgNode.tagName === 'line') {
        if (!strokeData.linecap) {
            throw new Error('You must specify stroke-linecap to be either "round" or "square" for paths and lines if you use stroke');
        }
        if (strokeData.linecap === 'square') {
            strokeOutput += `CAP_SQUARE,\n`;
        }
    }
    return strokeOutput;
}
function handleNode(svgNode, discardColors = false, inheritedFillColorData = undefined, inheritedStrokeData = undefined) {
    let nodeOutput = '';
    svgNode.children.forEach((svgChildNode) => {
        var _a, _b, _c;
        if (typeof svgChildNode === 'string' || svgChildNode.type === 'text') {
            throw new Error('Detected a text string within the SVG, which is not supported.');
        }
        validateAttributes(svgChildNode);
        let shapeOutput = '';
        const shapeFillData = parseColorData((_a = svgChildNode.properties) === null || _a === void 0 ? void 0 : _a.fill, inheritedFillColorData, discardColors);
        const shapeStrokeData = parseStrokeData(svgChildNode, inheritedStrokeData, discardColors);
        switch (svgChildNode.tagName) {
            case 'g': {
                nodeOutput += handleNode(svgChildNode, discardColors, shapeFillData, shapeStrokeData);
                break;
            }
            case 'path': {
                const commands = [];
                let pathIsClosed = true;
                let path = typeof ((_b = svgChildNode.properties) === null || _b === void 0 ? void 0 : _b.d) === 'string' ? (_c = svgChildNode.properties) === null || _c === void 0 ? void 0 : _c.d : '';
                path = path.replaceAll(',', ' ').trim();
                if (path.slice(-1).toLowerCase() !== 'z') {
                    pathIsClosed = false;
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
                if (!pathIsClosed) {
                    commands.pop();
                }
                commands.forEach((command) => {
                    shapeOutput += `${toCommand(command.command)}`;
                    command.args.forEach((arg) => (shapeOutput += `, ${num2str(arg)}`));
                    shapeOutput += ',\n';
                });
                break;
            }
            case 'circle': {
                let { cx, cy, r } = svgChildNode.properties || {};
                shapeOutput += `CIRCLE`;
                shapeOutput += `, ${num2str(toFloat(cx))}`;
                shapeOutput += `, ${num2str(toFloat(cy))}`;
                shapeOutput += `, ${num2str(toFloat(r))}`;
                shapeOutput += `,\n`;
                break;
            }
            case 'rect': {
                let { x, y, width, height, rx } = svgChildNode.properties || {};
                shapeOutput += `ROUND_RECT`;
                shapeOutput += `, ${num2str(toFloat(x))}`;
                shapeOutput += `, ${num2str(toFloat(y))}`;
                shapeOutput += `, ${num2str(toFloat(width))}`;
                shapeOutput += `, ${num2str(toFloat(height))}`;
                shapeOutput += `, ${num2str(toFloat(rx))}`;
                shapeOutput += `,\n`;
                break;
            }
            case 'ellipse': {
                let { cx, cy, rx, ry } = svgChildNode.properties || {};
                shapeOutput += `OVAL`;
                shapeOutput += `, ${num2str(toFloat(cx))}`;
                shapeOutput += `, ${num2str(toFloat(cy))}`;
                shapeOutput += `, ${num2str(toFloat(rx))}`;
                shapeOutput += `, ${num2str(toFloat(ry))}`;
                shapeOutput += `,\n`;
                break;
            }
            case 'line': {
                let { x1, y1, x2, y2 } = svgChildNode.properties || {};
                shapeOutput += `MOVE_TO`;
                shapeOutput += `, ${num2str(toFloat(x1))}`;
                shapeOutput += `, ${num2str(toFloat(y1))}`;
                shapeOutput += `,\n`;
                shapeOutput += `LINE_TO`;
                shapeOutput += `, ${num2str(toFloat(x2))}`;
                shapeOutput += `, ${num2str(toFloat(y2))}`;
                shapeOutput += `,\n`;
                break;
            }
            default: {
                throw new Error(`Unsupported svg element: <${svgChildNode.tagName}>`);
            }
        }
        if (shapeOutput) {
            if (shapeFillData !== 'none' && svgChildNode.tagName !== 'line') {
                nodeOutput += 'NEW_PATH,\n';
                nodeOutput += createColorCommand(shapeFillData);
                nodeOutput += shapeOutput;
            }
            if (shapeStrokeData &&
                shapeStrokeData.color &&
                shapeStrokeData.color !== 'none' &&
                shapeStrokeData.width !== 0) {
                nodeOutput += 'NEW_PATH,\n';
                nodeOutput += createStrokeCommand(svgChildNode, shapeStrokeData);
                nodeOutput += shapeOutput;
            }
        }
    });
    return nodeOutput;
}

var name = "chromium-icon-tools";
var version = "4.0.0";
var description = "Node.js based chromium devtools for converting SVG files to Skia Vector Icon files and vice versa.";
var keywords = [
	"chromium",
	"svg",
	"icon",
	"skia",
	"vector"
];
var license = "UNLICENSED";
var author = "Ray Systems Ltd.";
var repository = {
	type: "git",
	url: "https://github.com/raybrowser/chromium-icon-tools.git"
};
var type = "module";
var main = "./dist/index.js";
var bin = {
	svg2icon: "./bin/svg2icon-cli.cjs"
};
var files = [
	"bin",
	"src",
	"dist",
	"LICENSE.md",
	"README.md"
];
var targets = {
	main: false
};
var dependencies = {
	"color-string": "1.9.1",
	"svg-parser": "2.0.4"
};
var devDependencies = {
	"@rollup/plugin-json": "5.0.1",
	"@rollup/plugin-typescript": "9.0.2",
	"@types/color-string": "1.5.2",
	"@types/node": "18.11.9",
	"@types/svg-parser": "2.0.3",
	parcel: "2.7.0",
	rimraf: "3.0.2",
	rollup: "3.2.5",
	"rollup-plugin-node-externals": "5.0.1",
	typescript: "4.8.4"
};
var scripts = {
	bundle: "rimraf dist && rimraf bin && npm run rollup-build && npm run parcel-build",
	"parcel-dev": "parcel src/app/index.html -p 3000 --dist-dir parcel-dist --no-autoinstall --open",
	"parcel-build": "parcel build src/app/index.html --dist-dir dist/app",
	"rollup-build": "rollup -c"
};
var pkg = {
	name: name,
	version: version,
	description: description,
	keywords: keywords,
	license: license,
	author: author,
	repository: repository,
	type: type,
	main: main,
	bin: bin,
	files: files,
	targets: targets,
	dependencies: dependencies,
	devDependencies: devDependencies,
	scripts: scripts
};

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
        discardColors: false,
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
        else if (arg == '-d' || arg == '--discard-colors') {
            result.discardColors = true;
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
      -d, --discard-colors : Discard fill and stroke colors (default: no)

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
    const iconData = svg2icon(data, { discardColors: args.discardColors });
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
        console.log(pkg.version);
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
