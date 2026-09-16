import { useRouter } from 'vue-router';
import { useUserHelpers } from './useUserHelpers';
import { useAiGateway } from './useAiGateway';
import { computed } from 'vue';
import type { IMenuItem } from '@n8n/design-system';
import { useI18n } from '@n8n/i18n';
import { VIEWS } from '../constants';
import { useUIStore } from '../stores/ui.store';
import { useSettingsStore } from '../stores/settings.store';
import { hasPermission } from '../utils/rbac/permissions';
import { MIGRATION_REPORT_TARGET_VERSION } from '@n8n/api-types';
import { useEnvFeatureFlag } from '@/features/shared/envFeatureFlag/useEnvFeatureFlag';

/**
 * Settings items are grouped into these sections in the sidebar. Ids are
 * mapped to i18n labels in `SECTION_ORDER` below; an item whose id isn't
 * listed in `SECTION_BY_ITEM_ID` (e.g. a module-registered item) falls back
 * to the 'more' section.
 */
export type SettingsSectionId =
	| 'workspace'
	| 'usersAndAccess'
	| 'ai'
	| 'infrastructure'
	| 'sourceControl'
	| 'advanced'
	| 'more';

export interface SettingsSection {
	id: SettingsSectionId;
	label: string;
	items: IMenuItem[];
}

const SECTION_ORDER: SettingsSectionId[] = [
	'workspace',
	'usersAndAccess',
	'ai',
	'infrastructure',
	'sourceControl',
	'advanced',
	'more',
];

const SECTION_BY_ITEM_ID: Record<string, SettingsSectionId> = {
	'settings-usage-and-plan': 'workspace',
	'settings-personal': 'workspace',
	'settings-api': 'workspace',
	'settings-users': 'usersAndAccess',
	'settings-project-roles': 'usersAndAccess',
	'settings-sso': 'usersAndAccess',
	'settings-ldap': 'usersAndAccess',
	'settings-security': 'usersAndAccess',
	'settings-ai': 'ai',
	'settings-n8n-connect': 'ai',
	'settings-credential-resolvers': 'ai',
	'settings-workersview': 'infrastructure',
	'settings-log-streaming': 'infrastructure',
	'settings-opentelemetry': 'infrastructure',
	'settings-community-nodes': 'infrastructure',
	'settings-source-control': 'sourceControl',
	'settings-external-secrets': 'advanced',
	'settings-encryption-keys': 'advanced',
	'settings-migration-report': 'advanced',
};

