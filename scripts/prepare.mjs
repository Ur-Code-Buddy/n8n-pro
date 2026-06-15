#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

// Skip lefthook install in CI or Docker build
if (process.env.CI || process.env.DOCKER_BUILD) {
	process.exit(0);
}

const lefthookBin = join(process.cwd(), 'node_modules', '.bin', 'lefthook');
if (!existsSync(lefthookBin)) {
	console.warn('[prepare] lefthook not installed yet, skipping git hooks setup');
	process.exit(0);
}

execSync('pnpm lefthook install', { stdio: 'inherit' });
