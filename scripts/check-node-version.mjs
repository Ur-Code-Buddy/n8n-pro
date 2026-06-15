#!/usr/bin/env node

const REQUIRED_MAJOR = 24;
const RECOMMENDED = '24.16.0';
const [major, minor, patch] = process.versions.node.split('.').map(Number);
const version = process.version;

if (major !== REQUIRED_MAJOR) {
	console.error('\x1b[0;31m');
	console.error('╭──────────────────────────────────────────────────────────────╮');
	console.error(`│  Node.js ${REQUIRED_MAJOR}.x is required for this repo (you have ${version})`.padEnd(63) + '│');
	console.error('│  Matches the n8n Docker image and avoids native-module issues. │');
	console.error('╰──────────────────────────────────────────────────────────────╯');
	console.error('\x1b[0m');
	console.error('Switch to Node 24, then reinstall:');
	console.error('');
	console.error('  # One-time shell setup (add to ~/.zshrc):');
	console.error('  eval "$(fnm env --shell zsh)"');
	console.error('');
	console.error('  # Then in this repo (run each command on its own line):');
	console.error('  fnm use');
	console.error('  node -v');
	console.error('  pnpm install');
	process.exit(1);
}

if (minor === 16 && patch === 0) {
	process.exit(0);
}

console.warn(
	`[check-node-version] Node ${version} is OK (recommended: v${RECOMMENDED}, same as Docker).`,
);
