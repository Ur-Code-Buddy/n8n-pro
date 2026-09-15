import { AiModelPricingSettingsUpdateDto, type AiModelPricingSettings } from '@n8n/api-types';
import { AuthenticatedRequest } from '@n8n/db';
import { Get, GlobalScope, Put, RestController } from '@n8n/decorators';

import { BadRequestError } from '@/errors/response-errors/bad-request.error';
import { AiModelPricingService } from '@/services/ai-model-pricing.service';

@RestController('/ai-model-pricing')
export class AiModelPricingController {
	constructor(private readonly pricingService: AiModelPricingService) {}

	@Get('/')
	@GlobalScope('aiAssistant:manage')
	async getSettings(_req: AuthenticatedRequest): Promise<AiModelPricingSettings> {
		return await this.pricingService.getSettings();
	}

	@Put('/')
	@GlobalScope('aiAssistant:manage')
	async updateSettings(req: AuthenticatedRequest): Promise<AiModelPricingSettings> {
		const parseResult = AiModelPricingSettingsUpdateDto.safeParse(req.body);
		if (!parseResult.success) {
			throw new BadRequestError(parseResult.error.errors[0]?.message ?? 'Invalid request body');
		}

		// Reject duplicate ids up front -- the frontend always sends the full
		// list back, so a duplicate here means a client-side bug, not a
		// legitimate partial update.
		const ids = parseResult.data.entries.map((entry) => entry.id);
		if (new Set(ids).size !== ids.length) {
			throw new BadRequestError('Duplicate model pricing entry id');
		}

		return await this.pricingService.updateSettings(parseResult.data);
	}
}
