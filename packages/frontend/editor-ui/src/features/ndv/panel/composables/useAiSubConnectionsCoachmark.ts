import { computed } from 'vue';
import { useCalloutHelpers } from '@/app/composables/useCalloutHelpers';

export const AI_SUB_CONNECTIONS_COACHMARK_KEY = 'ai-sub-connections-hint';

/**
 * Explains the typed Tool/Memory/Model sub-connection sockets the first time
 * a user opens the NDV of a node that has any of them -- this pattern (a
 * connection type other than the regular main data flow) has no other
 * in-product explanation on first contact. One NDV panel is open at a time,
 * so unlike the canvas-side coachmark there's no need to coordinate which of
 * several rendered instances should claim it.
 */
export function useAiSubConnectionsCoachmark() {
	const { isCalloutDismissed, dismissCallout } = useCalloutHelpers();

	const shouldShowCoachmark = computed(() => !isCalloutDismissed(AI_SUB_CONNECTIONS_COACHMARK_KEY));

	async function onDismissCoachmark() {
		await dismissCallout(AI_SUB_CONNECTIONS_COACHMARK_KEY);
	}

	return {
		shouldShowCoachmark,
		onDismissCoachmark,
	};
}
