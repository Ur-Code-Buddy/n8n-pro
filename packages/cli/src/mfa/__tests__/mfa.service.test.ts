import { mockLogger } from '@n8n/backend-test-utils';
import type { SettingsRepository, UserRepository } from '@n8n/db';
import { mock } from 'jest-mock-extended';
import type { Cipher } from 'n8n-core';

import type { CacheService } from '@/services/cache/cache.service';

import { MFA_ENFORCE_SETTING } from '../constants';
import { MFA_CACHE_KEY, MfaService } from '../mfa.service';
import type { TOTPService } from '../totp.service';

describe('MfaService', () => {
	let mfaService: MfaService;
	let mockUserRepository: jest.Mocked<UserRepository>;
	let mockSettingsRepository: jest.Mocked<SettingsRepository>;
	let mockCacheService: jest.Mocked<CacheService>;
	let mockTotpService: jest.Mocked<TOTPService>;
	let mockCipher: jest.Mocked<Cipher>;

	beforeEach(() => {
		jest.clearAllMocks();

		mockUserRepository = mock<UserRepository>();
		mockSettingsRepository = mock<SettingsRepository>();
		mockCacheService = mock<CacheService>();
		mockTotpService = mock<TOTPService>();
		mockCipher = mock<Cipher>();

		mfaService = new MfaService(
			mockUserRepository,
			mockSettingsRepository,
			mockCacheService,
			mockTotpService,
			mockCipher,
			mockLogger(),
		);
	});

	describe('isMFAEnforced', () => {
		it('should return true when cached value is "true"', async () => {
			mockCacheService.get.mockResolvedValue('true');

			const result = await mfaService.isMFAEnforced();

			expect(result).toBe(true);
			expect(mockCacheService.get).toHaveBeenCalledWith(MFA_CACHE_KEY);
			expect(mockSettingsRepository.findByKey).not.toHaveBeenCalled();
		});

		it('should return false when cached value is "false"', async () => {
			mockCacheService.get.mockResolvedValue('false');

			const result = await mfaService.isMFAEnforced();

			expect(result).toBe(false);
			expect(mockCacheService.get).toHaveBeenCalledWith(MFA_CACHE_KEY);
			expect(mockSettingsRepository.findByKey).not.toHaveBeenCalled();
		});

		it('should return false when cached value is any other string', async () => {
			mockCacheService.get.mockResolvedValue('some-other-value');

			const result = await mfaService.isMFAEnforced();

			expect(result).toBe(false);
			expect(mockCacheService.get).toHaveBeenCalledWith(MFA_CACHE_KEY);
			expect(mockSettingsRepository.findByKey).not.toHaveBeenCalled();
		});

		it('should load from settings when cache is null', async () => {
			mockCacheService.get.mockResolvedValue(null);
			mockSettingsRepository.findByKey.mockResolvedValue({
				key: MFA_ENFORCE_SETTING,
				value: 'true',
				loadOnStartup: true,
			});

			const result = await mfaService.isMFAEnforced();

			expect(result).toBe(true);
			expect(mockCacheService.get).toHaveBeenCalledWith(MFA_CACHE_KEY);
			expect(mockSettingsRepository.findByKey).toHaveBeenCalledWith(MFA_ENFORCE_SETTING);
			expect(mockCacheService.set).toHaveBeenCalledWith(MFA_CACHE_KEY, 'true');
		});

		it('should load from settings when cache is undefined', async () => {
			mockCacheService.get.mockResolvedValue(undefined);
			mockSettingsRepository.findByKey.mockResolvedValue({
				key: MFA_ENFORCE_SETTING,
				value: 'true',
				loadOnStartup: true,
			});

			const result = await mfaService.isMFAEnforced();

			expect(result).toBe(true);
			expect(mockCacheService.get).toHaveBeenCalledWith(MFA_CACHE_KEY);
			expect(mockSettingsRepository.findByKey).toHaveBeenCalledWith(MFA_ENFORCE_SETTING);
			expect(mockCacheService.set).toHaveBeenCalledWith(MFA_CACHE_KEY, 'true');
		});

		it('should return false when settings value is "false"', async () => {
			mockCacheService.get.mockResolvedValue(null);
			mockSettingsRepository.findByKey.mockResolvedValue({
				key: MFA_ENFORCE_SETTING,
				value: 'false',
				loadOnStartup: true,
			});

			const result = await mfaService.isMFAEnforced();

			expect(result).toBe(false);
			expect(mockSettingsRepository.findByKey).toHaveBeenCalledWith(MFA_ENFORCE_SETTING);
			expect(mockCacheService.set).toHaveBeenCalledWith(MFA_CACHE_KEY, 'false');
		});

		it('should return false when settings value is null', async () => {
			mockCacheService.get.mockResolvedValue(null);
			mockSettingsRepository.findByKey.mockResolvedValue(null);

			const result = await mfaService.isMFAEnforced();

			expect(result).toBe(false);
			expect(mockSettingsRepository.findByKey).toHaveBeenCalledWith(MFA_ENFORCE_SETTING);
			expect(mockCacheService.set).toHaveBeenCalledWith(MFA_CACHE_KEY, undefined);
		});

		it('should return false when settings value is empty string', async () => {
			mockCacheService.get.mockResolvedValue(null);
			mockSettingsRepository.findByKey.mockResolvedValue({
				key: MFA_ENFORCE_SETTING,
				value: '',
				loadOnStartup: true,
			});

			const result = await mfaService.isMFAEnforced();

			expect(result).toBe(false);
			expect(mockSettingsRepository.findByKey).toHaveBeenCalledWith(MFA_ENFORCE_SETTING);
			expect(mockCacheService.set).toHaveBeenCalledWith(MFA_CACHE_KEY, '');
		});
	});

	describe('enforceMFA', () => {
		it('should enforce MFA when value is true', async () => {
			await mfaService.enforceMFA(true);

			expect(mockSettingsRepository.upsert).toHaveBeenCalledWith(
				{
					key: MFA_ENFORCE_SETTING,
					value: 'true',
					loadOnStartup: true,
				},
				['key'],
			);
			expect(mockCacheService.set).toHaveBeenCalledWith(MFA_CACHE_KEY, 'true');
		});

		it('should disable MFA enforcement when value is false', async () => {
			await mfaService.enforceMFA(false);

			expect(mockSettingsRepository.upsert).toHaveBeenCalledWith(
				{
					key: MFA_ENFORCE_SETTING,
					value: 'false',
					loadOnStartup: true,
				},
				['key'],
			);
			expect(mockCacheService.set).toHaveBeenCalledWith(MFA_CACHE_KEY, 'false');
		});
	});
});