export function useSettingsItems() {
	const router = useRouter();
	const i18n = useI18n();
	const uiStore = useUIStore();
	const settingsStore = useSettingsStore();
	const { canUserAccessRouteByName } = useUserHelpers(router);
	const { balance } = useAiGateway();
	const { check: envFeatureFlagCheck } = useEnvFeatureFlag();

	const settingsItems = computed<IMenuItem[]>(() => {
		const menuItems: IMenuItem[] = [
			{
				id: 'settings-usage-and-plan',
				icon: 'chart-column-decreasing',
				label: i18n.baseText('settings.usageAndPlan.title'),
				position: 'top',
				available: canUserAccessRouteByName(VIEWS.USAGE),
				route: { to: { name: VIEWS.USAGE } },
			},
			{
				id: 'settings-personal',
				icon: 'circle-user-round',
				label: i18n.baseText('settings.personal'),
				position: 'top',
				available: canUserAccessRouteByName(VIEWS.PERSONAL_SETTINGS),
				route: { to: { name: VIEWS.PERSONAL_SETTINGS } },
			},
			{
				id: 'settings-users',
				icon: 'user-round',
				label: i18n.baseText('settings.users'),
				position: 'top',
				available: canUserAccessRouteByName(VIEWS.USERS_SETTINGS),
				route: { to: { name: VIEWS.USERS_SETTINGS } },
			},
			{
				id: 'settings-ai',
				icon: 'sparkles',
				label: i18n.baseText('settings.ai'),
				position: 'top',
				available:
					settingsStore.isAiAssistantEnabled && canUserAccessRouteByName(VIEWS.AI_SETTINGS),
				route: { to: { name: VIEWS.AI_SETTINGS } },
			},
			{
				id: 'settings-n8n-connect',
				icon: 'plug-zap',
				label: i18n.baseText('settings.n8nConnect'),
				position: 'top',
				available:
					settingsStore.isAiGatewayEnabled && canUserAccessRouteByName(VIEWS.AI_GATEWAY_SETTINGS),
				route: { to: { name: VIEWS.AI_GATEWAY_SETTINGS } },
				creditsTag:
					balance.value !== undefined
						? i18n.baseText('aiGateway.wallet.balanceRemaining', {
								interpolate: { balance: `$${Number(balance.value).toFixed(2)}` },
							})
						: undefined,
			},
			{
				id: 'settings-project-roles',
				icon: 'user-round',
				label: i18n.baseText('settings.projectRoles'),
				position: 'top',
				available: canUserAccessRouteByName(VIEWS.PROJECT_ROLES_SETTINGS),
				route: { to: { name: VIEWS.PROJECT_ROLES_SETTINGS } },
				new: true,
			},
			{
				id: 'settings-api',
				icon: 'plug',
				label: i18n.baseText('settings.n8napi'),
				position: 'top',
				available: settingsStore.isPublicApiEnabled && canUserAccessRouteByName(VIEWS.API_SETTINGS),
				route: { to: { name: VIEWS.API_SETTINGS } },
			},
			{
				id: 'settings-external-secrets',
				icon: 'vault',
				label: i18n.baseText('settings.externalSecrets.title'),
				position: 'top',
				available: canUserAccessRouteByName(VIEWS.EXTERNAL_SECRETS_SETTINGS),
				route: { to: { name: VIEWS.EXTERNAL_SECRETS_SETTINGS } },
			},
			{
				id: 'settings-credential-resolvers',
				icon: 'key-round',
				label: i18n.baseText('credentialResolver.view.title'),
				position: 'top',
				available: canUserAccessRouteByName(VIEWS.RESOLVERS),
				route: { to: { name: VIEWS.RESOLVERS } },
			},
			{
				id: 'settings-source-control',
				icon: 'git-branch',
				label: i18n.baseText('settings.sourceControl.title'),
				position: 'top',
				available: canUserAccessRouteByName(VIEWS.SOURCE_CONTROL),
				route: { to: { name: VIEWS.SOURCE_CONTROL } },
			},
			{
				id: 'settings-sso',
				icon: 'user-lock',
				label: i18n.baseText('settings.sso'),
				position: 'top',
				available: canUserAccessRouteByName(VIEWS.SSO_SETTINGS),
				route: { to: { name: VIEWS.SSO_SETTINGS } },
			},
			{
				id: 'settings-encryption-keys',
				icon: 'key-round',
				label: i18n.baseText('settings.encryptionKeys'),
				position: 'top',
				available:
					envFeatureFlagCheck.value('ENCRYPTION_KEY_ROTATION') &&
					canUserAccessRouteByName(VIEWS.ENCRYPTION_KEYS_SETTINGS),
				route: { to: { name: VIEWS.ENCRYPTION_KEYS_SETTINGS } },
			},
			{
				id: 'settings-security',
				icon: 'shield',
				label: i18n.baseText('settings.security'),
				position: 'top',
				available: canUserAccessRouteByName(VIEWS.SECURITY_SETTINGS),
				route: { to: { name: VIEWS.SECURITY_SETTINGS } },
			},
			{
				id: 'settings-ldap',
				icon: 'network',
				label: i18n.baseText('settings.ldap'),
				position: 'top',
				available: canUserAccessRouteByName(VIEWS.LDAP_SETTINGS),
				route: { to: { name: VIEWS.LDAP_SETTINGS } },
			},
			{
				id: 'settings-workersview',
				icon: 'waypoints',
				label: i18n.baseText('mainSidebar.workersView'),
				position: 'top',
				available:
					settingsStore.isQueueModeEnabled &&
					hasPermission(['rbac'], { rbac: { scope: 'workersView:manage' } }),
				route: { to: { name: VIEWS.WORKER_VIEW } },
			},
		];

		menuItems.push({
			id: 'settings-log-streaming',
			icon: 'log-in',
			label: i18n.baseText('settings.log-streaming'),
			position: 'top',
			available: canUserAccessRouteByName(VIEWS.LOG_STREAMING_SETTINGS),
			route: { to: { name: VIEWS.LOG_STREAMING_SETTINGS } },
		});

		menuItems.push({
			id: 'settings-opentelemetry',
			icon: 'telescope',
			label: i18n.baseText('settings.opentelemetry'),
			position: 'top',
			available:
				settingsStore.isModuleActive('otel') &&
				hasPermission(['rbac'], { rbac: { scope: 'otel:manage' } }),
			route: { to: { name: VIEWS.OPENTELEMETRY_SETTINGS } },
		});

		menuItems.push({
			id: 'settings-community-nodes',
			icon: 'box',
			label: i18n.baseText('settings.communityNodes'),
			position: 'top',
			available: canUserAccessRouteByName(VIEWS.COMMUNITY_NODES),
			route: { to: { name: VIEWS.COMMUNITY_NODES } },
		});

		if (MIGRATION_REPORT_TARGET_VERSION) {
			menuItems.push({
				id: 'settings-migration-report',
				icon: 'list-checks',
				label: i18n.baseText('settings.migrationReport'),
				position: 'top',
				available: canUserAccessRouteByName(VIEWS.MIGRATION_REPORT),
				route: { to: { name: VIEWS.MIGRATION_REPORT } },
			});
		}

		// Append module-registered settings sidebar items.
		const moduleItems = uiStore.settingsSidebarItems;

		return menuItems.concat(moduleItems.filter((item) => !menuItems.some((m) => m.id === item.id)));
	});

	const visibleSettingsItems = computed(() => settingsItems.value.filter((item) => item.available));

	const sectionLabels: Record<SettingsSectionId, string> = {
		workspace: i18n.baseText('settings.sections.workspace'),
		usersAndAccess: i18n.baseText('settings.sections.usersAndAccess'),
		ai: i18n.baseText('settings.sections.ai'),
		infrastructure: i18n.baseText('settings.sections.infrastructure'),
		sourceControl: i18n.baseText('settings.sections.sourceControl'),
		advanced: i18n.baseText('settings.sections.advanced'),
		more: i18n.baseText('settings.sections.more'),
	};

	const settingsSections = computed<SettingsSection[]>(() => {
		const bySectionId = new Map<SettingsSectionId, IMenuItem[]>();

		visibleSettingsItems.value.forEach((item) => {
			const sectionId = SECTION_BY_ITEM_ID[item.id] ?? 'more';
			const items = bySectionId.get(sectionId) ?? [];
			items.push(item);
			bySectionId.set(sectionId, items);
		});

		return SECTION_ORDER.filter((id) => (bySectionId.get(id)?.length ?? 0) > 0).map((id) => ({
			id,
			label: sectionLabels[id],
			items: bySectionId.get(id) ?? [],
		}));
	});

	return { settingsItems: visibleSettingsItems, settingsSections };
}
