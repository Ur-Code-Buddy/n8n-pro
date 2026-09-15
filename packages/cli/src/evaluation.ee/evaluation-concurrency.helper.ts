import type { ExecutionsConfig } from '@n8n/config';

const EVALUATION_CONCURRENCY_ENV_VAR = 'N8N_CONCURRENCY_EVALUATION_LIMIT';

/**
 * Telemetry tag — records which precedence branch supplied the effective
 * limit on this run.
 */
export type EvaluationConcurrencyLimitSource = 'env' | 'tier';

/**
 * Resolve the effective evaluation concurrency limit for this instance.
 *
 * Order of precedence:
 * 1. `N8N_CONCURRENCY_EVALUATION_LIMIT` env var (operator escape hatch)
 * 2. Unlimited (`-1`), since every plan tier now has full concurrency
 */
export function resolveEvaluationConcurrencyLimit(executionsConfig: ExecutionsConfig): number {
	if (process.env[EVALUATION_CONCURRENCY_ENV_VAR] !== undefined) {
		return executionsConfig.concurrency.evaluationLimit;
	}

	return -1;
}

/**
 * Mirror the precedence in {@link resolveEvaluationConcurrencyLimit} so the
 * telemetry tag reflects which branch actually fired. Kept side-effect-free
 * so callers can read it inline when building telemetry payloads.
 */
export function getEvaluationConcurrencyLimitSource(): EvaluationConcurrencyLimitSource {
	if (process.env[EVALUATION_CONCURRENCY_ENV_VAR] !== undefined) return 'env';
	return 'tier';
}
