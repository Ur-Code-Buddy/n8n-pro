<script setup lang="ts">
import { useI18n } from '@n8n/i18n';
import { type LlmTokenUsageData } from '@/Interface';
import { formatTokenUsageCount } from '@/app/utils/aiUtils';
import {
	formatEstimatedCostAmount,
	type EstimatedCost,
} from '@/features/execution/logs/logsCostEstimate.utils';
import { N8nText, N8nTooltip, N8nIcon } from '@n8n/design-system';
const { consumedTokens, estimatedCost } = defineProps<{
	consumedTokens: LlmTokenUsageData;
	estimatedCost?: EstimatedCost;
}>();
const i18n = useI18n();
</script>

<template>
	<div>
		<N8nText :bold="true" size="small">
			{{ i18n.baseText('runData.aiContentBlock.tokens.prompt') }}
			{{
				i18n.baseText('runData.aiContentBlock.tokens', {
					interpolate: {
						count: formatTokenUsageCount(consumedTokens, 'prompt'),
					},
				})
			}}
		</N8nText>
		<br />
		<N8nText :bold="true" size="small">
			{{ i18n.baseText('runData.aiContentBlock.tokens.completion') }}
			{{
				i18n.baseText('runData.aiContentBlock.tokens', {
					interpolate: {
						count: formatTokenUsageCount(consumedTokens, 'completion'),
					},
				})
			}}
		</N8nText>
		<template v-if="estimatedCost !== undefined">
			<br />
			<N8nText :bold="true" size="small" data-test-id="consumed-tokens-estimated-cost">
				{{ i18n.baseText('runData.aiContentBlock.cost.label') }}
				{{
					i18n.baseText('runData.aiContentBlock.cost.value', {
						interpolate: { amount: formatEstimatedCostAmount(estimatedCost.total) },
					})
				}}
				<N8nTooltip v-if="estimatedCost.isPartial" :enterable="false">
					<N8nIcon icon="circle-alert" size="small" data-test-id="consumed-tokens-cost-partial" />
					<template #content>
						{{ i18n.baseText('runData.aiContentBlock.cost.partialTooltip') }}
					</template>
				</N8nTooltip>
			</N8nText>
		</template>
	</div>
</template>
