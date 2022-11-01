/**
 * Copyright 2022 Ray Systems Ltd. All rights reserved.
 */

// Original license and copyright:
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

// Skia vector icon docs at:
// https://source.chromium.org/chromium/chromium/src/+/main:ui/gfx/vector_icon_types.h;l=6?q=vector_icon_types&sq=&ss=chromium

import { parse, ElementNode } from 'svg-parser';
import colorString from 'color-string';

type Svg2IconOptions = {
  discardColors?: boolean;
};
type RGBAData = [number, number, number, number];
type SVGColorData = RGBAData | 'none' | 'currentColor' | undefined;
type StrokeData = {
  color: SVGColorData;
  width: number | undefined;
  linecap: 'round' | 'square' | undefined;
};

const SUPPORTED_ATTRIBUTES = {
  generic: ['fill', 'stroke', 'stroke-width', 'stroke-linecap'],
  path: ['d'],
  circle: ['cx', 'cy', 'r'],
  rect: ['x', 'y', 'width', 'height', 'rx'],
  ellipse: ['cx', 'cy', 'rx', 'ry'],
  line: ['x1', 'y1', 'x2', 'y2'],
};

export function svg2icon(svgString: string, options: Svg2IconOptions = {}) {
  const { discardColors = false } = options;

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
    width = parseInt(svgNode.properties.viewBox.split(' ')[2]) || 0;
    height = parseInt(svgNode.properties.viewBox.split(' ')[3]) || 0;
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

  // Set canvas dimensions.
  output += 'CANVAS_DIMENSIONS, ' + width + ',\n';

  // Recurse through the svg node.
  output += handleNode(svgNode, discardColors);

  // Truncate final comma and ensure newline at the end.
  output = `${output.slice(0, -2)}\n`;

  return output;
}

//
// UTILS
//

function validateAttributes(svgNode: ElementNode) {
  const { properties } = svgNode;
  if (!properties) return;

  for (let propName in properties) {
    // Validate node-specific properties.
    if (svgNode.tagName && SUPPORTED_ATTRIBUTES.hasOwnProperty(svgNode.tagName)) {
      const supportedNodeAttributes = [
        ...SUPPORTED_ATTRIBUTES.generic,
        ...SUPPORTED_ATTRIBUTES[svgNode.tagName as keyof typeof SUPPORTED_ATTRIBUTES],
      ];
      if (!supportedNodeAttributes.includes(propName)) {
        throw new Error(`Unsupported property in <${svgNode.tagName}> element: ${propName}`);
      }
    }
    // Validate generic properties.
    else {
      if (!SUPPORTED_ATTRIBUTES.generic.includes(propName)) {
        throw new Error(`Unsupported property in <${svgNode.tagName}> element: ${propName}`);
      }
    }

    // Make sure the property value is not a percentage value.
    const propValue = properties[propName];
    if (propValue && typeof propValue === 'string' && propValue.slice(-1) === '%') {
      throw new Error(
        `Percentage values are not supported in <${svgNode.tagName}> ${propName} property`
      );
    }
  }
}

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

function parseColorData(
  svgColorString: any,
  inheritedColorData: SVGColorData = undefined,
  discardColors = false
): SVGColorData {
  if (svgColorString === 'none' || svgColorString === 'currentColor') {
    return svgColorString;
  }

  if (typeof svgColorString === 'string') {
    const color = colorString.get.rgb(svgColorString);
    if (color) {
      if (!discardColors) {
        return color;
      }
    } else {
      throw new Error(`Invalid color value: ${svgColorString}`);
    }
  } else if (svgColorString !== undefined) {
    throw new Error(`Invalid color value: ${svgColorString}`);
  }

  return inheritedColorData || undefined;
}

function createColorCommand(colorData: SVGColorData) {
  if (colorData && colorData !== 'none' && colorData !== 'currentColor') {
    let hexColor = colorString.to.hex(colorData);
    // If hex color is missing the alpha value assume it's opaque.
    // colorString library actually outputs the alpha into the hex value only
    // if it's not opaque.
    if (hexColor.length === 7) {
      hexColor += 'FF';
    }
    const [_o, r1, r2, g1, g2, b1, b2, a1, a2] = hexColor;
    return `PATH_COLOR_ARGB, 0x${a1 + a2}, 0x${r1 + r2}, 0x${g1 + g2}, 0x${b1 + b2},\n`;
  }
  return '';
}

