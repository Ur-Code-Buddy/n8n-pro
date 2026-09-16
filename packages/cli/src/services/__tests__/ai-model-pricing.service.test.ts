import type { SettingsRepository } from '@n8n/db';
import { mock } from 'jest-mock-extended';

import { AiModelPricingService } from '../ai-model-pricing.service';

describe('AiModelPricingService', () => {
	const settingsRepository = mock<SettingsRepository>();

	let service: AiModelPricingService;

	beforeEach(() => {
		jest.clearAllMocks();
		service = new AiModelPricingService(settingsRepository);
	});

	function mockPersistedSettings(value: unknown) {
		settingsRepository.findByKey.mockResolvedValue(
			value === null
				? null
				: ({ key: 'aiModelPricing.settings', value: JSON.stringify(value) } as never),
		);
	}

	describe('getSettings', () => {
		it('returns an empty entry list when nothing has been persisted', async () => {
			mockPersistedSettings(null);

			const result = await service.getSettings();

			expect(result).toEqual({ entries: [] });
		});

		it('returns the persisted entries', async () => {
			const entries = [
				{
					id: 'entry-1',
					provider: 'OpenAI',
					model: 'gpt-4o-mini',
					inputPricePerMillionTokens: 0.15,
					outputPricePerMillionTokens: 0.6,
				},
			];
			mockPersistedSettings({ entries });

			const result = await service.getSettings();

			expect(result).toEqual({ entries });
		});

		it('falls back to an empty list when the persisted value is corrupt JSON', async () => {
			settingsRepository.findByKey.mockResolvedValue({
				key: 'aiModelPricing.settings',
				value: '{not valid json',
			} as never);

			const result = await service.getSettings();

			expect(result).toEqual({ entries: [] });
		});

		it('falls back to an empty list when the persisted value fails schema validation', async () => {
			mockPersistedSettings({ entries: [{ id: 'entry-1' }] });

			const result = await service.getSettings();

			expect(result).toEqual({ entries: [] });
		});

		it('caches the loaded settings across calls instead of re-reading from the repository', async () => {
			mockPersistedSettings({ entries: [] });

			await service.getSettings();
			await service.getSettings();

			expect(settingsRepository.findByKey).toHaveBeenCalledTimes(1);
		});
	});

	describe('updateSettings', () => {
		it('persists the new entries and returns them', async () => {
			const payload = {
				entries: [
					{
						id: 'entry-1',
						provider: 'Anthropic',
						model: 'claude-sonnet-4-6',
						inputPricePerMillionTokens: 3,
						outputPricePerMillionTokens: 15,
					},
				],
			};

			const result = await service.updateSettings(payload);

			expect(settingsRepository.upsert).toHaveBeenCalledWith(
				{
					key: 'aiModelPricing.settings',
					value: JSON.stringify(payload),
					loadOnStartup: false,
				},
				['key'],
			);
			expect(result).toEqual(payload);
		});

		it('updates the cache so a subsequent getSettings reflects the change without re-reading', async () => {
			mockPersistedSettings({ entries: [] });
			await service.getSettings();

			const payload = {
				entries: [
					{
						id: 'entry-1',
						provider: 'OpenAI',
						model: 'gpt-4o',
						inputPricePerMillionTokens: 2.5,
						outputPricePerMillionTokens: 10,
					},
				],
			};
			await service.updateSettings(payload);

			const result = await service.getSettings();

			expect(result).toEqual(payload);
			expect(settingsRepository.findByKey).toHaveBeenCalledTimes(1);
		});
	});
});
