import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';
import { useSettingsItems } from './useSettingsItems';

const mocks = vi.hoisted(() => ({
	baseText: vi.fn((key: string) => key),
	canUserAccessRouteByName: vi.fn((_routeName: string) => true),
	hasPermission: vi.fn((..._args: unknown[]) => false),
	envFlagCheck: vi.fn((_flag: string) => false),
	settingsSidebarItems: { value: [] as unknown[] },
	isAiAssistantEnabled: { value: true },
	isAiGatewayEnabled: { value: false },
	isPublicApiEnabled: { value: true },
	isQueueModeEnabled: { value: false },
	isModuleActive: vi.fn((_moduleName: string) => false),
}));

vi.mock('vue-router', () => ({
	useRouter: vi.fn(() => ({})),
}));

vi.mock('@n8n/i18n', () => ({
	useI18n: () => ({ baseText: mocks.baseText }),
}));

vi.mock('./useUserHelpers', () => ({
	useUserHelpers: () => ({ canUserAccessRouteByName: mocks.canUserAccessRouteByName }),
}));

vi.mock('./useAiGateway', () => ({
	useAiGateway: () => ({ balance: ref(undefined) }),
}));

vi.mock('../utils/rbac/permissions', () => ({
	hasPermission: (...args: unknown[]) => mocks.hasPermission(...args),
}));

vi.mock('@/features/shared/envFeatureFlag/useEnvFeatureFlag', () => ({
	useEnvFeatureFlag: () => ({ check: ref(mocks.envFlagCheck) }),
}));

vi.mock('../stores/ui.store', () => ({
	useUIStore: () => ({ settingsSidebarItems: mocks.settingsSidebarItems.value }),
}));

vi.mock('../stores/settings.store', () => ({
	useSettingsStore: () => ({
		isAiAssistantEnabled: mocks.isAiAssistantEnabled.value,
		isAiGatewayEnabled: mocks.isAiGatewayEnabled.value,
		isPublicApiEnabled: mocks.isPublicApiEnabled.value,
		isQueueModeEnabled: mocks.isQueueModeEnabled.value,
		isModuleActive: mocks.isModuleActive,
	}),
}));

describe('useSettingsItems', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
		vi.clearAllMocks();
		mocks.baseText.mockImplementation((key: string) => key);
		mocks.canUserAccessRouteByName.mockReturnValue(true);
		mocks.hasPermission.mockReturnValue(false);
		mocks.envFlagCheck.mockReturnValue(false);
		mocks.settingsSidebarItems.value = [];
		mocks.isAiAssistantEnabled.value = true;
		mocks.isAiGatewayEnabled.value = false;
		mocks.isPublicApiEnabled.value = true;
		mocks.isQueueModeEnabled.value = false;
		mocks.isModuleActive.mockReturnValue(false);
	});

	it('groups every visible item into exactly one section, in a stable order', () => {
		const { settingsSections } = useSettingsItems();

		const sectionIds = settingsSections.value.map((section) => section.id);
		expect(sectionIds).toEqual([...new Set(sectionIds)]); // no duplicate sections
		expect(sectionIds).toEqual([
			'workspace',
			'usersAndAccess',
			'ai',
			'infrastructure',
			'sourceControl',
			'advanced',
		]);

		const allItemIds = settingsSections.value.flatMap((section) => section.items.map((i) => i.id));
		expect(new Set(allItemIds).size).toBe(allItemIds.length); // no item appears twice
	});

	it('places known items in their expected section', () => {
		const { settingsSections } = useSettingsItems();
		const sectionOf = (itemId: string) =>
			settingsSections.value.find((section) => section.items.some((item) => item.id === itemId))
				?.id;

		expect(sectionOf('settings-usage-and-plan')).toBe('workspace');
		expect(sectionOf('settings-personal')).toBe('workspace');
		expect(sectionOf('settings-users')).toBe('usersAndAccess');
		expect(sectionOf('settings-sso')).toBe('usersAndAccess');
		expect(sectionOf('settings-ai')).toBe('ai');
		expect(sectionOf('settings-source-control')).toBe('sourceControl');
		expect(sectionOf('settings-external-secrets')).toBe('advanced');
	});

	it('omits a section entirely when none of its items are available', () => {
		const infrastructureRouteNames = ['WorkerView', 'LogStreamingSettingsView', 'CommunityNodes'];
		mocks.canUserAccessRouteByName.mockImplementation(
			(routeName: string) => !infrastructureRouteNames.includes(routeName),
		);
		mocks.isQueueModeEnabled.value = false; // workersview also gated on queue mode
		mocks.isModuleActive.mockReturnValue(false); // opentelemetry stays off too

		const { settingsSections } = useSettingsItems();
		const sectionIds = settingsSections.value.map((section) => section.id);

		expect(sectionIds).not.toContain('infrastructure');
	});

	it('falls back unrecognized module-registered items to the "more" section', () => {
		mocks.settingsSidebarItems.value = [
			{ id: 'settings-some-module-page', label: 'Some module page', available: true },
		];

		const { settingsSections } = useSettingsItems();
		const more = settingsSections.value.find((section) => section.id === 'more');

		expect(more?.items.map((i) => i.id)).toContain('settings-some-module-page');
	});

	it('excludes an item whose availability condition is false', () => {
		mocks.isAiAssistantEnabled.value = false;

		const { settingsSections } = useSettingsItems();
		const allItemIds = settingsSections.value.flatMap((section) => section.items.map((i) => i.id));

		expect(allItemIds).not.toContain('settings-ai');
	});
});
