// Copyright 2021 The Skiafy Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Skia docs at:
// https://source.chromium.org/chromium/chromium/src/+/main:ui/gfx/vector_icon_types.h;l=6?q=vector_icon_types&sq=&ss=chromium
// TODO: Implement STROKE, CAP_SQUARE, DISABLE_AA

import { parse, ElementNode } from 'svg-parser';
import rgba from 'color-rgba';

type Svg2IconOptions = {
  scaleX?: number;
  scaleY?: number;
  translateX?: number;
  translateY?: number;
  preserveFill?: boolean;
};

export function svg2icon(svgString: string, options: Svg2IconOptions = {}) {
  const { scaleX = 1, scaleY = 1, translateX = 0, translateY = 0, preserveFill = true } = options;

  // Generate abstract syntax tree from the svg string.
  const svgRoot = parse(svgString);
  const svgNode = svgRoot.children[0];

  if (typeof svgNode === 'string' || svgNode.type === 'text') {
    throw new Error('Detected a text string within the SVG, which is not supported.');
  }

  // Inject generated ICON string here, piece by piece.
  let output = '';

  // Parse canvas width/height (prefer viewbox).
  let width = 0;
  let height = 0;
  if (typeof svgNode.properties?.viewBox === 'string') {
    width = parseInt(svgNode.properties.viewBox.split(' ')[3]) || 0;
    height = parseInt(svgNode.properties.viewBox.split(' ')[4]) || 0;
  } else {
    width = parseInt(`${svgNode.properties?.width}`) || 0;
    height = parseInt(`${svgNode.properties?.height}`) || 0;
  }

  // Width and height must both be positive.
  if (width === 0 || height === 0) {
    throw new Error('<svg> width and/or height could not be parsed');
  }

  // Width and height must both be same size.
  if (width !== height) {
    throw new Error('<svg> width and height must be equal in order to produce accurate conversion');
  }

  // We only need to define the CANVAS_DIMENSIONS if it is not 48.
  if (width !== 48) {
    output += 'CANVAS_DIMENSIONS, ' + width + ',\n';
  }

  // Recurse through the svg node.
  output += handleNode(svgNode, scaleX, scaleY, translateX, translateY, preserveFill);

  // Truncate final comma and newline.
  output = output.slice(0, -2);

  // Add new line.
  output += '\n';

  return output;
}

//
// UTILS
//

