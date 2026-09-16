import {
	AI_SUB_CONNECTIONS_COACHMARK_KEY,
	useAiSubConnectionsCoachmark,
} from './useAiSubConnectionsCoachmark';

const isCalloutDismissedMock = vi.fn((_callout: string) => false);
const dismissCalloutMock = vi.fn(async (_callout: string) => {});

vi.mock('@/app/composables/useCalloutHelpers', () => ({
	useCalloutHelpers: () => ({
		isCalloutDismissed: isCalloutDismissedMock,
		dismissCallout: dismissCalloutMock,
	}),
}));

describe('useAiSubConnectionsCoachmark', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		isCalloutDismissedMock.mockReturnValue(false);
	});

	it('shows the coachmark when the callout has not been dismissed', () => {
		const { shouldShowCoachmark } = useAiSubConnectionsCoachmark();

		expect(shouldShowCoachmark.value).toBe(true);
		expect(isCalloutDismissedMock).toHaveBeenCalledWith(AI_SUB_CONNECTIONS_COACHMARK_KEY);
	});

	it('hides the coachmark once the callout has been dismissed', () => {
		isCalloutDismissedMock.mockReturnValue(true);

		const { shouldShowCoachmark } = useAiSubConnectionsCoachmark();

		expect(shouldShowCoachmark.value).toBe(false);
	});

	it('persists dismissal via the shared callout key when dismissed', async () => {
		const { onDismissCoachmark } = useAiSubConnectionsCoachmark();

		await onDismissCoachmark();

		expect(dismissCalloutMock).toHaveBeenCalledWith(AI_SUB_CONNECTIONS_COACHMARK_KEY);
	});
});
