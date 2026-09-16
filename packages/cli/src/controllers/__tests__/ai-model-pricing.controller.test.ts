import type { AiModelPricingSettings } from '@n8n/api-types';
import type { AuthenticatedRequest } from '@n8n/db';
import { mock } from 'jest-mock-extended';

import { BadRequestError } from '@/errors/response-errors/bad-request.error';
import type { AiModelPricingService } from '@/services/ai-model-pricing.service';

import { AiModelPricingController } from '../ai-model-pricing.controller';

describe('AiModelPricingController', () => {
	const pricingService = mock<AiModelPricingService>();
	const controller = new AiModelPricingController(pricingService);

	const validEntry = {
		id: 'entry-1',
		provider: 'OpenAI',
		model: 'gpt-4o-mini',
		inputPricePerMillionTokens: 0.15,
		outputPricePerMillionTokens: 0.6,
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	function reqWithBody(body: unknown): AuthenticatedRequest {
		return mock<AuthenticatedRequest>({ body: body as object }) as unknown as AuthenticatedRequest;
	}

	describe('getSettings', () => {
		it('returns whatever the service returns', async () => {
			const settings: AiModelPricingSettings = { entries: [validEntry] };
			pricingService.getSettings.mockResolvedValue(settings);

			const result = await controller.getSettings(mock<AuthenticatedRequest>());

			expect(result).toBe(settings);
		});
	});

	describe('updateSettings', () => {
		it('validates and forwards a well-formed payload to the service', async () => {
			pricingService.updateSettings.mockResolvedValue({ entries: [validEntry] });

			const result = await controller.updateSettings(reqWithBody({ entries: [validEntry] }));

			expect(pricingService.updateSettings).toHaveBeenCalledWith({ entries: [validEntry] });
			expect(result).toEqual({ entries: [validEntry] });
		});

		it('rejects a payload that fails schema validation', async () => {
			await expect(
				controller.updateSettings(reqWithBody({ entries: [{ id: 'entry-1' }] })),
			).rejects.toThrow(BadRequestError);

			expect(pricingService.updateSettings).not.toHaveBeenCalled();
		});

		it('rejects entries with duplicate ids', async () => {
			const payload = { entries: [validEntry, { ...validEntry }] };

			await expect(controller.updateSettings(reqWithBody(payload))).rejects.toThrow(
				'Duplicate model pricing entry id',
			);

			expect(pricingService.updateSettings).not.toHaveBeenCalled();
		});

		it('rejects a negative price', async () => {
			const payload = { entries: [{ ...validEntry, inputPricePerMillionTokens: -1 }] };

			await expect(controller.updateSettings(reqWithBody(payload))).rejects.toThrow(
				BadRequestError,
			);
		});
	});
});
