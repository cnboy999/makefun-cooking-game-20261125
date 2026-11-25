// Sizzle & Serve: Wok Rush — hand-in program (Node 22, stdlib only).
//
// The grader runs this file as `node main.ts` with MAKEFUN_OUTPUT_DIR set
// to an empty directory. It hands the game in by copying the playable
// static files (game/) and the screenshots into that directory and writing
// dossier.json, the summary the judge reads, built by make.fun's vendored
// library from the very files it just copied.
//
// Run it locally the same way the grader does:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The caps the scorer enforces: 3-4 screenshots of at most 256 KiB each,
// game/ at most 993 files and 48 MiB, and the dossier text at 160 KiB.
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function mustExist(path, what) {
  if (!existsSync(path)) throw new Error(`missing ${what}: ${path}`);
}

function listFiles(dir) {
  return readdirSync(dir).filter((name) => !name.startsWith('.'));
}

function main() {
  const gameDir = join(here, 'game');
  const shotsDir = join(here, 'screenshots');
  mustExist(join(gameDir, 'index.html'), 'game/index.html');
  mustExist(shotsDir, 'screenshots/');

  // The scorer caps game/index.html at 1 MiB.
  const indexBytes = statSync(join(gameDir, 'index.html')).size;
  if (indexBytes > 1048576) {
    throw new Error(`game/index.html is ${indexBytes} bytes, over the 1 MiB cap`);
  }

  const shots = listFiles(shotsDir);
  if (shots.length < 3 || shots.length > 4) {
    throw new Error(`screenshots/ must hold 3 or 4 images, found ${shots.length}`);
  }
  for (const name of shots) {
    const bytes = statSync(join(shotsDir, name)).size;
    if (bytes > CAPS.screenshots.max_bytes) {
      throw new Error(`screenshot ${name} is ${bytes} bytes, over the 256 KiB cap`);
    }
  }

  mkdirSync(out, { recursive: true });
  cpSync(gameDir, join(out, 'game'), { recursive: true });
  mkdirSync(join(out, 'screenshots'), { recursive: true });
  cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

  const dossier = buildDossier(out, CAPS);
  writeFileSync(join(out, 'dossier.json'), dossier);

  const shotList = shots.slice().sort().join(', ');
  console.log(`handed in Sizzle & Serve: ${shots.length} screenshots (${shotList})`);
  console.log(`game/ copied, dossier.json written (${dossier.length} bytes) -> ${out}`);
}

main();
