import type { ExecutionsConfig } from '@n8n/config';

import {
	getEvaluationConcurrencyLimitSource,
	resolveEvaluationConcurrencyLimit,
} from '@/evaluation.ee/evaluation-concurrency.helper';

const ENV_VAR = 'N8N_CONCURRENCY_EVALUATION_LIMIT';

const buildConfig = (evaluationLimit: number): ExecutionsConfig =>
	({
		concurrency: { productionLimit: -1, evaluationLimit },
	}) as ExecutionsConfig;

describe('resolveEvaluationConcurrencyLimit', () => {
	const originalEnv = process.env[ENV_VAR];

	afterEach(() => {
		if (originalEnv === undefined) delete process.env[ENV_VAR];
		else process.env[ENV_VAR] = originalEnv;
	});

	describe('env override wins', () => {
		test.each([
			['unlimited', '-1', -1],
			['capped to 1', '1', 1],
			['capped to 7', '7', 7],
		])('%s → returns parsed value', (_label, envValue, expected) => {
			process.env[ENV_VAR] = envValue;
			const result = resolveEvaluationConcurrencyLimit(buildConfig(Number(envValue)));
			expect(result).toBe(expected);
		});

		test('env empty string still counts as set (operator opt-in to default config value)', () => {
			process.env[ENV_VAR] = '';
			const result = resolveEvaluationConcurrencyLimit(buildConfig(-1));
			expect(result).toBe(-1);
		});
	});

	describe('env unset', () => {
		beforeEach(() => {
			delete process.env[ENV_VAR];
		});

		test('returns unlimited (-1)', () => {
			expect(resolveEvaluationConcurrencyLimit(buildConfig(-1))).toBe(-1);
		});
	});
});

describe('getEvaluationConcurrencyLimitSource', () => {
	const originalEnv = process.env[ENV_VAR];

	afterEach(() => {
		if (originalEnv === undefined) delete process.env[ENV_VAR];
		else process.env[ENV_VAR] = originalEnv;
	});

	test('returns `env` when the env var is set', () => {
		process.env[ENV_VAR] = '3';
		expect(getEvaluationConcurrencyLimitSource()).toBe('env');
	});

	test('returns `tier` when the env var is unset', () => {
		delete process.env[ENV_VAR];
		expect(getEvaluationConcurrencyLimitSource()).toBe('tier');
	});
});
