import { createComponentRenderer } from '@/__tests__/render';
import type { ExecutionSummary } from 'n8n-workflow';
import WorkflowRecentFailuresText from './WorkflowRecentFailuresText.vue';

function makeExecution(id: string, status: ExecutionSummary['status']): ExecutionSummary {
	return {
		id,
		mode: 'manual',
		createdAt: new Date(),
		startedAt: new Date(),
		workflowId: 'wf1',
		status,
	};
}

const renderComponent = createComponentRenderer(WorkflowRecentFailuresText);

describe('WorkflowRecentFailuresText', () => {
	it('renders nothing when there are no failed executions', () => {
		const { queryByTestId } = renderComponent({
			props: {
				executions: [makeExecution('1', 'success'), makeExecution('2', 'success')],
			},
		});

		expect(queryByTestId('workflow-recent-failures')).not.toBeInTheDocument();
	});

	it('renders nothing when the execution list is empty', () => {
		const { queryByTestId } = renderComponent({ props: { executions: [] } });

		expect(queryByTestId('workflow-recent-failures')).not.toBeInTheDocument();
	});

	it('shows the failed-of-total count when at least one execution failed', () => {
		const { getByTestId } = renderComponent({
			props: {
				executions: [
					makeExecution('1', 'error'),
					makeExecution('2', 'success'),
					makeExecution('3', 'error'),
					makeExecution('4', 'success'),
				],
			},
		});

		expect(getByTestId('workflow-recent-failures')).toHaveTextContent(
			'Failed in 2 of the last 4 runs shown',
		);
	});

	it('counts "crashed" as a failure too, but not "canceled" or still-running states', () => {
		const { getByTestId } = renderComponent({
			props: {
				executions: [
					makeExecution('1', 'error'),
					makeExecution('2', 'crashed'),
					makeExecution('3', 'canceled'),
					makeExecution('4', 'waiting'),
				],
			},
		});

		expect(getByTestId('workflow-recent-failures')).toHaveTextContent(
			'Failed in 2 of the last 4 runs shown',
		);
	});
});
