import { z } from 'zod';

/**
 * Instance-wide, admin-configured per-token pricing for AI models, used to
 * turn the token counts already captured per LLM call into a rough cost
 * estimate in the Logs view. There's no reliable way to look this up
 * automatically (providers don't return price, and rates change), so an
 * admin maintains this list themselves from Settings > AI > Model Pricing.
 */
export const aiModelPriceEntrySchema = z.object({
	id: z.string().min(1),
	/** Free-text label, e.g. "OpenAI" -- not validated against a fixed list so self-hosted/custom providers work too. */
	provider: z.string().min(1).max(100),
	/**
	 * Must match the model identifier as it appears in the node's `model`
	 * parameter (e.g. `gpt-4o-mini`, `claude-sonnet-4-6`) for the lookup used
	 * when estimating a run's cost to find it.
	 */
	model: z.string().min(1).max(200),
	inputPricePerMillionTokens: z.number().nonnegative(),
	outputPricePerMillionTokens: z.number().nonnegative(),
});
export type AiModelPriceEntry = z.infer<typeof aiModelPriceEntrySchema>;

export const aiModelPricingSettingsSchema = z.object({
	entries: z.array(aiModelPriceEntrySchema).max(500),
});
export type AiModelPricingSettings = z.infer<typeof aiModelPricingSettingsSchema>;

export const AiModelPricingSettingsUpdateDto = aiModelPricingSettingsSchema;
export type AiModelPricingSettingsUpdateRequest = AiModelPricingSettings;