function toCommand(letter: string) {
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

function lengthForSvgDirective(letter: string) {
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

function toFloat(val: string | number | undefined) {
  return val === undefined ? 0 : parseFloat(`${val}`) || 0;
}

function isFloat(val: string | number) {
  return typeof val == 'number' && (val * 10) % 10 != 0;
}

function num2str(val: number) {
  return isFloat(val) ? `${val}f` : `${val}`;
}

function roundToHundredths(x: number) {
  return Math.floor(x * 100 + 0.5) / 100;
}

function componentToHex(c: number) {
  const hex = c.toString(16);
  return (hex.length == 1 ? '0' + hex : hex).toUpperCase();
}

function parsePathColorCommand(svgElement: ElementNode) {
  const fill = svgElement.properties?.fill;
  if (typeof fill !== 'string') {
    return '';
  }

  const color = rgba(fill);
  if (color) {
    const [r, g, b, a] = color;
    return `PATH_COLOR_ARGB, 0x${componentToHex((a * 255) | (1 << 8))}, 0x${componentToHex(
      r
    )}, 0x${componentToHex(g)}, 0x${componentToHex(b)},\n`;
  }

  return '';
}

function handleNode(
  svgNode: ElementNode,
  scaleX = 1,
  scaleY = 1,
  translateX = 0,
  translateY = 0,
  preserveFill = true,
  inheritedFillCommand = ''
) {
  let output = '';

  svgNode.children.forEach((svgChildNode) => {
    if (typeof svgChildNode === 'string' || svgChildNode.type === 'text') {
      throw new Error('Detected a text string within the SVG, which is not supported.');
    }

    const fillCommand = preserveFill
      ? parsePathColorCommand(svgChildNode) || inheritedFillCommand
      : '';

    switch (svgChildNode.tagName) {
      // TODO: If g has fill color pass it down to children!
      case 'g': {
        if (svgChildNode.properties?.transform) {
          // TODO: We should be able to handle translates in transforms.
          throw new Error('<g> with a transform not handled');
        } else {
          output += handleNode(
            svgChildNode,
            scaleX,
            scaleY,
            translateX,
            translateY,
            preserveFill,
            fillCommand
          );
        }

        break;
      }

      case 'path': {
        // Let's ignore all elements with explicit fill="none". Use
        // fill="currentColor" to render the element without color.
        if (svgChildNode.properties?.fill === 'none') {
          break;
        }

        const commands: { command: string; args: number[] }[] = [];

        let path = typeof svgChildNode.properties?.d === 'string' ? svgChildNode.properties?.d : '';
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
          } else {
            let currentCommand = commands[commands.length - 1];
            let svgDirective = currentCommand.command;

            // Repeated sets of arguments imply the command is repeated, unless the current
            // command is moveto, which implies that the rest are implicitly linetos.
            if (currentCommand.args.length == lengthForSvgDirective(svgDirective)) {
              if (svgDirective == 'm') {
                svgDirective = 'l';
              } else if (svgDirective == 'M') {
                svgDirective = 'L';
              }

              commands.push({ command: svgDirective, args: [] });
              currentCommand = commands[commands.length - 1];
              svgDirective = currentCommand.command;
            }

            let pathNeedsPruning = true;
            if (
              svgDirective.toLowerCase() == 'a' &&
              currentCommand.args.length >= 3 &&
              currentCommand.args.length <= 4
            ) {
              point = parseInt(path[0]);
              if (point == 0 || point == 1) {
                path = path.substr(1);
                pathNeedsPruning = false;
              } else {
                throw new Error(`Unexpected arc argument: ${point}`);
              }
            }

            // Insert implicit points for cubic and quadratic curves.
            const isQuadraticOrCubic =
              svgDirective.toLowerCase() == 's' || svgDirective.toLowerCase() == 't';
            if (isQuadraticOrCubic && currentCommand.args.length == 0) {
              if (svgDirective == 's' || svgDirective == 't') {
                const lastCommand = commands[commands.length - 2];
                // Make sure relative 's' directives can only match with
                // previous cubic commands, and that relative 't' directives can
                // only match with previous quadratic commands.
                if (
                  (svgDirective == 's' &&
                    toCommand(lastCommand.command).indexOf('CUBIC_TO') >= 0) ||
                  (svgDirective == 't' &&
                    toCommand(lastCommand.command).indexOf('QUADRATIC_TO') >= 0)
                ) {
                  // The first control point is assumed to be the reflection of
                  // the last control point on the previous command relative
                  // to the current point.
                  const argsLength = lastCommand.args.length;
                  currentCommand.args.push(
                    roundToHundredths(
                      lastCommand.args[argsLength - 2] - lastCommand.args[argsLength - 4]
                    )
                  );
                  currentCommand.args.push(
                    roundToHundredths(
                      lastCommand.args[argsLength - 1] - lastCommand.args[argsLength - 3]
                    )
                  );
                } else {
                  // If there is no previous command or if the previous command
                  // was not an C, c, S or s for cubics, or Q, q, T, t for
                  // quadratics, assume the first control point is coincident with
                  // the current point.
                  currentCommand.args.push(0);
                  currentCommand.args.push(0);
                }
              }
            }

            // Whether to apply flipping and translating transforms to the
            // argument. Only the last two arguments (out of 7) in an arc
            // command are coordinates.
            let transformArg = true;
            // xAxis is true when the current coordinate refers to the xAxis.
            let xAxis = currentCommand.args.length % 2 == 0;
            if (svgDirective.toLowerCase() == 'a') {
              if (currentCommand.args.length < 5) {
                transformArg = false;
              }
              xAxis = currentCommand.args.length % 2 == 1;
            } else if (svgDirective.toLowerCase() == 'v') {
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
                if (i == 0 && path[i] == '-') continue;
                if (!isNaN(parseInt(path[i]))) continue;
                if (path[i] == '.' && ++dotsSeen == 1) continue;

                path = path.substr(i);
                break;
              }
            }
          }

          path = path.trim();
        }

        output += 'NEW_PATH,\n';
        output += fillCommand;

        // Write the path commands to the output.
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
        // Let's ignore all elements with explicit fill="none". Use
        // fill="currentColor" to render the element without color.
        if (svgChildNode.properties?.fill === 'none') {
          break;
        }

        output += 'NEW_PATH,\n';
        output += fillCommand;

        let cx = toFloat(svgChildNode.properties?.cx);
        cx *= scaleX;
        cx += translateX;

        let cy = toFloat(svgChildNode.properties?.cy);
        cy *= scaleY;
        cy += translateY;

        const rad = toFloat(svgChildNode.properties?.r);

        output = `CIRCLE, ${num2str(cx)}, ${num2str(cy)}, ${num2str(rad)},\n`;

        break;
      }

      case 'rect': {
        // Let's ignore all elements with explicit fill="none". Use
        // fill="currentColor" to render the element without color.
        if (svgChildNode.properties?.fill === 'none') {
          break;
        }

        output += 'NEW_PATH,\n';
        output += fillCommand;

        let x = toFloat(svgChildNode.properties?.x);
        x *= scaleX;
        x += translateX;

        let y = toFloat(svgChildNode.properties?.y);
        y *= scaleY;
        y += translateY;

        const width = toFloat(svgChildNode.properties?.width);
        const height = toFloat(svgChildNode.properties?.width);
        const rx = toFloat(svgChildNode.properties?.rx);

        output = `ROUND_RECT, ${num2str(x)}, ${num2str(y)}, ${num2str(width)}, ${num2str(
          height
        )}, ${num2str(rx)},\n`;

        break;
      }

      case 'ellipse': {
        // Let's ignore all elements with explicit fill="none". Use
        // fill="currentColor" to render the element without color.
        if (svgChildNode.properties?.fill === 'none') {
          break;
        }

        output += 'NEW_PATH,\n';
        output += fillCommand;

        let cx = toFloat(svgChildNode.properties?.cx);
        cx *= scaleX;
        cx += translateX;

        let cy = toFloat(svgChildNode.properties?.cy);
        cy *= scaleY;
        cy += translateY;

        const rx = toFloat(svgChildNode.properties?.rx);
        const ry = toFloat(svgChildNode.properties?.ry);

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
