import { UnexpectedError, UserError } from 'n8n-workflow';

import { classifyHttpError } from '@/errors/http-error-classifier';
import {
	serializeInternalRestError,
	serializePublicApiError,
} from '@/errors/http-error-serializers';
import { ResponseError } from '@/errors/response-errors/abstract/response.error';
import { NotFoundError } from '@/errors/response-errors/not-found.error';
import { toImportBlockedError } from '@/modules/n8n-packages/engine/import-blocked.error';

class TestErrorWithMeta extends ResponseError {
	readonly meta: Record<string, unknown>;

	constructor(message: string, meta: Record<string, unknown>) {
		super(message, 400);
		this.meta = meta;
	}
}

describe('http-error-serializers', () => {
	it('serializePublicApiError: minimal message for ResponseError', () => {
		const descriptor = classifyHttpError(new NotFoundError('x'));
		expect(serializePublicApiError(descriptor)).toEqual({
			status: 404,
			body: { message: 'x' },
		});
	});

	it('serializeInternalRestError: includes code for ResponseError', () => {
		const descriptor = classifyHttpError(new NotFoundError('x'));
		expect(serializeInternalRestError(descriptor)).toEqual({
			status: 404,
			body: {
				code: 404,
				message: 'x',
			},
		});
	});

	it('serializePublicApiError: does not expose internal-only response error meta', () => {
		const descriptor = classifyHttpError(
			new TestErrorWithMeta('Some error with meta', {
				eulaUrl: 'https://n8n.io/legal/eula/',
			}),
		);
		expect(serializePublicApiError(descriptor)).toEqual({
			status: 400,
			body: { message: 'Some error with meta' },
		});
		expect(serializeInternalRestError(descriptor)).toEqual({
			status: 400,
			body: {
				code: 400,
				message: 'Some error with meta',
				meta: { eulaUrl: 'https://n8n.io/legal/eula/' },
			},
		});
	});

	it('serializePublicApiError: 422 with issues when only credentials are unresolved', () => {
		const issues = [
			{
				type: 'credential-unresolved' as const,
				kind: 'not_found' as const,
				sourceId: 'cred-1',
				usedByWorkflows: ['wf-1'],
			},
		];
		const descriptor = classifyHttpError(toImportBlockedError(issues));

		const result = serializePublicApiError(descriptor);
		expect(result.status).toBe(422);
		expect(result.body).toEqual({ message: expect.stringContaining('Import blocked'), issues });
	});

	it('serializePublicApiError: 409 with issues when a workflow conflicts', () => {
		const issues = [
			{
				type: 'workflow-conflict' as const,
				sourceWorkflowId: 'wf-1',
				existingWorkflowId: 'local-1',
				name: 'Existing',
			},
			{
				type: 'credential-unresolved' as const,
				kind: 'not_found' as const,
				sourceId: 'cred-1',
				usedByWorkflows: ['wf-1'],
			},
		];
		const descriptor = classifyHttpError(toImportBlockedError(issues));

		const result = serializePublicApiError(descriptor);
		expect(result.status).toBe(409);
		expect(result.body).toEqual({ message: expect.stringContaining('Import blocked'), issues });
	});

	it('both serializers map UserError to 400', () => {
		const descriptor = classifyHttpError(new UserError('bad input'));
		expect(serializePublicApiError(descriptor)).toEqual({
			status: 400,
			body: { message: 'bad input' },
		});
		expect(serializeInternalRestError(descriptor)).toEqual({
			status: 400,
			body: { code: 0, message: 'bad input' },
		});
	});

	it('public sanitizes UnexpectedError; internal keeps message', () => {
		const descriptor = classifyHttpError(new UnexpectedError('secret'));
		expect(serializePublicApiError(descriptor)).toEqual({
			status: 500,
			body: { message: 'Internal server error' },
		});
		expect(serializeInternalRestError(descriptor)).toEqual({
			status: 500,
			body: { code: 0, message: 'secret' },
		});
	});
});
