# Chromium Icon Tools

Node.js based Chromium devtools for converting SVG files to Skia Vector Icon files and vice versa.

**Important note:** Transforming `.icon` files to `.svg` files is WIP and only working in browsers at the moment. Node.js and CLI support might be added at some point if necessary.

## svg2icon

`svg2icon` is a utility function that transforms `.svg` file data into `.icon` file data. Note that only a handful of SVG elements/attributes are supported and the function will (try it's best to) throw an error if the transformed SVG contains unsupported elements/attributes. The library follows SVG spec as accurately as possible so that all valid `.svg` inputs would produce visually identical `.icon` outputs.

### Install

```sh
$ npm install raybrowser/chromium-icon-tools
```

### Usage

```ts
import { svg2icon } from 'chromium-icon-tools';

const svgString = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="50" fill="green" />
</svg>
`;

const iconString = svg2icon(svgString);
// CANVAS_DIMENSIONS, 100,
// NEW_PATH,
// PATH_COLOR_ARGB, 0xFF, 0x00, 0x80, 0x00,
// CIRCLE, 50, 50, 50

// You can also make the transform discard the SVG file's fill/stroke color
// info.
const iconString = svg2icon(svgString, { discardColors: true });
// CANVAS_DIMENSIONS, 100,
// NEW_PATH,
// CIRCLE, 50, 50, 50
```

### Caveats

- Only supports a handful of SVG elements and attributes.
  - Elements: `<svg>`, `<g>`, `<path>`, `<circle>`, `<rect>`, `<ellipse>`, `<line>`.
  - Generic attributes: `fill`, `stroke`, `stroke-width`, `stroke-linecap`.
  - `<path>` attributes: `d`.
  - `<circle>` attributes: `cx`, `cy`, `r`.
  - `<rect>` attributes: `x`, `y`, `width`, `height`, `rx`.
  - `<ellipse>` attributes: `cx`, `cy`, `rx`, `ry`.
  - `<line>` attributes: `x1`, `y1`, `x2`, `y2`.
- Percentage based attribute values are not supported.
- Chromium's vector icon format needs to kno the _size_ of the canvas where the icon is drawn, but it only allows for a single value so width and height must always be equal in the SVG icon. You can provide the width and height either via `viewBox` attribute or via `width` and `height` attributes in the `<svg>` element. 
- Chromium's vector icon format does not support "butt" styled stroke linecap which is SVGs default linecap type. To work around this issue you must specify stroke-linecap to be either "round" or "square" for `<path>`s and `<line>`s if you define a stroke.
- Always outputs `CANVAS_SIZE` even if it could be omitted (at size 48). This is a design choice, not a bug.
- Always outputs `NEW_PATH` at the start of a new path/shape although it _could_ be omitted for the first path. This is a design choice, not a bug.

### Tips and tricks

- You _can_ use `fill`, `stroke`, `stroke-width` and `stroke-linecap` attributes in `<g>` elements and their values should propagate down to the descendants just like in SVGs.
- If an element's `fill` value is `"none"` it's fill command will be omitted from the output.
- If an element's `stroke-width` is `0` it's stroke command will be omitted from the output.
- Use `"currentColor"` value for `fill` and/or `stroke` attributes if you want to output fill and stroke commands without color information.

## svg2icon CLI

`svg2icon` utility is also available as a CLI tool.

### Install

```sh
$ [sudo] npm install -g raybrowser/chromium-icon-tools
```

### Usage

```sh
$ svg2icon [OPTIONS] [ARGS]
```

### Options

- `-h`, `--help`: Print help.
- `-v`, `--version`: Print version.
- `-i INPUT`, `--input=INPUT`: Input file or folder, "-" for STDIN (for folder, convert all _.svg files to _.icon files).
- `-o OUTPUT`, `--output=OUTPUT`: Output file or folder, "-" for STDOUT.
- `-q`, `--quiet`: Only show error messages.
- `-d`, `--discard-colors`: Discard SVG fill and stroke colors (default: no).

### Arguments

- INPUT : Alias to --input

### Examples

- **With files:**

  Convert `a.svg` to `a.icon` and `b.svg` to `b.icon`.

  ```sh
  $ svg2icon a.svg b.svg
  ```

  Convert `foo.svg` to `bar.icon`.

  ```sh
  $ svg2icon -i foo.svg -o bar.icon
  ```

  Convert all `.svg` files to `.icon` files and output the icon files to folder `/tmp/myfolder`.

  ```sh
  $ svg2icon -o /tmp/myfolder *.svg
  ```

- **With folders:**

  Convert all `.svg` files in `/tmp/myfolder` folder.

  ```sh
  $ svg2icon /tmp/myfolder
  # OR
  $ svg2icon -i /tmp/myfolder
  ```

  Convert all `.svg` files in `/tmp/myfolder` folder and output the icon files to `/path/to/yourfolder` folder.

  ```sh
  $ svg2icon -i /tmp/myfolder -o /path/to/yourfolder
  ```

- **With STDIN / STDOUT:**

  Read svg from pipe and output to /tmp/a.icon.

  ```sh
  $ cat a.svg | svg2icon >/tmp/a.icon
  # OR
  $ svg2icon -o /tmp/a.icon < a.svg
  ```

  Read from stdin and output to /tmp/a.icon.

  ```sh
  $ svg2icon -o /tmp/a.icon -
  # OR
  $ svg2icon -i - -o /tmp/a.icon
  ```

## Credits

This library is built on top of the following awesome libraries/tools:

- https://github.com/evanstade/skiafy
- https://github.com/zhsoft88/skiafy
- https://github.com/michaelwasserman/vector-icon-app
- https://github.com/sadrulhc/vector-icons
