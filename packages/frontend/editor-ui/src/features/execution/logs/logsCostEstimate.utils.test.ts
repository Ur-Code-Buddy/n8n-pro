import type { AiModelPriceEntry } from '@n8n/api-types';
import type { INodeUi, LlmTokenUsageData } from '@/Interface';
import type { LogEntry } from './logs.types';
import {
	extractModelIdentifier,
	getSubtreeTotalEstimatedCost,
	priceEntriesToMap,
} from './logsCostEstimate.utils';

function makeNode(id: string, model: INodeUi['parameters']['model']): INodeUi {
	return {
		id,
		name: id,
		type: '@n8n/n8n-nodes-langchain.lmChatOpenAi',
		typeVersion: 1,
		position: [0, 0],
		parameters: { model },
	};
}

const emptyTokens: LlmTokenUsageData = {
	promptTokens: 0,
	completionTokens: 0,
	totalTokens: 0,
	isEstimate: false,
};

function tokens(promptTokens: number, completionTokens: number): LlmTokenUsageData {
	return {
		promptTokens,
		completionTokens,
		totalTokens: promptTokens + completionTokens,
		isEstimate: false,
	};
}

function makeEntry(overrides: Partial<LogEntry> & Pick<LogEntry, 'node'>): LogEntry {
	return {
		id: overrides.node.id,
		children: [],
		runIndex: 0,
		runData: undefined,
		consumedTokens: emptyTokens,
		workflow: {} as LogEntry['workflow'],
		executionId: 'exec-1',
		execution: {} as LogEntry['execution'],
		isSubExecution: false,
		...overrides,
	};
}

const priceTable: AiModelPriceEntry[] = [
	{
		id: 'price-1',
		provider: 'OpenAI',
		model: 'gpt-4o-mini',
		inputPricePerMillionTokens: 0.15,
		outputPricePerMillionTokens: 0.6,
	},
];

describe('extractModelIdentifier', () => {
	it('reads a plain string model parameter', () => {
		expect(extractModelIdentifier(makeNode('n1', 'gpt-4o-mini'))).toBe('gpt-4o-mini');
	});

	it('reads the value out of a resourceLocator model parameter', () => {
		expect(
			extractModelIdentifier(makeNode('n1', { __rl: true, mode: 'list', value: 'gpt-4o-mini' })),
		).toBe('gpt-4o-mini');
	});

	it('returns the raw, unresolved expression string when the model is set via an expression', () => {
		// n8n represents an unresolved expression as a plain string starting
		// with "=" -- there's no way to evaluate it statically here, so this
		// is returned as-is. That's safe: it just won't match any configured
		// price entry, which getSubtreeTotalEstimatedCost surfaces via
		// `isPartial` rather than silently mis-pricing the run.
		expect(
			extractModelIdentifier(
				makeNode('n1', { __rl: true, mode: 'id', value: '={{ $json.model }}' }),
			),
		).toBe('={{ $json.model }}');
	});

	it('returns undefined when there is no model parameter at all', () => {
		expect(extractModelIdentifier(makeNode('n1', undefined))).toBeUndefined();
	});
});

describe('getSubtreeTotalEstimatedCost', () => {
	it('returns undefined when no node in the subtree consumed any tokens', () => {
		const entry = makeEntry({ node: makeNode('n1', 'gpt-4o-mini') });

		expect(
			getSubtreeTotalEstimatedCost(entry, false, priceEntriesToMap(priceTable)),
		).toBeUndefined();
	});

	it('computes cost from prompt/completion tokens at the configured rate', () => {
		const entry = makeEntry({
			node: makeNode('n1', 'gpt-4o-mini'),
			consumedTokens: tokens(1_000_000, 1_000_000),
		});

		const result = getSubtreeTotalEstimatedCost(entry, false, priceEntriesToMap(priceTable));

		expect(result).toEqual({ total: 0.15 + 0.6, isPartial: false });
	});

	it('sums cost across child nodes', () => {
		const child = makeEntry({
			node: makeNode('child', 'gpt-4o-mini'),
			consumedTokens: tokens(500_000, 0),
		});
		const root = makeEntry({
			node: makeNode('root', 'gpt-4o-mini'),
			consumedTokens: tokens(500_000, 0),
			children: [child],
		});

		const result = getSubtreeTotalEstimatedCost(root, false, priceEntriesToMap(priceTable));

		expect(result).toEqual({ total: 0.15, isPartial: false });
	});

	it('marks the result partial when a token-consuming node has no matching price, without silently dropping it', () => {
		const unpriced = makeEntry({
			node: makeNode('unpriced', 'some-unknown-model'),
			consumedTokens: tokens(1_000_000, 0),
		});
		const priced = makeEntry({
			node: makeNode('priced', 'gpt-4o-mini'),
			consumedTokens: tokens(1_000_000, 0),
		});
		const root = makeEntry({
			node: makeNode('root', undefined),
			children: [unpriced, priced],
		});

		const result = getSubtreeTotalEstimatedCost(root, false, priceEntriesToMap(priceTable));

		// Only the priced node's cost is counted, but isPartial says the total understates reality
		expect(result).toEqual({ total: 0.15, isPartial: true });
	});

	it('excludes nodes from a different execution when includeSubWorkflow is false', () => {
		const subWorkflowChild = makeEntry({
			node: makeNode('sub', 'gpt-4o-mini'),
			consumedTokens: tokens(1_000_000, 0),
			executionId: 'exec-2',
		});
		const root = makeEntry({
			node: makeNode('root', 'gpt-4o-mini'),
			consumedTokens: tokens(1_000_000, 0),
			executionId: 'exec-1',
			children: [subWorkflowChild],
		});

		const result = getSubtreeTotalEstimatedCost(root, false, priceEntriesToMap(priceTable));

		expect(result).toEqual({ total: 0.15, isPartial: false });
	});
});
