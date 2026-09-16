<script setup lang="ts">
import { onMounted } from 'vue';
import {
	N8nButton,
	N8nHeading,
	N8nIconButton,
	N8nInput,
	N8nInputNumber,
	N8nText,
} from '@n8n/design-system';
import { useI18n } from '@n8n/i18n';
import { useDocumentTitle } from '@/app/composables/useDocumentTitle';
import { useToast } from '@/app/composables/useToast';
import { useAiModelPricingStore } from '@/features/ai/modelPricing/aiModelPricing.store';

const i18n = useI18n();
const documentTitle = useDocumentTitle();
const toast = useToast();
const pricingStore = useAiModelPricingStore();

documentTitle.set(i18n.baseText('settings.modelPricing.title'));

onMounted(async () => {
	await pricingStore.fetchSettings();
});

async function onSave() {
	const success = await pricingStore.save();
	if (success) {
		toast.showToast({
			title: i18n.baseText('settings.modelPricing.saved'),
			message: '',
			type: 'success',
		});
	} else {
		toast.showToast({
			title: i18n.baseText('settings.modelPricing.saveError'),
			message: '',
			type: 'error',
		});
	}
}
</script>

<template>
	<div>
		<N8nHeading size="2xlarge" tag="h1">
			{{ i18n.baseText('settings.modelPricing.title') }}
		</N8nHeading>
		<N8nText color="text-light" :class="$style.description">
			{{ i18n.baseText('settings.modelPricing.description') }}
		</N8nText>

		<N8nText
			v-if="pricingStore.entries.length === 0"
			tag="p"
			color="text-light"
			:class="$style.emptyState"
			data-test-id="model-pricing-empty-state"
		>
			{{ i18n.baseText('settings.modelPricing.emptyState') }}
		</N8nText>

		<div v-else :class="$style.table" data-test-id="model-pricing-table">
			<div :class="$style.headerRow">
				<N8nText size="small" color="text-light" bold>{{
					i18n.baseText('settings.modelPricing.col.provider')
				}}</N8nText>
				<N8nText size="small" color="text-light" bold>{{
					i18n.baseText('settings.modelPricing.col.model')
				}}</N8nText>
				<N8nText size="small" color="text-light" bold>{{
					i18n.baseText('settings.modelPricing.col.inputPrice')
				}}</N8nText>
				<N8nText size="small" color="text-light" bold>{{
					i18n.baseText('settings.modelPricing.col.outputPrice')
				}}</N8nText>
				<span />
			</div>
			<div
				v-for="entry in pricingStore.entries"
				:key="entry.id"
				:class="$style.row"
				data-test-id="model-pricing-row"
			>
				<N8nInput
					:model-value="entry.provider"
					:placeholder="i18n.baseText('settings.modelPricing.providerPlaceholder')"
					data-test-id="model-pricing-provider-input"
					@update:model-value="
						(value: string) => pricingStore.updateEntry(entry.id, { provider: value })
					"
				/>
				<N8nInput
					:model-value="entry.model"
					:placeholder="i18n.baseText('settings.modelPricing.modelPlaceholder')"
					data-test-id="model-pricing-model-input"
					@update:model-value="
						(value: string) => pricingStore.updateEntry(entry.id, { model: value })
					"
				/>
				<N8nInputNumber
					:model-value="entry.inputPricePerMillionTokens"
					:min="0"
					:step="0.01"
					data-test-id="model-pricing-input-price"
					@update:model-value="
						(value: number) =>
							pricingStore.updateEntry(entry.id, { inputPricePerMillionTokens: value })
					"
				/>
				<N8nInputNumber
					:model-value="entry.outputPricePerMillionTokens"
					:min="0"
					:step="0.01"
					data-test-id="model-pricing-output-price"
					@update:model-value="
						(value: number) =>
							pricingStore.updateEntry(entry.id, { outputPricePerMillionTokens: value })
					"
				/>
				<N8nIconButton
					icon="trash-2"
					variant="ghost"
					:aria-label="
						i18n.baseText('settings.modelPricing.removeRow', {
							interpolate: { model: entry.model || entry.provider },
						})
					"
					data-test-id="model-pricing-remove-row"
					@click="pricingStore.removeEntry(entry.id)"
				/>
			</div>
		</div>

		<div :class="$style.actions">
			<N8nButton
				variant="outline"
				icon="plus"
				data-test-id="model-pricing-add-row"
				@click="pricingStore.addEntry()"
			>
				{{ i18n.baseText('settings.modelPricing.addRow') }}
			</N8nButton>
			<N8nButton :loading="pricingStore.isSaving" data-test-id="model-pricing-save" @click="onSave">
				{{ i18n.baseText('settings.modelPricing.save') }}
			</N8nButton>
		</div>
	</div>
</template>

<style lang="scss" module>
.description {
	display: block;
	margin: var(--spacing--xs) 0 var(--spacing--lg);
	max-width: 640px;
}

.emptyState {
	margin-bottom: var(--spacing--lg);
}

.table {
	display: flex;
	flex-direction: column;
	gap: var(--spacing--2xs);
	margin-bottom: var(--spacing--lg);
}

.headerRow,
.row {
	display: grid;
	grid-template-columns: 1fr 1fr 160px 160px auto;
	gap: var(--spacing--2xs);
	align-items: center;
}

.headerRow {
	padding: 0 var(--spacing--2xs);
}

.actions {
	display: flex;
	gap: var(--spacing--2xs);
}
</style>
