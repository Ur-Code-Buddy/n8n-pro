import { useSettingsSectionsCollapse } from './useSettingsSectionsCollapse';

describe('useSettingsSectionsCollapse', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('defaults every section to expanded (not collapsed)', () => {
		const { isCollapsed } = useSettingsSectionsCollapse();

		expect(isCollapsed('workspace')).toBe(false);
		expect(isCollapsed('advanced')).toBe(false);
	});

	it('toggling a section flips its collapsed state and persists it', () => {
		const { isCollapsed, toggle } = useSettingsSectionsCollapse();

		toggle('advanced');
		expect(isCollapsed('advanced')).toBe(true);
		expect(localStorage.getItem('n8n:sidebar:settings-section-advanced')).toBe('true');

		toggle('advanced');
		expect(isCollapsed('advanced')).toBe(false);
		expect(localStorage.getItem('n8n:sidebar:settings-section-advanced')).toBe('false');
	});

	it('tracks each section id independently', () => {
		const { isCollapsed, toggle } = useSettingsSectionsCollapse();

		toggle('workspace');

		expect(isCollapsed('workspace')).toBe(true);
		expect(isCollapsed('ai')).toBe(false);
	});

	it('restores collapsed state that was persisted by a previous instance', () => {
		localStorage.setItem('n8n:sidebar:settings-section-usersAndAccess', 'true');

		const { isCollapsed } = useSettingsSectionsCollapse();

		expect(isCollapsed('usersAndAccess')).toBe(true);
	});
});
