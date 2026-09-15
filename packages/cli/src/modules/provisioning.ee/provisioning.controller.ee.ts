import { InstanceSettingsLoaderConfig } from '@n8n/config';
import { AuthenticatedRequest } from '@n8n/db';
import { Get, GlobalScope, Patch, RestController } from '@n8n/decorators';
import { Response } from 'express';

import { ForbiddenError } from '@/errors/response-errors/forbidden.error';

import { ProvisioningService } from './provisioning.service.ee';

@RestController('/sso/provisioning')
export class ProvisioningController {
	constructor(
		private readonly provisioningService: ProvisioningService,
		private readonly instanceSettingsLoaderConfig: InstanceSettingsLoaderConfig,
	) {}

	@Get('/config')
	@GlobalScope('provisioning:manage')
	async getConfig(_req: AuthenticatedRequest, _res: Response) {
		return await this.provisioningService.getConfig();
	}

	@Patch('/config')
	@GlobalScope('provisioning:manage')
	async patchConfig(req: AuthenticatedRequest, _res: Response) {
		if (this.instanceSettingsLoaderConfig.ssoManagedByEnv) {
			throw new ForbiddenError(
				'Provisioning configuration is managed via environment variables and cannot be modified through the API',
			);
		}

		return await this.provisioningService.patchConfig(req.body);
	}
}
