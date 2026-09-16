import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { AiModelPriceEntry } from '@n8n/api-types';
import { STORES } from '@n8n/stores';
import { useRootStore } from '@n8n/stores/useRootStore';
import { nanoid } from 'nanoid';

import { fetchAiModelPricingSettings, updateAiModelPricingSettings } from './aiModelPricing.api';

function toError(e: unknown): Error {
	return e instanceof Error ? e : new Error(String(e));
}

export const useAiModelPricingStore = defineStore(STORES.AI_MODEL_PRICING, () => {
	const rootStore = useRootStore();

	const entries = ref<AiModelPriceEntry[]>([]);
	const hasLoaded = ref(false);
	const isSaving = ref(false);
	const fetchError = ref<Error | null>(null);

	/** Looked up by the exact model identifier as it appears in a node's `model` parameter. */
	const entryByModel = computed(() => new Map(entries.value.map((entry) => [entry.model, entry])));

	async function fetchSettings(): Promise<void> {
		if (hasLoaded.value) return;
		try {
			const settings = await fetchAiModelPricingSettings(rootStore.restApiContext);
			entries.value = settings.entries;
			hasLoaded.value = true;
			fetchError.value = null;
		} catch (error) {
			fetchError.value = toError(error);
		}
	}

	function addEntry(): AiModelPriceEntry {
		const entry: AiModelPriceEntry = {
			id: nanoid(),
			provider: '',
			model: '',
			inputPricePerMillionTokens: 0,
			outputPricePerMillionTokens: 0,
		};
		entries.value = [...entries.value, entry];
		return entry;
	}

	function updateEntry(id: string, patch: Partial<Omit<AiModelPriceEntry, 'id'>>): void {
		entries.value = entries.value.map((entry) =>
			entry.id === id ? { ...entry, ...patch } : entry,
		);
	}

	function removeEntry(id: string): void {
		entries.value = entries.value.filter((entry) => entry.id !== id);
	}

	async function save(): Promise<boolean> {
		isSaving.value = true;
		try {
			const settings = await updateAiModelPricingSettings(rootStore.restApiContext, {
				entries: entries.value,
			});
			entries.value = settings.entries;
			fetchError.value = null;
			return true;
		} catch (error) {
			fetchError.value = toError(error);
			return false;
		} finally {
			isSaving.value = false;
		}
	}

	function getEntryForModel(model: string | undefined): AiModelPriceEntry | undefined {
		if (!model) return undefined;
		return entryByModel.value.get(model);
	}

	return {
		entries,
		hasLoaded,
		isSaving,
		fetchError,
		fetchSettings,
		addEntry,
		updateEntry,
		removeEntry,
		save,
		getEntryForModel,
	};
});
