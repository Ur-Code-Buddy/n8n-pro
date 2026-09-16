import { mockInstance } from '@n8n/backend-test-utils';

import { MessageEventBus } from '@/eventbus/message-event-bus/message-event-bus';
import { ExecutionRecoveryService } from '@/executions/execution-recovery.service';

import * as utils from './shared/utils/';

/**
 * NOTE: due to issues with mocking the MessageEventBus in multiple tests running in parallel,
 * the event bus tests are run in the eventbus.ee.test.ts file
 * The tests in this file are only checking endpoint permissions.
 */

mockInstance(MessageEventBus);
mockInstance(ExecutionRecoveryService);
const testServer = utils.setupTestServer({
	endpointGroups: ['eventBus'],
});

describe('GET /eventbus/destination', () => {
	test('should fail due to missing authentication', async () => {
		const response = await testServer.authlessAgent.get('/eventbus/destination');
		expect(response.statusCode).toBe(401);
	});
});

describe('POST /eventbus/destination', () => {
	test('should fail due to missing authentication', async () => {
		const response = await testServer.authlessAgent.post('/eventbus/destination');
		expect(response.statusCode).toBe(401);
	});
});

describe('DELETE /eventbus/destination', () => {
	test('should fail due to missing authentication', async () => {
		const response = await testServer.authlessAgent.del('/eventbus/destination');
		expect(response.statusCode).toBe(401);
	});
});
