import type { AiModelPricingSettings, AiModelPricingSettingsUpdateRequest } from '@n8n/api-types';
import { aiModelPricingSettingsSchema } from '@n8n/api-types';
import { SettingsRepository } from '@n8n/db';
import { Service } from '@n8n/di';
import { jsonParse } from 'n8n-workflow';

const SETTINGS_KEY = 'aiModelPricing.settings';

const DEFAULT_SETTINGS: AiModelPricingSettings = { entries: [] };

/**
 * Instance-wide, admin-maintained per-token pricing for AI models. Read by
 * the frontend to turn token counts (already tracked per LLM call) into a
 * rough cost estimate in the Logs view -- see logsCostEstimate.utils.ts in
 * editor-ui. Persisted via the generic key/value Settings table (same
 * mechanism as AgentsBuilderSettingsService) rather than a dedicated table,
 * since this is a small, admin-edited list with no need for relational
 * queries over it.
 */
@Service()
export class AiModelPricingService {
	private cached: AiModelPricingSettings | null = null;

	constructor(private readonly settingsRepository: SettingsRepository) {}

	private async loadSettings(): Promise<AiModelPricingSettings> {
		if (this.cached) return this.cached;
		const row = await this.settingsRepository.findByKey(SETTINGS_KEY);
		if (!row) {
			this.cached = DEFAULT_SETTINGS;
			return this.cached;
		}
		// Tolerate corrupt persisted JSON or a stale shape by falling back to
		// defaults -- an admin can re-save from the UI to recover. `jsonParse`
		// only treats its fallback as set when it's `!== undefined`, so `null`
		// (which then fails the schema parse below) is used instead of
		// `undefined` to actually trigger the fallback path on invalid JSON.
		const raw = jsonParse<unknown>(row.value, { fallbackValue: null });
		const parseResult = aiModelPricingSettingsSchema.safeParse(raw);
		this.cached = parseResult.success ? parseResult.data : DEFAULT_SETTINGS;
		return this.cached;
	}

	async getSettings(): Promise<AiModelPricingSettings> {
		return await this.loadSettings();
	}

	async updateSettings(
		payload: AiModelPricingSettingsUpdateRequest,
	): Promise<AiModelPricingSettings> {
		await this.settingsRepository.upsert(
			{
				key: SETTINGS_KEY,
				value: JSON.stringify(payload),
				loadOnStartup: false,
			},
			['key'],
		);
		this.cached = payload;
		return payload;
	}
}
