import type { InstanceSettingsLoaderConfig } from '@n8n/config';
import { mock } from 'jest-mock-extended';

import { ProvisioningController } from '../provisioning.controller.ee';
import { type ProvisioningService } from '@/modules/provisioning.ee/provisioning.service.ee';
import { type Response } from 'express';
import { type AuthenticatedRequest } from '@n8n/db';
import { type ProvisioningConfigDto } from '@n8n/api-types';

const provisioningService = mock<ProvisioningService>();
const instanceSettingsLoaderConfig = mock<InstanceSettingsLoaderConfig>({
	ssoManagedByEnv: false,
});

const controller = new ProvisioningController(provisioningService, instanceSettingsLoaderConfig);

describe('ProvisioningController', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('getConfig', () => {
		const req = mock<AuthenticatedRequest>();
		const res = mock<Response>({
			json: jest.fn().mockReturnThis(),
			status: jest.fn().mockReturnThis(),
		});

		it('should return the provisioning config', async () => {
			const configResponse: ProvisioningConfigDto = {
				scopesProvisionInstanceRole: true,
				scopesProvisionProjectRoles: true,
				scopesName: 'n8n_test_scope',
				scopesInstanceRoleClaimName: 'n8n_test_instance_role',
				scopesProjectsRolesClaimName: 'n8n_test_projects_roles',
				scopesUseExpressionMapping: false,
			};

			provisioningService.getConfig.mockResolvedValue(configResponse);

			const config = await controller.getConfig(req, res);

			expect(config).toEqual(configResponse);
		});
	});

	describe('patchConfig', () => {
		const req = mock<AuthenticatedRequest>();
		const res = mock<Response>({
			json: jest.fn().mockReturnThis(),
			status: jest.fn().mockReturnThis(),
		});

		it('should reject writes when managed by env', async () => {
			const envManagedConfig = mock<InstanceSettingsLoaderConfig>({ ssoManagedByEnv: true });
			const envManagedController = new ProvisioningController(provisioningService, envManagedConfig);

			await expect(envManagedController.patchConfig(req, res)).rejects.toThrow(
				'cannot be modified through the API',
			);
		});

		it('should patch the provisioning config', async () => {
			const configResponse: ProvisioningConfigDto = {
				scopesProvisionInstanceRole: false,
				scopesProvisionProjectRoles: false,
				scopesName: 'n8n_test_scope',
				scopesInstanceRoleClaimName: 'n8n_test_instance_role',
				scopesProjectsRolesClaimName: 'n8n_test_projects_roles',
				scopesUseExpressionMapping: false,
			};

			provisioningService.patchConfig.mockResolvedValue(configResponse);

			const config = await controller.patchConfig(req, res);

			expect(config).toEqual(configResponse);
		});
	});
});
