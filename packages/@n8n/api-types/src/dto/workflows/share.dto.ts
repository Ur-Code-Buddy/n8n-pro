import { z } from 'zod';

import { Z } from '../../zod-class';

const assignableWorkflowShareRoleSchema = z.enum(['workflow:editor', 'workflow:viewer']);

export class WorkflowShareTargetDto extends Z.class({
	projectId: z.string(),
	role: assignableWorkflowShareRoleSchema,
}) {}

export class ShareWorkflowBodyDto extends Z.class({
	shareWithIds: z.array(z.string()).optional(),
	shares: z.array(WorkflowShareTargetDto.schema).optional(),
}) {}
