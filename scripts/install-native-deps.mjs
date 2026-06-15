#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const rootDir = new URL('..', import.meta.url).pathname;
const nodeMajor = Number(process.versions.node.split('.')[0]);

/** @type {{ name: string; required: boolean; skip?: () => boolean; verify?: () => boolean }[]} */
const nativePackages = [
	{
		name: 'sqlite3',
		required: true,
		verify: () => {
			try {
				execSync('node -e "require(\'sqlite3\')"', { cwd: rootDir, stdio: 'ignore' });
				return true;
			} catch {
				return false;
			}
		},
	},
	{
		name: 'isolated-vm',
		required: false,
		skip: () => nodeMajor !== 24,
	},
];

let hadErrors = false;

for (const { name, required, skip, verify } of nativePackages) {
	if (skip?.()) {
		console.warn(
			`[native-deps] skipping ${name} on Node ${process.version} (use Node 24 for local builds, or rely on Docker)`,
		);
		continue;
	}

	const pkgDir = join(rootDir, 'node_modules', name);
	if (!existsSync(join(pkgDir, 'package.json'))) {
		const message = `[native-deps] skipping ${name} (not installed)`;
		if (required) {
			console.error(message);
			hadErrors = true;
		} else {
			console.warn(message);
		}
		continue;
	}

	console.log(`[native-deps] running install for ${name}...`);
	try {
		execSync('pnpm run install', { cwd: pkgDir, stdio: 'inherit' });
	} catch {
		const message = `[native-deps] install failed for ${name}`;
		if (required) {
			console.error(message);
			hadErrors = true;
		} else {
			console.warn(`${message} (optional — continuing)`);
		}
		continue;
	}

	if (verify && !verify()) {
		const message = `[native-deps] verification failed for ${name}`;
		console.error(message);
		if (required) {
			hadErrors = true;
		}
	}
}

if (hadErrors) {
	process.exit(1);
}

console.log('[native-deps] done');
