import { reactive, ref } from 'vue';
import { fireEvent, waitFor } from '@testing-library/vue';
import { createComponentRenderer } from '@/__tests__/render';
import { createTestingPinia } from '@pinia/testing';
import type { AiModelPriceEntry } from '@n8n/api-types';
import SettingsAiModelPricingView from './SettingsAiModelPricingView.vue';

const entriesRef = ref<AiModelPriceEntry[]>([]);
const fetchSettingsMock = vi.fn();
const addEntryMock = vi.fn();
const removeEntryMock = vi.fn();
const updateEntryMock = vi.fn();
const saveMock = vi.fn(async () => true);
const isSavingRef = ref(false);

// A real Pinia store is a `reactive()` object, which auto-unwraps nested
// refs when accessed as a property (e.g. `pricingStore.entries` in a
// template). A plain object here would NOT auto-unwrap, since only a
// top-level `<script setup>` binding gets that treatment automatically --
// so this mock is wrapped in `reactive()` to match real store behavior.
vi.mock('@/features/ai/modelPricing/aiModelPricing.store', () => ({
	useAiModelPricingStore: () =>
		reactive({
			entries: entriesRef,
			isSaving: isSavingRef,
			fetchSettings: fetchSettingsMock,
			addEntry: addEntryMock,
			removeEntry: removeEntryMock,
			updateEntry: updateEntryMock,
			save: saveMock,
		}),
}));

const renderComponent = createComponentRenderer(SettingsAiModelPricingView);

describe('SettingsAiModelPricingView', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		entriesRef.value = [];
		isSavingRef.value = false;
	});

	it('fetches settings on mount', () => {
		renderComponent({ pinia: createTestingPinia() });

		expect(fetchSettingsMock).toHaveBeenCalledTimes(1);
	});

	it('shows the empty state when there are no entries', () => {
		const { getByTestId, queryByTestId } = renderComponent({ pinia: createTestingPinia() });

		expect(getByTestId('model-pricing-empty-state')).toBeInTheDocument();
		expect(queryByTestId('model-pricing-table')).not.toBeInTheDocument();
	});

	it('renders one row per entry instead of the empty state', () => {
		entriesRef.value = [
			{
				id: 'e1',
				provider: 'OpenAI',
				model: 'gpt-4o-mini',
				inputPricePerMillionTokens: 0.15,
				outputPricePerMillionTokens: 0.6,
			},
		];

		const { getAllByTestId, queryByTestId } = renderComponent({ pinia: createTestingPinia() });

		expect(getAllByTestId('model-pricing-row')).toHaveLength(1);
		expect(queryByTestId('model-pricing-empty-state')).not.toBeInTheDocument();
	});

	it('adds a new row when "Add model" is clicked', async () => {
		const { getByTestId } = renderComponent({ pinia: createTestingPinia() });

		await fireEvent.click(getByTestId('model-pricing-add-row'));

		expect(addEntryMock).toHaveBeenCalledTimes(1);
	});

	it('removes the row when its remove button is clicked', async () => {
		entriesRef.value = [
			{
				id: 'e1',
				provider: 'OpenAI',
				model: 'gpt-4o-mini',
				inputPricePerMillionTokens: 0.15,
				outputPricePerMillionTokens: 0.6,
			},
		];
		const { getByTestId } = renderComponent({ pinia: createTestingPinia() });

		await fireEvent.click(getByTestId('model-pricing-remove-row'));

		expect(removeEntryMock).toHaveBeenCalledWith('e1');
	});

	it('saves via the store when Save is clicked', async () => {
		const { getByTestId } = renderComponent({ pinia: createTestingPinia() });

		await fireEvent.click(getByTestId('model-pricing-save'));

		await waitFor(() => expect(saveMock).toHaveBeenCalledTimes(1));
	});
});
