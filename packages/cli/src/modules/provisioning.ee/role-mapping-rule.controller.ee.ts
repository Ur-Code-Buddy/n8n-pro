import {
	CreateRoleMappingRuleDto,
	ListRoleMappingRuleQueryDto,
	MoveRoleMappingRuleDto,
	PatchRoleMappingRuleDto,
} from '@n8n/api-types';
import { AuthenticatedRequest } from '@n8n/db';
import {
	Body,
	Delete,
	Get,
	GlobalScope,
	Param,
	Patch,
	Post,
	Query,
	RestController,
} from '@n8n/decorators';
import type { Response } from 'express';

import { EventService } from '@/events/event.service';

import type {
	RoleMappingRuleListResponse,
	RoleMappingRuleResponse,
} from './role-mapping-rule.service.ee';
import { RoleMappingRuleService } from './role-mapping-rule.service.ee';

@RestController('/role-mapping-rule')
export class RoleMappingRuleController {
	constructor(
		private readonly roleMappingRuleService: RoleMappingRuleService,
		private readonly eventService: EventService,
	) {}

	@Get('/')
	@GlobalScope('roleMappingRule:list')
	async list(
		_req: AuthenticatedRequest,
		_res: Response,
		@Query query: ListRoleMappingRuleQueryDto,
	): Promise<RoleMappingRuleListResponse> {
		return await this.roleMappingRuleService.list(query);
	}

	@Post('/')
	@GlobalScope('roleMappingRule:create')
	async create(
		req: AuthenticatedRequest,
		_res: Response,
		@Body body: CreateRoleMappingRuleDto,
	): Promise<RoleMappingRuleResponse> {
		const result = await this.roleMappingRuleService.create(body);

		this.eventService.emit('role-mapping-rule-created', {
			user: { id: req.user.id, email: req.user.email },
			ruleId: result.id,
			ruleType: result.type,
			expression: result.expression,
			role: result.role,
		});

		return result;
	}

	@Post('/:id/move')
	@GlobalScope('roleMappingRule:update')
	async move(
		req: AuthenticatedRequest,
		_res: Response,
		@Body body: MoveRoleMappingRuleDto,
		@Param('id') id: string,
	): Promise<RoleMappingRuleResponse> {
		const result = await this.roleMappingRuleService.move(id, body.targetIndex);

		this.eventService.emit('role-mapping-rule-updated', {
			user: { id: req.user.id, email: req.user.email },
			ruleId: result.id,
			ruleType: result.type,
			patchedFields: ['order'],
		});

		return result;
	}

	@Patch('/:id')
	@GlobalScope('roleMappingRule:update')
	// @Body at param index 2 (same as `create`) so controller-registry applies Zod to PatchRoleMappingRuleDto; @Param before @Body skips body validation.
	async patch(
		req: AuthenticatedRequest,
		_res: Response,
		@Body body: PatchRoleMappingRuleDto,
		@Param('id') id: string,
	): Promise<RoleMappingRuleResponse> {
		const result = await this.roleMappingRuleService.patch(id, body);

		this.eventService.emit('role-mapping-rule-updated', {
			user: { id: req.user.id, email: req.user.email },
			ruleId: result.id,
			ruleType: result.type,
			patchedFields: Object.keys(body),
		});

		return result;
	}

	@Delete('/:id')
	@GlobalScope('roleMappingRule:delete')
	async delete(
		req: AuthenticatedRequest,
		_res: Response,
		@Param('id') id: string,
	): Promise<{ success: true }> {
		const { ruleType } = await this.roleMappingRuleService.delete(id);

		this.eventService.emit('role-mapping-rule-deleted', {
			user: { id: req.user.id, email: req.user.email },
			ruleId: id,
			ruleType,
		});

		return { success: true };
	}
}
