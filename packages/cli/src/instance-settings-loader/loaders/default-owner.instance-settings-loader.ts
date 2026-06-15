import { Logger } from '@n8n/backend-common';
import { InstanceSettingsLoaderConfig } from '@n8n/config';
import { isValidEmail } from '@n8n/db';
import { Service } from '@n8n/di';

import { InstanceBootstrappingError } from '../instance-bootstrapping.error';

import { PasswordUtility } from '@/services/password.utility';
import { OwnershipService } from '@/services/ownership.service';

@Service()
export class DefaultOwnerInstanceSettingsLoader {
	constructor(
		private readonly instanceSettingsLoaderConfig: InstanceSettingsLoaderConfig,
		private readonly ownershipService: OwnershipService,
		private readonly passwordUtility: PasswordUtility,
		private readonly logger: Logger,
	) {
		this.logger = this.logger.scoped('instance-settings-loader');
	}

	async run(): Promise<'created' | 'skipped'> {
		const {
			defaultOwnerEnabled,
			defaultOwnerEmail,
			defaultOwnerPassword,
			defaultOwnerFirstName,
			defaultOwnerLastName,
		} = this.instanceSettingsLoaderConfig;

		if (!defaultOwnerEnabled) {
			this.logger.debug('Default owner bootstrap is disabled, skipping');
			return 'skipped';
		}

		if (await this.ownershipService.hasInstanceOwner()) {
			this.logger.debug('Instance owner already exists, skipping default owner bootstrap');
			return 'skipped';
		}

		if (!isValidEmail(defaultOwnerEmail)) {
			throw new InstanceBootstrappingError(
				`Invalid N8N_DEFAULT_OWNER_EMAIL: "${defaultOwnerEmail}" is not a valid email address`,
			);
		}

		this.logger.info('Creating default instance owner on first boot');

		await this.ownershipService.setupOwner(
			{
				email: defaultOwnerEmail,
				firstName: defaultOwnerFirstName,
				lastName: defaultOwnerLastName,
				password: await this.passwordUtility.hash(defaultOwnerPassword),
			},
			{ passwordIsHashed: true },
		);

		return 'created';
	}
}
