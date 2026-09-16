<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { ABOUT_MODAL_KEY } from '@/app/constants';

import { N8nIcon, N8nLink, N8nMenuItem, N8nText } from '@n8n/design-system';
import { useSettingsItems } from '../composables/useSettingsItems';
import { useSettingsSectionsCollapse } from '../composables/useSettingsSectionsCollapse';
import { useAiGateway } from '../composables/useAiGateway';
import { useI18n } from '@n8n/i18n';
import { useRootStore } from '@n8n/stores/useRootStore';
import { useUIStore } from '../stores/ui.store';

const emit = defineEmits<{
	return: [];
}>();

const i18n = useI18n();
const rootStore = useRootStore();
const uiStore = useUIStore();

const { settingsSections } = useSettingsItems();
const { fetchWallet, isEnabled } = useAiGateway();

const { isCollapsed, toggle } = useSettingsSectionsCollapse();

// A single-item section (e.g. only "More" visible) reads awkwardly as a
// collapsible header for one row, so only sections beyond the first are
// ever rendered collapsed/collapsible -- the first section always stays
// expanded and headerless, matching how the settings list read before.
const isSoleSection = computed(() => settingsSections.value.length <= 1);

onMounted(() => {
	if (isEnabled.value) void fetchWallet();
});
</script>

<template>
	<div :class="$style.container">
		<div :class="$style.returnButton" data-test-id="settings-back" @click="emit('return')">
			<i>
				<N8nIcon icon="arrow-left" />
			</i>
			<N8nText bold>{{ i18n.baseText('settings') }}</N8nText>
		</div>
		<div :class="$style.items">
			<template v-for="section in settingsSections" :key="section.id">
				<button
					v-if="!isSoleSection"
					:class="$style.sectionHeader"
					:data-test-id="`settings-section-header-${section.id}`"
					@click="toggle(section.id)"
				>
					<N8nText size="small" bold color="text-light">
						{{ section.label }}
					</N8nText>
					<N8nIcon
						icon="chevron-down"
						size="medium"
						:class="[$style.chevron, isCollapsed(section.id) ? $style.chevronCollapsed : '']"
					/>
				</button>
				<div v-if="isSoleSection || !isCollapsed(section.id)" :class="$style.sectionItems">
					<N8nMenuItem v-for="item in section.items" :key="item.id" :item="item" />
				</div>
			</template>
		</div>
		<div :class="$style.versionContainer">
			<N8nLink size="small" @click="uiStore.openModal(ABOUT_MODAL_KEY)">
				{{ i18n.baseText('settings.version') }} {{ rootStore.versionCli }}
			</N8nLink>
		</div>
	</div>
</template>

<style lang="scss" module>
.container {
	min-width: $sidebar-expanded-width;
	height: 100%;
	background-color: var(--color--background--light-3);
	border-right: var(--border);
	position: relative;
	overflow: auto;
}

.returnButton {
	padding: var(--spacing--xs);
	cursor: pointer;
	display: flex;
	gap: var(--spacing--3xs);
	align-items: center;

	&:hover {
		color: var(--color--primary);
	}
}

.items {
	display: flex;
	flex-direction: column;

	padding: 0 var(--spacing--3xs);
}

.sectionHeader {
	display: flex;
	align-items: center;
	gap: var(--spacing--4xs);
	width: calc(100% - var(--spacing--3xs) * 2);
	box-sizing: border-box;
	padding: var(--spacing--xs) var(--spacing--3xs) var(--spacing--4xs);
	margin: var(--spacing--xs) 0 0;
	background: none;
	border: none;
	border-radius: var(--spacing--4xs);
	cursor: pointer;
	color: inherit;

	&:hover {
		background-color: var(--color--background--light-1);
		color: var(--color--text--shade-1);

		.chevron {
			color: var(--color--text--shade-1);
		}
	}

	&:focus-visible {
		outline: 1px solid var(--color--secondary);
		outline-offset: -1px;
	}
}

.chevron {
	color: var(--color--text--tint-1);
	transition: transform 0.15s ease;
	flex-shrink: 0;
}

.chevronCollapsed {
	transform: rotate(-90deg);
}

.sectionItems {
	display: flex;
	flex-direction: column;
}

.versionContainer {
	padding: var(--spacing--xs);
}

@media screen and (max-height: 420px) {
	.versionContainer {
		display: none;
	}
}
</style>
