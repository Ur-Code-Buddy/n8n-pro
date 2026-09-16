import type {
	AiAskRequestDto,
	AiApplySuggestionRequestDto,
	AiChatRequestDto,
} from '@n8n/api-types';
import type { GlobalConfig } from '@n8n/config';
import { AiAssistantClient, type AiAssistantSDK } from '@n8n_io/ai-assistant-sdk';
import { mock } from 'jest-mock-extended';
import type { InstanceSettings } from 'n8n-core';
import type { IUser } from 'n8n-workflow';

import { N8N_VERSION } from '@/constants';

import { AiService } from '../ai.service';

jest.mock('@n8n_io/ai-assistant-sdk', () => ({
	AiAssistantClient: jest.fn(),
}));

describe('AiService', () => {
	let aiService: AiService;

	const baseUrl = 'https://ai-assistant-url.com';
	const instanceId = 'mock-instance-id';
	const user = mock<IUser>({ id: 'user123' });
	const client = mock<AiAssistantClient>();
	const globalConfig = mock<GlobalConfig>({
		logging: { level: 'info' },
		aiAssistant: { baseUrl },
	});
	const instanceSettings = mock<InstanceSettings>({ instanceId });

	beforeEach(() => {
		jest.clearAllMocks();
		(AiAssistantClient as jest.Mock).mockImplementation(() => client);
		aiService = new AiService(globalConfig, instanceSettings);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('init', () => {
		it('should initialize client', async () => {
			await aiService.init();

			expect(AiAssistantClient).toHaveBeenCalledWith({
				licenseCert: '',
				consumerId: 'unknown',
				n8nVersion: N8N_VERSION,
				baseUrl,
				logLevel: 'info',
				instanceId,
			});
		});
	});

	describe('chat', () => {
		const payload = mock<AiChatRequestDto>();

		it('should call client chat method after initialization', async () => {
			const clientResponse = mock<Response>();
			client.chat.mockResolvedValue(clientResponse);

			const result = await aiService.chat(payload, user);

			expect(client.chat).toHaveBeenCalledWith(payload, { id: user.id });
			expect(result).toEqual(clientResponse);
		});
	});

	describe('applySuggestion', () => {
		const payload = mock<AiApplySuggestionRequestDto>();

		it('should call client applySuggestion', async () => {
			const clientResponse = mock<AiAssistantSDK.ApplySuggestionResponse>();
			client.applySuggestion.mockResolvedValue(clientResponse);

			const result = await aiService.applySuggestion(payload, user);

			expect(client.applySuggestion).toHaveBeenCalledWith(payload, { id: user.id });
			expect(result).toEqual(clientResponse);
		});
	});

	describe('askAi', () => {
		const payload = mock<AiAskRequestDto>();

		it('should call client askAi method after initialization', async () => {
			const clientResponse = mock<AiAssistantSDK.AskAiResponsePayload>();
			client.askAi.mockResolvedValue(clientResponse);

			const result = await aiService.askAi(payload, user);

			expect(client.askAi).toHaveBeenCalledWith(payload, { id: user.id });
			expect(result).toEqual(clientResponse);
		});
	});

	describe('isProxyEnabled', () => {
		it('should return true when base URL is configured', () => {
			expect(aiService.isProxyEnabled()).toBe(true);
		});

		it('should return false when base URL is empty', () => {
			const configWithoutUrl = mock<GlobalConfig>({
				logging: { level: 'info' },
				aiAssistant: { baseUrl: '' },
			});
			const serviceNoUrl = new AiService(configWithoutUrl, instanceSettings);

			expect(serviceNoUrl.isProxyEnabled()).toBe(false);
		});
	});

	describe('getClient', () => {
		it('should return initialized client', async () => {
			const result = await aiService.getClient();

			expect(result).toBe(client);
		});

		it('should only initialize once on repeated calls', async () => {
			await aiService.getClient();
			await aiService.getClient();

			expect(AiAssistantClient).toHaveBeenCalledTimes(1);
		});
	});
});
