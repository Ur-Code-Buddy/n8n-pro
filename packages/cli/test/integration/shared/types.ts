import type { CredentialPayload } from '@n8n/backend-test-utils';
import type { CredentialsEntity, Project, User, ICredentialsDb } from '@n8n/db';
import type { Application } from 'express';
import type { Server } from 'http';
import type TestAgent from 'supertest/lib/agent';

type EndpointGroup =
	| 'health'
	| 'me'
	| 'users'
	| 'auth'
	| 'oauth1'
	| 'oauth2'
	| 'owner'
	| 'passwordReset'
	| 'credentials'
	| 'workflows'
	| 'publicApi'
	| 'community-packages'
	| 'ldap'
	| 'saml'
	| 'sourceControl'
	| 'eventBus'
	| 'variables'
	| 'annotationTags'
	| 'tags'
	| 'externalSecrets'
	| 'mfa'
	| 'metrics'
	| 'executions'
	| 'workflowHistory'
	| 'binaryData'
	| 'invitations'
	| 'debug'
	| 'project'
	| 'role'
	| 'roleMappingRule'
	| 'dynamic-node-parameters'
	| 'apiKeys'
	| 'evaluation'
	| 'ai'
	| 'folder'
	| 'insights'
	| 'module-settings'
	| 'security-settings'
	| 'data-table'
	| 'third-party-licenses'
	| 'mcp'
	| 'workflowDependencies'
	| 'encryption-keys';

type ModuleName =
	| 'insights'
	| 'external-secrets'
	| 'community-packages'
	| 'data-table'
	| 'mcp'
	| 'oauth-server'
	| 'dynamic-credentials'
	| 'log-streaming'
	| 'ldap'
	| 'redaction'
	| 'source-control'
	| 'token-exchange';

export interface SetupProps {
	endpointGroups?: EndpointGroup[];
	/**
	 * @deprecated No-op. All features are always enabled now that license
	 * gating has been removed; this is kept only so the ~40 pre-existing call
	 * sites that still pass it don't need individual edits.
	 */
	enabledFeatures?: string[];
	/** @deprecated No-op, see {@link enabledFeatures}. */
	quotas?: Partial<Record<string, number>>;
	modules?: ModuleName[];
}

export type SuperAgentTest = TestAgent;

/**
 * No-op stand-in for the old `LicenseMocker`. Every feature is unconditionally
 * enabled now, so these methods do nothing; they exist only so pre-existing
 * `testServer.license.enable(...)`/`.disable(...)` call sites keep compiling.
 */
export interface NoOpLicenseMocker {
	enable(feature: string): void;
	disable(feature: string): void;
	setQuota(key: string, value: number): void;
	setDefaults(opts: { features?: string[]; quotas?: Partial<Record<string, number>> }): void;
	reset(): void;
}

export interface TestServer {
	app: Application;
	httpServer: Server;
	authAgentFor: (user: User) => TestAgent;
	publicApiAgentFor: (user: User) => TestAgent;
	publicApiAgentWithApiKey: (apiKey: string) => TestAgent;
	publicApiAgentWithoutApiKey: () => TestAgent;
	authlessAgent: TestAgent;
	restlessAgent: TestAgent;
	/** @deprecated No-op, see {@link NoOpLicenseMocker}. */
	license: NoOpLicenseMocker;
}

export type SaveCredentialFunction = (
	credentialPayload: CredentialPayload,
	options: { user: User } | { project: Project },
) => Promise<CredentialsEntity & ICredentialsDb>;
