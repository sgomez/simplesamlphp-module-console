// Runs the page screenshots with the browser in the pinned Playwright image: `npm run test:visual [-- --update]`.
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const IMAGE =
  'mcr.microsoft.com/playwright:v1.65.1-noble@sha256:1507cbfc550a63a6b7396791ca4f00df17beb56342d2447b3f106c306f525579';
const PORT = 3765;
const lock = JSON.parse(readFileSync(new URL('../../package-lock.json', import.meta.url), 'utf8'));
const version = lock.packages['node_modules/playwright'].version;
const name = `console-visual-${process.pid}`;

if (!IMAGE.includes(`:v${version}-`)) {
  console.error(`The image runs Playwright ${IMAGE.split(':')[1]}, the lock file pins ${version}.`);
  process.exit(1);
}

const started = spawnSync('docker', [
  'run', '-d', '--rm', '--init', '--name', name, '--user', 'pwuser', '--workdir', '/home/pwuser',
  '-p', `127.0.0.1:${PORT}:${PORT}`, IMAGE,
  '/bin/sh', '-c', `npx -y playwright@${version} run-server --port ${PORT} --host 0.0.0.0`,
], { stdio: ['ignore', 'ignore', 'inherit'] });
if (started.status !== 0) {
  process.exit(started.status ?? 1);
}

const stop = () => spawnSync('docker', ['stop', name], { stdio: 'ignore' });
process.on('SIGINT', () => {
  stop();
  process.exit(130);
});

async function ready() {
  for (let attempt = 0; attempt < 240; attempt++) {
    try {
      await fetch(`http://127.0.0.1:${PORT}/`);

      return true;
    } catch {
      await sleep(500);
    }
  }

  return false;
}

if (!(await ready())) {
  console.error('The Playwright server in the container did not start.');
  stop();
  process.exit(1);
}

const vitest = spawn('npx', ['vitest', 'run', '--project', 'visual', ...process.argv.slice(2)], { stdio: 'inherit' });
vitest.on('exit', (code) => {
  stop();
  process.exit(code ?? 1);
});
