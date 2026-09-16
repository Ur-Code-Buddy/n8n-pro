import { reactive } from 'vue';

const STORAGE_PREFIX = 'n8n:sidebar:settings-section-';

/**
 * Tracks collapsed/expanded state per settings sidebar section, persisted to
 * localStorage per section id. Mirrors the pattern used for the Favorites/
 * Projects sections in ProjectNavigation.vue, generalized to an arbitrary,
 * dynamic set of section ids (sections can appear/disappear as RBAC/feature
 * flags resolve after mount, so state is keyed lazily rather than seeded
 * from a fixed list upfront).
 */
export function useSettingsSectionsCollapse() {
	const collapsed = reactive<Record<string, boolean>>({});

	function isCollapsed(id: string): boolean {
		if (!(id in collapsed)) {
			collapsed[id] = localStorage.getItem(`${STORAGE_PREFIX}${id}`) === 'true';
		}
		return collapsed[id];
	}

	function toggle(id: string) {
		collapsed[id] = !isCollapsed(id);
		localStorage.setItem(`${STORAGE_PREFIX}${id}`, String(collapsed[id]));
	}

	return { isCollapsed, toggle };
}
