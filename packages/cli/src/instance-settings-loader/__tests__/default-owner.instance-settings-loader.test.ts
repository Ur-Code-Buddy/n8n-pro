import { mock } from 'jest-mock-extended';
import type { Logger } from '@n8n/backend-common';
import type { InstanceSettingsLoaderConfig } from '@n8n/config';

import type { OwnershipService } from '@/services/ownership.service';
import type { PasswordUtility } from '@/services/password.utility';

import { DefaultOwnerInstanceSettingsLoader } from '../loaders/default-owner.instance-settings-loader';

describe('DefaultOwnerInstanceSettingsLoader', () => {
	const logger = mock<Logger>({ scoped: jest.fn().mockReturnThis() });
	const ownershipService = mock<OwnershipService>();
	const passwordUtility = mock<PasswordUtility>();

	const createLoader = (configOverrides: Partial<InstanceSettingsLoaderConfig> = {}) => {
		const config = {
			defaultOwnerEnabled: true,
			defaultOwnerEmail: 'baivab@admin.local',
			defaultOwnerPassword: 'admin@ccess4321',
			defaultOwnerFirstName: 'Admin',
			defaultOwnerLastName: 'User',
			...configOverrides,
		} as InstanceSettingsLoaderConfig;

		return new DefaultOwnerInstanceSettingsLoader(
			config,
			ownershipService,
			passwordUtility,
			logger,
		);
	};

	beforeEach(() => {
		jest.resetAllMocks();
		logger.scoped.mockReturnThis();
		passwordUtility.hash.mockResolvedValue('hashed-password');
		ownershipService.hasInstanceOwner.mockResolvedValue(false);
	});

	it('should skip when default owner bootstrap is disabled', async () => {
		const loader = createLoader({ defaultOwnerEnabled: false });

		const result = await loader.run();

		expect(result).toBe('skipped');
		expect(ownershipService.setupOwner).not.toHaveBeenCalled();
	});

	it('should skip when instance owner already exists', async () => {
		ownershipService.hasInstanceOwner.mockResolvedValue(true);
		const loader = createLoader();

		const result = await loader.run();

		expect(result).toBe('skipped');
		expect(ownershipService.setupOwner).not.toHaveBeenCalled();
	});

	it('should create default owner on first boot', async () => {
		const loader = createLoader();

		const result = await loader.run();

		expect(result).toBe('created');
		expect(passwordUtility.hash).toHaveBeenCalledWith('admin@ccess4321');
		expect(ownershipService.setupOwner).toHaveBeenCalledWith(
			{
				email: 'baivab@admin.local',
				firstName: 'Admin',
				lastName: 'User',
				password: 'hashed-password',
			},
			{ passwordIsHashed: true },
		);
	});

	it('should throw when default owner email is invalid', async () => {
		const loader = createLoader({ defaultOwnerEmail: 'baivab@admin' });

		await expect(loader.run()).rejects.toThrow(
			'Invalid N8N_DEFAULT_OWNER_EMAIL: "baivab@admin" is not a valid email address',
		);
		expect(ownershipService.setupOwner).not.toHaveBeenCalled();
	});

	it('should use env-configured credentials when provided', async () => {
		const loader = createLoader({
			defaultOwnerEmail: 'custom@admin.local',
			defaultOwnerPassword: 'custom-pass',
			defaultOwnerFirstName: 'Custom',
			defaultOwnerLastName: 'Admin',
		});

		await loader.run();

		expect(passwordUtility.hash).toHaveBeenCalledWith('custom-pass');
		expect(ownershipService.setupOwner).toHaveBeenCalledWith(
			expect.objectContaining({
				email: 'custom@admin.local',
				firstName: 'Custom',
				lastName: 'Admin',
			}),
			{ passwordIsHashed: true },
		);
	});
});
