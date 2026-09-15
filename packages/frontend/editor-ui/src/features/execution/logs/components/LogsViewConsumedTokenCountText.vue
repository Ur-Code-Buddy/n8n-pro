<script setup lang="ts">
import { useI18n } from '@n8n/i18n';
import { type LlmTokenUsageData } from '@/Interface';
import { formatTokenUsageCount } from '@/app/utils/aiUtils';
import type { EstimatedCost } from '@/features/execution/logs/logsCostEstimate.utils';
import { N8nTooltip } from '@n8n/design-system';
import ConsumedTokensDetails from '@/app/components/ConsumedTokensDetails.vue';
const { consumedTokens, estimatedCost } = defineProps<{
	consumedTokens: LlmTokenUsageData;
	estimatedCost?: EstimatedCost;
}>();
const locale = useI18n();
</script>

<template>
	<N8nTooltip v-if="consumedTokens !== undefined" :enterable="false">
		<span>{{
			locale.baseText('runData.aiContentBlock.tokens', {
				interpolate: {
					count: formatTokenUsageCount(consumedTokens, 'total'),
				},
			})
		}}</span>
		<template #content>
			<ConsumedTokensDetails :consumed-tokens="consumedTokens" :estimated-cost="estimatedCost" />
		</template>
	</N8nTooltip>
</template>
