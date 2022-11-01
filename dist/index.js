import { parse } from 'svg-parser';
import colorString from 'color-string';

/**
 * @author Michael Wasserman
 * @copyright Michael Wasserman 2018
 * @license MIT https://github.com/michaelwasserman/vector-icon-app/blob/main/LICENSE
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

function notimplemented(msg) {
  console.log('notimplemented(vector-icon): ' + msg);
}

class VectorIcon {
  constructor(commands, delegate) {
    this.commands_ = commands;
    this.delegate_ = delegate;
    this.svg_ = null;
    this.paths_ = [];
    this.currentPath_ = null;
    this.pathD_ = [];
    this.clipRect_ = null;
  }

  paint() {
    var ncmds = this.commands_.length;
    this.svg_ = document.createElementNS(SVG_NS, 'svg');
    this.svg_.setAttribute('width', '48');
    this.svg_.setAttribute('height', '48');
    this.svg_.setAttribute('fill-rule', 'evenodd');
    this.svg_.classList.add('vector-svg');
    this.currentPath_ = this.createPath();
    for (var i = 0; i < ncmds; ++i) {
      if (this.commands_[i][0] == 'END') break;
      this.processCommand(this.commands_[i]);
    }
    if (this.pathD_.length > 0) this.currentPath_.setAttribute('d', this.pathD_.join(' '));

    // Just set the clip-path on all paths, I guess?
    if (this.clipRect_) {
      var clipPath = document.createElementNS(SVG_NS, 'clipPath');
      clipPath.setAttribute('id', 'clip-path');
      this.svg_.appendChild(clipPath);

      var rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', this.clipRect_[0]);
      rect.setAttribute('y', this.clipRect_[1]);
      rect.setAttribute('width', this.clipRect_[2]);
      rect.setAttribute('height', this.clipRect_[3]);
      clipPath.appendChild(rect);

      this.paths_.forEach((path) => path.setAttribute('clip-path', 'url(#clip-path)'));
    }

    // Add all the paths.
    var svg = this.svg_;
    this.paths_.forEach((path) => svg.appendChild(path));
    return this.svg_;
  }

  closeCurrentPath() {
    if (this.currentPath_) {
      this.currentPath_.setAttribute('d', this.pathD_.join(' '));
      this.pathD_ = [];
      this.currentPath_ = null;
    }
  }

  createPath() {
    this.closeCurrentPath();
    var path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('fill', 'gray');
    path.setAttribute('stroke', 'gray');
    path.setAttribute('stroke-width', '0px');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('shape-rendering', 'geometricPrecision');
    this.paths_.push(path);
    return path;
  }

  createCircle(params) {
    var cx = parseFloat(params[0]);
    var cy = parseFloat(params[1]);
    var r = parseFloat(params[2]);
    var cmds = [
      ['M', cx, cy],
      ['m', -r, '0'],
      ['a', r, r, 0, 1, 0, r * 2, 0],
      ['a', r, r, 0, 1, 0, -r * 2, 0],
    ];
    cmds.forEach((cmd) => this.pathD_.push(cmd.join(' ')));
  }

  createRoundRect(params) {
    var x = parseFloat(params[0]);
    var y = parseFloat(params[1]);
    var width = parseFloat(params[2]);
    var height = parseFloat(params[3]);
    var rx = parseFloat(params[4]);
    // We can probably not add the arcs if rx == 0?
    var cmds = [
      ['M', x + rx, y],
      ['h', width - rx - rx],
      ['a', rx, rx, 0, 0, 1, rx, rx],
      ['v', height - rx - rx],
      ['a', rx, rx, 0, 0, 1, -rx, rx],
      ['h', -(width - rx - rx)],
      ['a', rx, rx, 0, 0, 1, -rx, -rx],
      ['v', -(height - rx - rx)],
      ['a', rx, rx, 0, 0, 1, rx, -rx],
    ];
    cmds.forEach((cmd) => this.pathD_.push(cmd.join(' ')));
  }

  processCommand(cmd) {
    if (cmd[0] == 'CANVAS_DIMENSIONS') {
      this.svg_.setAttribute('width', cmd[1]);
      this.svg_.setAttribute('height', cmd[1]);
      return;
    }

    if (cmd[0] == 'NEW_PATH') {
      this.currentPath_ = this.createPath();
      return;
    }

    if (cmd[0] == 'PATH_COLOR_ARGB') {
      var color =
        'rgba(' + [cmd[2], cmd[3], cmd[4], cmd[1]].map((x) => parseInt(x)).join(',') + ')';
      this.currentPath_.style['fill'] = color;
      this.currentPath_.style['stroke'] = color;
      return;
    }

    if (cmd[0] == 'PATH_MODE_CLEAR') {
      // XXX: what do?
      notimplemented(cmd[0]);
      return;
    }

    if (cmd[0] == 'STROKE') {
      this.currentPath_.setAttribute('stroke-width', cmd[1] + 'px');
      return;
    }

    if (cmd[0] == 'CAP_SQUARE') {
      this.currentPath_.style['stroke-linecap'] = 'square';
      return;
    }

    if (cmd[0] == 'DISABLE_AA') {
      this.currentPath_.setAttribute('shape-rendering', 'crispEdges');
      return;
    }

    if (cmd[0] == 'CLIP') {
      this.clipRect_ = cmd.splice(1).map((x) => x.trim() + 'px');
      return;
    }

    if (cmd[0] == 'CIRCLE') {
      this.createCircle(cmd.splice(1));
      return;
    }

    if (cmd[0] == 'ROUND_RECT') {
      this.createRoundRect(cmd.splice(1));
      return;
    }

    if (cmd[0] == '//') {
      console.log('COMMENT');
      return;
    }

    var drawCommands = {
      MOVE_TO: 'M',
      R_MOVE_TO: 'm',
      ARC_TO: 'A',
      R_ARC_TO: 'a',
      LINE_TO: 'L',
      R_LINE_TO: 'l',
      H_LINE_TO: 'H',
      R_H_LINE_TO: 'h',
      V_LINE_TO: 'V',
      R_V_LINE_TO: 'v',
      CUBIC_TO: 'C',
      R_CUBIC_TO: 'c',
      CUBIC_TO_SHORTHAND: 'S',
      CLOSE: 'Z',
    };
    if (cmd[0] in drawCommands) {
      var nc = [drawCommands[cmd[0]]].concat(cmd.splice(1).map(parseFloat));
      this.pathD_.push(nc.join(' '));
      return;
    }

    notimplemented(cmd.join(','));
  }
}

function icon2svg(input) {
  var lines = input.split('\n').filter((line) => line.length && !line.startsWith('//'));
  var commands = lines.map((line) =>
    line
      .trim()
      .split(',')
      .filter((x) => x.length > 0)
  );

  var svg = new VectorIcon(commands).paint();
  var svgSource = new XMLSerializer().serializeToString(svg);

  return svgSource;
}

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
    const svgRoot = parse(svgString);
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

export { icon2svg, svg2icon };