function parseStrokeData(
  svgElement: ElementNode,
  inheritedStrokeData: StrokeData | undefined = undefined,
  discardColors = false
): StrokeData | undefined {
  const { properties } = svgElement;

  if (!properties) {
    return inheritedStrokeData;
  }

  //
  // Parse stroke (color).
  //

  const color = parseColorData(properties.stroke, inheritedStrokeData?.color, discardColors);

  //
  // Parse stroke-width.
  //

  let width = inheritedStrokeData?.width;
  const strokeWidth = properties['stroke-width'];
  if (typeof strokeWidth === 'string') {
    if (strokeWidth) {
      if (strokeWidth.includes('%')) {
        throw new Error('Percentage values are not supported for stroke-width');
      }
      width = parseFloat(strokeWidth);
    }
  } else if (typeof strokeWidth === 'number') {
    width = strokeWidth;
  }

  // Make sure width is not NaN nor a negative number.
  if (width !== width || (typeof width === 'number' && width < 0)) {
    throw new Error(`Invalid stroke-width value: ${width}`);
  }

  //
  // Parse stroke-linecap.
  //

  let linecap = inheritedStrokeData?.linecap;
  const strokeLinecap = properties['stroke-linecap'];
  if (strokeLinecap === 'round' || strokeLinecap === 'square') {
    linecap = strokeLinecap;
  } else if (strokeLinecap) {
    throw new Error(`Invalid stroke-linecap value: ${strokeLinecap}`);
  }

  return {
    color,
    width,
    linecap,
  };
}

function createStrokeCommand(svgNode: ElementNode, strokeData: StrokeData) {
  let strokeOutput = '';

  strokeOutput += createColorCommand(strokeData.color);

  const { width = 1 } = strokeData;
  strokeOutput += `STROKE, ${num2str(width)},\n`;

  // Linecap styling is only relevant for paths and lines.
  if (svgNode.tagName === 'path' || svgNode.tagName === 'line') {
    // Let's enforce explicit linecap definition in SVG for paths to make sure
    // that the rendering matches Skia's rendering. Note that SVG defaults to
    // "butt" linecap while Skia defaults to "round".
    if (!strokeData.linecap) {
      throw new Error(
        'You must specify stroke-linecap to be either "round" or "square" for paths and lines if you use stroke'
      );
    }

    if (strokeData.linecap === 'square') {
      strokeOutput += `CAP_SQUARE,\n`;
    }
  }

  return strokeOutput;
}

function handleNode(
  svgNode: ElementNode,
  discardColors = false,
  inheritedFillColorData: SVGColorData = undefined,
  inheritedStrokeData: StrokeData | undefined = undefined
) {
  let nodeOutput = '';

  svgNode.children.forEach((svgChildNode) => {
    if (typeof svgChildNode === 'string' || svgChildNode.type === 'text') {
      throw new Error('Detected a text string within the SVG, which is not supported.');
    }

    // Make sure the SVG node does not have any unsupported SVG attributes.
    validateAttributes(svgChildNode);

    let shapeOutput = '';

    const shapeFillData = parseColorData(
      svgChildNode.properties?.fill,
      inheritedFillColorData,
      discardColors
    );

    const shapeStrokeData = parseStrokeData(svgChildNode, inheritedStrokeData, discardColors);

    // Parse path command.
    switch (svgChildNode.tagName) {
      case 'g': {
        nodeOutput += handleNode(svgChildNode, discardColors, shapeFillData, shapeStrokeData);
        break;
      }

      case 'path': {
        const commands: { command: string; args: number[] }[] = [];

        let pathIsClosed = true;
        let path = typeof svgChildNode.properties?.d === 'string' ? svgChildNode.properties?.d : '';
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

        // Remove auto-added closing command if the original path was not
        // closed. Without this it's impossible to draw lines.
        if (!pathIsClosed) {
          commands.pop();
        }

        // Write the path commands to the output.
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

    // Generate shape's fill and stroke commands.
    if (shapeOutput) {
      // First draw filled shape if applicable.
      if (shapeFillData !== 'none' && svgChildNode.tagName !== 'line') {
        nodeOutput += 'NEW_PATH,\n';
        nodeOutput += createColorCommand(shapeFillData);
        nodeOutput += shapeOutput;
      }

      // Next draw stroked shape if applicable.
      if (
        shapeStrokeData &&
        shapeStrokeData.color &&
        shapeStrokeData.color !== 'none' &&
        shapeStrokeData.width !== 0
      ) {
        nodeOutput += 'NEW_PATH,\n';
        nodeOutput += createStrokeCommand(svgChildNode, shapeStrokeData);
        nodeOutput += shapeOutput;
      }
    }
  });

  return nodeOutput;
}
