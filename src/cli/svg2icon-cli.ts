/**
 * Copyright 2022 Ray Systems Ltd. All rights reserved.
 */

/**
 * Original license and copyright:
 * @author zhsoft88 <zhsoft88@icloud.com> (https://github.com/zhsoft88)
 * @copyright © 2019 zhuatang.com
 * @license MIT
 */

import FS from 'fs';
import PATH from 'path';
import { svg2icon } from '../libs/svg2icon';
import pkg from '../../package.json' assert { type: 'json' };

interface ParsedArgs {
  help: boolean;
  version: boolean;
  inputs: { type: string; value: string }[];
  trailings: { type: string; value: string }[];
  outputs: { type: string; value: string; cmdline: string }[];
  quiet: boolean;
  discardColors: boolean;
  stdInData: string;
}

function error(msg: string) {
  console.error(`Error: ${msg}`);
}

function warn(msg: string) {
  console.error(`Warning: ${msg}`);
}

function errorExit(msg: string) {
  error(msg);
  process.exit(1);
}

function isDir(path: string) {
  try {
    return FS.statSync(path).isDirectory();
  } catch (e) {}
  return false;
}

function parseArgs() {
  const result: ParsedArgs = {
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
    } else if (arg == '--version' || arg == '-v') {
      result.version = true;
    } else if (arg == inputPrefix || arg.startsWith(inputPrefix + '=')) {
      if (arg == inputPrefix || arg == inputPrefix + '=')
        errorExit(`no argument specified for ${inputPrefix}`);

      const path = arg.substr(inputPrefix.length + 1);
      result.inputs.push({ type: isDir(path) ? 'd' : 'f', value: path });
    } else if (arg == '-i') {
      i++;
      if (i == process.argv.length) errorExit(`no argument specified for ${arg}`);

      const path = process.argv[i];
      result.inputs.push({ type: isDir(path) ? 'd' : 'f', value: path });
    } else if (arg == outputPrefix || arg.startsWith(outputPrefix + '=')) {
      if (arg == outputPrefix || arg == outputPrefix + '=')
        errorExit(`no argument specified for ${outputPrefix}`);

      const path = arg.substr(outputPrefix.length + 1);
      result.outputs.push({ type: isDir(path) ? 'd' : 'f', value: path, cmdline: arg });
    } else if (arg == '-o') {
      i++;
      if (i == process.argv.length) errorExit(`no argument specified for ${arg}`);

      const path = process.argv[i];
      result.outputs.push({ type: isDir(path) ? 'd' : 'f', value: path, cmdline: `-o ${path}` });
    } else if (arg == '-q' || arg == '--quiet') {
      result.quiet = true;
    } else if (arg == '-d' || arg == '--discard-colors') {
      result.discardColors = true;
    } else {
      // take all trailing arguments
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
  console.log(
    `Node.js based chromium devtools for converting SVG files to Skia Vector Icon files

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
    `
  );
}

function helpExit() {
  usage();
  process.exit(0);
}

function findAllFilesInDir(dir: string, ext: string) {
  function impl(dir: string, ext: string, result: string[]) {
    for (const name of FS.readdirSync(dir)) {
      const path = PATH.join(dir, name);
      if (FS.statSync(path).isDirectory()) {
        impl(path, ext, result);
      } else if (!ext || name.endsWith(ext)) {
        result.push(path);
      }
    }
  }
  const result: string[] = [];
  impl(dir, ext, result);
  for (let i = 0; i < result.length; i++) {
    result[i] = PATH.relative(dir, result[i]);
  }
  return result;
}

function mkdirP(parentDir: string, childDir: string) {
  const list = childDir.split(PATH.sep);
  let path = '';
  for (const item of list) {
    if (path) {
      path = PATH.join(path, item);
    } else {
      path = item;
    }
    const target = PATH.join(parentDir, path);
    if (isDir(target)) continue;

    try {
      FS.mkdirSync(target);
    } catch (e) {
      error(`mkdir ${target} failed, reason: ${e}`);
      return false;
    }
  }
  return true;
}

function svg2IconWrite(args: ParsedArgs, source: string, target: string, data: string) {
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
  } catch (e) {
    error(`write ${target} failed, reason: ${e}, source: ${source}`);
  }
}

function processFile(args: ParsedArgs, source: string, target: string) {
  if (source == '-') {
    const data = args.stdInData;
    svg2IconWrite(args, source, target, data);
  } else {
    try {
      const data = FS.readFileSync(source, 'utf8');
      svg2IconWrite(args, source, target, data);
    } catch (e) {
      error(`read failed, file: ${source}, reason: ${e}`);
    }
  }
}

function processFiles(
  args: ParsedArgs,
  files: string[],
  fromDir: string,
  targetDir: string,
  createDir = false
) {
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

function genIconFile(file: string) {
  if (file == '-') return file;

  let result = file;
  let index = result.lastIndexOf('.');
  if (index != -1) {
    result = result.substr(0, index);
  }
  result += '.icon';
  return result;
}

function processOne(
  args: ParsedArgs,
  input: ParsedArgs['inputs'][number],
  output?: ParsedArgs['outputs'][number] | null
) {
  if (input.type == 'd') {
    // dir input
    const fromDir = input.value;
    const files = findAllFilesInDir(fromDir, '.svg');
    if (files.length == 0) return;

    if (output) {
      if (output.type == 'd') {
        processFiles(args, files, fromDir, output.value, true);
      } else {
        // convert the first one to target file
        {
          const file = files[0];
          files.splice(0, 1);
          const source = PATH.join(fromDir, file);
          processFile(args, source, output.value);
        }

        processFiles(args, files, fromDir, fromDir);
      }
    } else {
      processFiles(args, files, fromDir, fromDir);
    }
  } else {
    // file input
    if (output) {
      if (output.type == 'd') {
        // adjust output to stdout when input from stdio and output to folder
        const target =
          input.value == '-'
            ? '-'
            : PATH.join(output.value, genIconFile(PATH.basename(input.value)));
        processFile(args, input.value, target);
      } else {
        processFile(args, input.value, output.value);
      }
    } else {
      const target = genIconFile(input.value);
      processFile(args, input.value, target);
    }
  }
}

function doWork(args: ParsedArgs) {
  // make input/output pairs
  const pairsLen = Math.min(args.inputs.length, args.outputs.length);
  const pairInputs = args.inputs.splice(0, pairsLen);
  const pairOutputs = args.outputs.splice(0, pairsLen);

  // remove trailing outputs after first folder, make first folder as default output folder
  let defaultOutputFolder: ParsedArgs['outputs'][number] | null = null;
  let ignoreOutputs: ParsedArgs['outputs'] = [];
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

  // process input/output pairs
  for (let i = 0; i < pairsLen; i++) {
    processOne(args, pairInputs[i], pairOutputs[i]);
  }

  // process other inputs
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

  function hasStdIn(list: ParsedArgs['inputs'] | ParsedArgs['trailings']) {
    for (const item of list) {
      if (item.value == '-') return true;
    }
    return false;
  }

  if (hasStdIn(args.inputs) || hasStdIn(args.trailings)) {
    // read stdin first
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
  } else {
    doWork(args);
  }
}

run();
