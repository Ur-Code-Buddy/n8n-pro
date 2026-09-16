import { ref } from 'vue';
import { fireEvent } from '@testing-library/vue';
import { createComponentRenderer } from '@/__tests__/render';
import { createTestingPinia } from '@pinia/testing';
import SettingsSidebar from './SettingsSidebar.vue';
import type { SettingsSection } from '../composables/useSettingsItems';

const settingsSectionsRef = ref<SettingsSection[]>([]);
const isCollapsedMock = vi.fn((_id: string) => false);
const toggleMock = vi.fn();
const fetchWalletMock = vi.fn();

vi.mock('../composables/useSettingsItems', () => ({
	useSettingsItems: () => ({ settingsSections: settingsSectionsRef }),
}));

vi.mock('../composables/useSettingsSectionsCollapse', () => ({
	useSettingsSectionsCollapse: () => ({ isCollapsed: isCollapsedMock, toggle: toggleMock }),
}));

vi.mock('../composables/useAiGateway', () => ({
	useAiGateway: () => ({ fetchWallet: fetchWalletMock, isEnabled: ref(false) }),
}));

const twoSections: SettingsSection[] = [
	{
		id: 'workspace',
		label: 'Workspace',
		items: [{ id: 'settings-personal', label: 'Personal', available: true }],
	},
	{
		id: 'advanced',
		label: 'Advanced',
		items: [{ id: 'settings-external-secrets', label: 'External Secrets', available: true }],
	},
];

const renderComponent = createComponentRenderer(SettingsSidebar);

describe('SettingsSidebar', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		isCollapsedMock.mockReturnValue(false);
		settingsSectionsRef.value = twoSections;
	});

	it('renders a section header per section when there is more than one', () => {
		const { getByTestId } = renderComponent({ pinia: createTestingPinia() });

		expect(getByTestId('settings-section-header-workspace')).toBeInTheDocument();
		expect(getByTestId('settings-section-header-advanced')).toBeInTheDocument();
	});

	it('does not render a section header when there is only one section', () => {
		settingsSectionsRef.value = [twoSections[0]];

		const { queryByTestId } = renderComponent({ pinia: createTestingPinia() });

		expect(queryByTestId('settings-section-header-workspace')).not.toBeInTheDocument();
	});

	it('toggles a section via useSettingsSectionsCollapse when its header is clicked', async () => {
		const { getByTestId } = renderComponent({ pinia: createTestingPinia() });

		await fireEvent.click(getByTestId('settings-section-header-advanced'));

		expect(toggleMock).toHaveBeenCalledWith('advanced');
	});

	it('hides a section\'s items while it is reported as collapsed', () => {
		isCollapsedMock.mockImplementation((id: string) => id === 'advanced');

		const { queryByText } = renderComponent({ pinia: createTestingPinia() });

		expect(queryByText('External Secrets')).not.toBeInTheDocument();
	});

	it('emits "return" when the back button is clicked', async () => {
		const { getByTestId, emitted } = renderComponent({ pinia: createTestingPinia() });

		await fireEvent.click(getByTestId('settings-back'));

		expect(emitted('return')).toHaveLength(1);
	});
});
