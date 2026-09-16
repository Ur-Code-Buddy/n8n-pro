import { makeRestApiRequest } from '@n8n/rest-api-client';
import type { IRestApiContext } from '@n8n/rest-api-client';
import type { AiModelPricingSettings, AiModelPricingSettingsUpdateRequest } from '@n8n/api-types';

export async function fetchAiModelPricingSettings(
	context: IRestApiContext,
): Promise<AiModelPricingSettings> {
	return await makeRestApiRequest(context, 'GET', '/ai-model-pricing');
}

export async function updateAiModelPricingSettings(
	context: IRestApiContext,
	body: AiModelPricingSettingsUpdateRequest,
): Promise<AiModelPricingSettings> {
	return await makeRestApiRequest(context, 'PUT', '/ai-model-pricing', body);
}
