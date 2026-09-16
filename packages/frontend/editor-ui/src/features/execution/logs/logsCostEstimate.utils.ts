import type { AiModelPriceEntry } from '@n8n/api-types';
import type { INodeParameterResourceLocator } from 'n8n-workflow';

import type { INodeUi } from '@/Interface';
import type { LogEntry } from './logs.types';

export interface EstimatedCost {
	/** Total estimated cost in USD, summed across every priced node this was computed over. */
	total: number;
	/**
	 * True when at least one token-consuming node in scope had no matching
	 * price entry, meaning `total` is a floor, not the full cost. Callers
	 * should always surface this -- a silent undercount is worse than no
	 * number at all.
	 */
	isPartial: boolean;
}

/**
 * Reads the model identifier a node actually ran with, from its static
 * `model` parameter. Only handles what's resolvable without executing the
 * workflow: a plain string, or a resourceLocator's `value` (the common shape
 * for most LLM nodes, e.g. LmChatOpenAi's `model` parameter). Returns
 * `undefined` for an expression-driven value (can't know it statically) or
 * any node type that doesn't have a `model` parameter at all.
 */
export function extractModelIdentifier(node: INodeUi): string | undefined {
	const model = node.parameters?.model;

	if (typeof model === 'string') {
		return model;
	}

	if (
		typeof model === 'object' &&
		model !== null &&
		(model as Partial<INodeParameterResourceLocator>).__rl === true
	) {
		const { value } = model as INodeParameterResourceLocator;
		return typeof value === 'string' ? value : undefined;
	}

	return undefined;
}

/**
 * Sums the estimated cost of every LLM call in `treeNode`'s subtree, mirroring
 * how getSubtreeTotalConsumedTokens sums token counts -- same tree walk, same
 * includeSubWorkflow semantics, so the two stay in lockstep as the log tree
 * evolves. Returns `undefined` when the subtree contains no token-consuming
 * node at all (nothing to estimate), as opposed to a `{ total: 0, isPartial }`
 * result, which means there WAS an LLM call but its cost is entirely unpriced.
 */
export function getSubtreeTotalEstimatedCost(
	treeNode: LogEntry,
	includeSubWorkflow: boolean,
	priceByModel: ReadonlyMap<string, AiModelPriceEntry>,
): EstimatedCost | undefined {
	const executionId = treeNode.executionId;
	let total = 0;
	let hasPricedNode = false;
	let isPartial = false;

	function walk(currentNode: LogEntry): void {
		if (!includeSubWorkflow && currentNode.executionId !== executionId) return;

		if (currentNode.consumedTokens.totalTokens > 0) {
			const model = extractModelIdentifier(currentNode.node);
			const price = model ? priceByModel.get(model) : undefined;

			if (price) {
				hasPricedNode = true;
				total +=
					(currentNode.consumedTokens.promptTokens / 1_000_000) * price.inputPricePerMillionTokens +
					(currentNode.consumedTokens.completionTokens / 1_000_000) *
						price.outputPricePerMillionTokens;
			} else {
				isPartial = true;
			}
		}

		currentNode.children.forEach(walk);
	}

	walk(treeNode);

	if (!hasPricedNode && !isPartial) return undefined;
	return { total, isPartial };
}

/**
 * Combines several independently-computed EstimatedCost results (e.g. one
 * per root LogEntry) into one, mirroring getTotalConsumedTokens. `isPartial`
 * is contagious -- true if any input was partial -- since the combined total
 * inherits every individual total's uncertainty.
 */
export function getTotalEstimatedCost(
	...costs: Array<EstimatedCost | undefined>
): EstimatedCost | undefined {
	const present = costs.filter((cost): cost is EstimatedCost => cost !== undefined);
	if (present.length === 0) return undefined;

	return {
		total: present.reduce((sum, cost) => sum + cost.total, 0),
		isPartial: present.some((cost) => cost.isPartial),
	};
}

export function priceEntriesToMap(
	entries: readonly AiModelPriceEntry[],
): Map<string, AiModelPriceEntry> {
	return new Map(entries.map((entry) => [entry.model, entry]));
}

/**
 * Formats a USD amount for display next to a token count: enough decimal
 * places to not always round tiny per-call costs down to "$0.00", but not
 * so many that a larger total looks like a rounding artifact.
 */
export function formatEstimatedCostAmount(amount: number): string {
	if (amount === 0) return '0';
	if (amount < 0.01) return amount.toFixed(4);
	if (amount < 1) return amount.toFixed(3);
	return amount.toFixed(2);
}
