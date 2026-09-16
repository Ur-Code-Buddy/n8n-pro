import { setActivePinia, createPinia } from 'pinia';
import type { AiModelPricingSettings } from '@n8n/api-types';
import { useAiModelPricingStore } from './aiModelPricing.store';

const fetchMock = vi.fn();
const updateMock = vi.fn();

vi.mock('./aiModelPricing.api', () => ({
	fetchAiModelPricingSettings: (...args: unknown[]) => fetchMock(...args),
	updateAiModelPricingSettings: (...args: unknown[]) => updateMock(...args),
}));

vi.mock('@n8n/stores/useRootStore', () => ({
	useRootStore: () => ({ restApiContext: { baseUrl: 'http://localhost:5678', sessionId: '' } }),
}));

describe('useAiModelPricingStore', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
		vi.clearAllMocks();
	});

	it('fetches settings once and caches them across repeated calls', async () => {
		const settings: AiModelPricingSettings = {
			entries: [
				{
					id: 'e1',
					provider: 'OpenAI',
					model: 'gpt-4o-mini',
					inputPricePerMillionTokens: 0.15,
					outputPricePerMillionTokens: 0.6,
				},
			],
		};
		fetchMock.mockResolvedValue(settings);

		const store = useAiModelPricingStore();
		await store.fetchSettings();
		await store.fetchSettings();

		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(store.entries).toEqual(settings.entries);
	});

	it('adds a blank entry with a generated id', () => {
		const store = useAiModelPricingStore();

		const entry = store.addEntry();

		expect(store.entries).toHaveLength(1);
		expect(entry.id).toBeTruthy();
		expect(entry.provider).toBe('');
	});

	it('updates only the given entry, leaving others untouched', () => {
		const store = useAiModelPricingStore();
		const first = store.addEntry();
		const second = store.addEntry();

		store.updateEntry(second.id, { model: 'claude-sonnet-4-6' });

		expect(store.entries.find((e) => e.id === first.id)?.model).toBe('');
		expect(store.entries.find((e) => e.id === second.id)?.model).toBe('claude-sonnet-4-6');
	});

	it('removes an entry by id', () => {
		const store = useAiModelPricingStore();
		const entry = store.addEntry();

		store.removeEntry(entry.id);

		expect(store.entries).toHaveLength(0);
	});

	it('saves the current entries and reports success', async () => {
		const store = useAiModelPricingStore();
		store.addEntry();
		updateMock.mockResolvedValue({ entries: store.entries });

		const success = await store.save();

		expect(success).toBe(true);
		expect(updateMock).toHaveBeenCalledWith(expect.anything(), { entries: store.entries });
	});

	it('reports failure and keeps existing entries when saving errors', async () => {
		const store = useAiModelPricingStore();
		store.addEntry();
		updateMock.mockRejectedValue(new Error('network error'));

		const success = await store.save();

		expect(success).toBe(false);
		expect(store.fetchError).toBeInstanceOf(Error);
	});

	it('looks up the price entry for a model, case-sensitively matching the exact stored identifier', async () => {
		fetchMock.mockResolvedValue({
			entries: [
				{
					id: 'e1',
					provider: 'OpenAI',
					model: 'gpt-4o-mini',
					inputPricePerMillionTokens: 0.15,
					outputPricePerMillionTokens: 0.6,
				},
			],
		});
		const store = useAiModelPricingStore();
		await store.fetchSettings();

		expect(store.getEntryForModel('gpt-4o-mini')?.provider).toBe('OpenAI');
		expect(store.getEntryForModel('GPT-4O-MINI')).toBeUndefined();
		expect(store.getEntryForModel(undefined)).toBeUndefined();
	});
});
