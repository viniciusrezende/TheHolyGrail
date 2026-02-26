// To update constant data
// 1. run this script
// 2. yarn install
// 3. yarn build

const fs = require('fs');
const path = require('path');

let ts;
try {
  ts = require('typescript');
} catch (err) {
  console.error('Missing "typescript". Run npm install in the repo root or vendor/d2s first.');
  process.exit(1);
}

// Allow requiring d2s source .ts files without building lib first.
require.extensions['.ts'] = function registerTs(module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2019,
      esModuleInterop: true,
    },
    fileName: filename,
  });
  module._compile(outputText, filename);
};

const D2S_ROOT = path.resolve(__dirname, '..');
const DEFAULT_GAME_DATA = path.join(D2S_ROOT, 'GameData');
const DEFAULT_OUT = path.join(D2S_ROOT, 'src', 'data', 'versions', '105_constant_data.ts');

const REQUIRED = [
  'ItemStatCost.txt',
  'Properties.txt',
  'ItemTypes.txt',
  'Weapons.txt',
  'Armor.txt',
  'Misc.txt',
  'UniqueItems.txt',
  'SetItems.txt',
  'Runes.txt',
  'Gems.txt',
  'MagicPrefix.txt',
  'MagicSuffix.txt',
  'RarePrefix.txt',
  'RareSuffix.txt',
  'skills.txt',
  'SkillDesc.txt',
  'CharStats.txt',
  'PlayerClass.txt',
  'item-gems.json',
  'item-modifiers.json',
  'item-nameaffixes.json',
  'item-names.json',
  'item-runes.json',
  'skills.json',
];

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(dir, entry.name));
}

function buildBuffers(root) {
  const globalDir = path.join(root, 'global');
  const stringsDir = path.join(root, 'local', 'lng', 'strings');
  const files = [...listFiles(globalDir), ...listFiles(stringsDir)];
  const byLowerName = new Map(files.map((file) => [path.basename(file).toLowerCase(), file]));

  const missing = [];
  const buffers = {};
  for (const name of REQUIRED) {
    const file = byLowerName.get(name.toLowerCase());
    if (!file) {
      missing.push(name);
      continue;
    }
    buffers[name] = fs.readFileSync(file, 'utf8');
  }

  return { buffers, missing };
}

function main() {
  const gameDataRoot = path.resolve(process.argv[2] || DEFAULT_GAME_DATA);
  const outFile = path.resolve(process.argv[3] || DEFAULT_OUT);

  const { buffers, missing } = buildBuffers(gameDataRoot);
  if (missing.length) {
    console.error(`Missing required files under ${gameDataRoot}:`);
    for (const name of missing) console.error(`- ${name}`);
    process.exit(1);
  }

  const { readConstantData } = require(path.join(D2S_ROOT, 'src', 'data', 'parser.ts'));
  const constants = readConstantData(buffers);
  const content = `export let constants = \n${JSON.stringify(constants)}\n`;

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, content, 'utf8');

  console.log(`Wrote ${outFile}`);
  console.log(`classes=${constants.classes?.length ?? 0}`);
  console.log(`skills=${constants.skills?.length ?? 0}`);
  console.log(`magical_properties=${constants.magical_properties?.length ?? 0}`);
  console.log(`set_items=${constants.set_items?.length ?? 0}`);
  console.log(`unq_items=${constants.unq_items?.length ?? 0}`);
  console.log(`armor_items=${Object.keys(constants.armor_items || {}).length}`);
  console.log(`weapon_items=${Object.keys(constants.weapon_items || {}).length}`);
  console.log(`other_items=${Object.keys(constants.other_items || {}).length}`);
}

main();
