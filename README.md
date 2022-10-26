# Chromium Icon Tools

Node.js based chromium devtools for converting SVG files to Skia Vector Icon files and vice versa.

## Installation

Install globally to use `svg2icon` CLI command in your terminal.

```sh
$ [sudo] npm install -g raybrowser/chromium-icon-tools
$ svg2icon -i file.svg -o file.icon
```

Install locally to import and use `svg2icon` and `icon2svg` functions within your code:

```sh
$ npm install raybrowser/chromium-icon-tools
```
```js
import { svg2icon, icon2svg } from 'chromium-icon-tools';
```

## svg2icon CLI Usage

```
Usage:
  svg2icon [OPTIONS] [ARGS]

Options:
* -h, --help: Help
* -v, --version : Version
* -i INPUT, --input=INPUT : Input file or folder, "-" for STDIN (for folder, convert all *.svg files to *.icon files)
* -o OUTPUT, --output=OUTPUT : Output file or folder, "-" for STDOUT
* -q, --quiet: Only show error messages
* -c : Output color (default: no)

Arguments:
* INPUT : Alias to --input
```

- With files:

  ```sh
  $ svg2icon a.svg b.svg
  ```

  Output a.icon, b.icon

  ```sh
  $ svg2icon -i a.svg -o test.icon -i b.svg -o /tmp/b.icon some.svg thing.svg
  ```

  Output test.icon, /tmp/b.icon, some.icon and thing.icon

  ```sh
  $ svg2icon -o /tmp/myfolder *.svg
  ```

  Convert all svg files, output icon files to folder /tmp/myfolder

- With folders:

  ```sh
  $ svg2icon /tmp/myfolder
  ```

  or

  ```sh
  $ svg2icon -i /tmp/myfolder
  ```

  Convert all svg files in /tmp/myfolder

  ```sh
  $ svg2icon -i /tmp/myfolder -o /path/to/yourfolder
  ```

  Convert all svg file in /tmp/myfolder and output icon files to /path/to/yourfolder

  ```sh
  $ svg2icon -i a.svg -o test.icon -i b.svg -o /tmp/b.icon some.svg thing.svg
  ```

  Output test.icon, /tmp/b.icon, some.icon and thing.icon

- With STDIN / STDOUT

  ```sh
  $ cat a.svg | svg2icon >/tmp/a.icon
  ```

  ```sh
  $ svg2icon -o /tmp/a.icon < a.svg
  ```

  Read svg from pipe and output to /tmp/a.icon

  ```sh
  $ svg2icon -o /tmp/a.icon -
  ```

  ```sh
  $ svg2icon -i - -o /tmp/a.icon
  ```

  Read from stdin and output to /tmp/a.icon

- With all of above

  ```sh
  $ svg2icon -i a.svg -o aa.icon \
   -i - -o /tmp/stdin.icon \
   -i /tmp/myfolder -o /tmp/yourfolder \
   -o /tmp/outputfoder some.svg /tmp/test.svg
  ```

  ```
  Converts:
    convert a.svg to aa.icon;
    read from stdin and output to /tmp/stdin.icon;
    convert all svg files in /tmp/myfolder and output icon files to /tmp/yourfolder;
    convert some.svg, /tmp/test.svg, output some.icon and test.icon to /tmp/outputfolder;
  ```

- Output path color

  ```sh
  $ svg2icon -c -o - a.svg
  NEW_PATH,
  PATH_COLOR_ARGB, 0xFF, 0xFF, 0xAA, 0x00,
  CIRCLE, 11.5, 11.5, 1.5
  ```

## Built on top of these tools

- https://github.com/evanstade/skiafy
- https://github.com/zhsoft88/skiafy
- https://github.com/michaelwasserman/vector-icon-app
