<script setup lang="ts">
import { useI18n } from '@n8n/i18n';
import type { ExecutionSummary } from 'n8n-workflow';
import { computed } from 'vue';
import { N8nIcon, N8nText } from '@n8n/design-system';

const props = defineProps<{
	executions: ExecutionSummary[];
}>();

const i18n = useI18n();

// 'crashed' is a real failure state too (the process died mid-execution,
// arguably a more urgent one than a caught 'error'), not just 'error'.
const FAILURE_STATUSES: ReadonlySet<ExecutionSummary['status']> = new Set(['error', 'crashed']);

const failedCount = computed(
	() => props.executions.filter((execution) => FAILURE_STATUSES.has(execution.status)).length,
);
</script>

<template>
	<N8nText
		v-if="failedCount > 0"
		:class="$style.recentFailures"
		size="small"
		color="danger"
		data-test-id="workflow-recent-failures"
	>
		<N8nIcon icon="triangle-alert" size="small" />
		{{
			i18n.baseText('executionsList.recentFailures', {
				interpolate: { failed: failedCount, total: executions.length },
			})
		}}
	</N8nText>
</template>

<style module lang="scss">
.recentFailures {
	display: flex;
	align-items: center;
	gap: var(--spacing--4xs);
}
</style>
