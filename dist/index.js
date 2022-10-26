import { parse } from 'svg-parser';
import rgba from 'color-rgba';

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

function svg2icon(svgString, options = {}) {
    var _a, _b, _c;
    const { scaleX = 1, scaleY = 1, translateX = 0, translateY = 0, preserveFill = true } = options;
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

export { icon2svg, svg2icon };
