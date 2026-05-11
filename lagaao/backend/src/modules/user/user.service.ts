import { Op, Transaction } from 'sequelize';
import { sequelize }        from '../../config/database';
import { User, UserStatus } from './user.model';
import { Role }             from '../role/role.model';
import { UserRole }         from './user-role.model';
import { ActivityLog }      from '../activity-log/activity-log.model';
import { buildPagination, toPaginatedResult } from '../../utils/pagination.util';
import { buildSort }        from '../../utils/sort.util';
import { buildSearchClause, buildWhereClause, mergeWhere } from '../../utils/query-filter.util';
import { NotFoundError, ConflictError, AppError } from '../../middleware/error.middleware';
import {
  CreateUserDto, UpdateUserDto, ListUsersQueryDto,
  ChangeStatusDto, BulkActionDto, AdminChangePasswordDto, AssignRolesDto,
} from './user.validators';
import { PaginatedResult } from '../../types/common.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const USER_INCLUDES = [
  {
    model: Role,
    as: 'roles',
    through: { attributes: [] }, // exclude junction table columns
    attributes: ['id', 'name', 'slug', 'description', 'isSystem'],
  },
];

const SAFE_ATTRS: (keyof User)[] = [
  'id', 'uuid', 'name', 'email', 'phone', 'status',
  'emailVerifiedAt', 'phoneVerifiedAt', 'lastLoginAt', 'lastLoginIp',
  'meta', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy',
];

// ─── UserService ──────────────────────────────────────────────────────────────

export class UserService {

  // ── List ──────────────────────────────────────────────────────────────────

  async list(query: ListUsersQueryDto): Promise<PaginatedResult<User>> {
    const pagination = buildPagination(query.page, query.limit);
    const order      = buildSort(query.sortBy, query.sortDir, ['name', 'email', 'createdAt', 'lastLoginAt', 'status']);

    const searchClause = query.search
      ? buildSearchClause(query.search, ['name', 'email', 'phone'])
      : {};

    const filterClause = buildWhereClause({
      ...(query.status ? { status: query.status } : {}),
    });

    const where = mergeWhere(searchClause, filterClause);

    // Role filter via join
    const roleInclude: any = {
      model: Role,
      as: 'roles',
      through: { attributes: [] },
      attributes: ['id', 'name', 'slug', 'description', 'isSystem'],
      ...(query.roleId ? { where: { id: query.roleId }, required: true } : { required: false }),
    };

    const { rows, count } = await User.findAndCountAll({
      where,
      include: [roleInclude],
      attributes: SAFE_ATTRS,
      limit:   pagination.limit,
      offset:  pagination.offset,
      order,
      distinct: true,
    });

    return toPaginatedResult(rows, count, pagination);
  }

  // ── Find by UUID ──────────────────────────────────────────────────────────

  async findByUuid(uuid: string): Promise<User> {
    const user = await User.findOne({
      where: { uuid },
      attributes: SAFE_ATTRS,
      include: USER_INCLUDES,
    });
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async create(dto: CreateUserDto, actorId?: number): Promise<User> {
    const existing = await User.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictError('A user with this email already exists');

    const t = await sequelize.transaction();
    try {
      const passwordHash = await User.hashPassword(dto.password);
      const user = await User.create(
        { name: dto.name, email: dto.email, passwordHash, phone: dto.phone ?? null, status: dto.status, createdBy: actorId },
        { transaction: t },
      );

      if (dto.roleIds?.length) {
        await this.setRoles(user.id, dto.roleIds, t);
      }

      await ActivityLog.log({ userId: actorId, action: 'create', subjectType: 'User', subjectId: user.id, newValues: { email: user.email, name: user.name } });

      await t.commit();
      return this.findByUuid(user.uuid);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  // ── Update ────────────────────────────────────────────────────────────────

  async update(uuid: string, dto: UpdateUserDto, actorId?: number): Promise<User> {
    const user = await User.findOne({ where: { uuid } });
    if (!user) throw new NotFoundError('User not found');

    const oldValues = { name: user.name, phone: user.phone };
    await user.update({ ...dto, updatedBy: actorId });
    await ActivityLog.log({ userId: actorId, action: 'update', subjectType: 'User', subjectId: user.id, oldValues, newValues: dto });

    return this.findByUuid(uuid);
  }

  // ── Change Status ─────────────────────────────────────────────────────────

  async changeStatus(uuid: string, dto: ChangeStatusDto, actorId?: number): Promise<User> {
    const user = await User.findOne({ where: { uuid } });
    if (!user) throw new NotFoundError('User not found');

    const oldStatus = user.status;
    await user.update({ status: dto.status as UserStatus, updatedBy: actorId });
    await ActivityLog.log({
      userId: actorId, action: 'status_change', subjectType: 'User', subjectId: user.id,
      oldValues: { status: oldStatus },
      newValues:  { status: dto.status, reason: dto.reason },
    });

    return this.findByUuid(uuid);
  }

  // ── Admin change password ─────────────────────────────────────────────────

  async changePassword(uuid: string, dto: AdminChangePasswordDto, actorId?: number): Promise<void> {
    const user = await User.findOne({ where: { uuid } });
    if (!user) throw new NotFoundError('User not found');

    const passwordHash = await User.hashPassword(dto.newPassword);
    await user.update({ passwordHash, updatedBy: actorId });
    await ActivityLog.log({ userId: actorId, action: 'password_reset', subjectType: 'User', subjectId: user.id });
  }

  // ── Soft Delete ───────────────────────────────────────────────────────────

  async delete(uuid: string, actorId?: number): Promise<void> {
    const user = await User.findOne({ where: { uuid } });
    if (!user) throw new NotFoundError('User not found');
    if (user.id === actorId) throw new AppError('Cannot delete your own account', 422);

    await ActivityLog.log({ userId: actorId, action: 'delete', subjectType: 'User', subjectId: user.id, oldValues: { email: user.email } });
    await user.destroy();
  }

  // ── Assign Roles ──────────────────────────────────────────────────────────

  async assignRoles(uuid: string, dto: AssignRolesDto, actorId?: number): Promise<User> {
    const user = await User.findOne({ where: { uuid } });
    if (!user) throw new NotFoundError('User not found');

    const roles = await Role.findAll({ where: { id: { [Op.in]: dto.roleIds } } });
    if (roles.length !== dto.roleIds.length) throw new NotFoundError('One or more roles not found');

    await this.setRoles(user.id, dto.roleIds);
    await ActivityLog.log({
      userId: actorId, action: 'roles_assigned', subjectType: 'User', subjectId: user.id,
      newValues: { roleIds: dto.roleIds },
    });

    return this.findByUuid(uuid);
  }

  // ── Bulk Action ───────────────────────────────────────────────────────────

  async bulkAction(dto: BulkActionDto, actorId?: number): Promise<{ affected: number }> {
    const users = await User.findAll({ where: { uuid: { [Op.in]: dto.uuids } } });
    if (!users.length) throw new NotFoundError('No matching users found');

    const ids = users.map((u) => u.id);

    if (dto.action === 'delete') {
      // Prevent self-deletion
      const filtered = users.filter((u) => u.id !== actorId);
      for (const u of filtered) await u.destroy();
      await ActivityLog.log({ userId: actorId, action: 'bulk_delete', subjectType: 'User', newValues: { count: filtered.length } });
      return { affected: filtered.length };
    }

    const statusMap: Record<string, UserStatus> = {
      activate:   'active',
      deactivate: 'inactive',
      ban:        'banned',
    };
    const newStatus = statusMap[dto.action];
    await User.update({ status: newStatus, updatedBy: actorId }, { where: { id: { [Op.in]: ids } } });
    await ActivityLog.log({ userId: actorId, action: `bulk_${dto.action}`, subjectType: 'User', newValues: { count: ids.length, status: newStatus } });

    return { affected: ids.length };
  }

  // ── User Activity ─────────────────────────────────────────────────────────

  async getActivity(uuid: string, limit = 30): Promise<ActivityLog[]> {
    const user = await User.findOne({ where: { uuid }, attributes: ['id'] });
    if (!user) throw new NotFoundError('User not found');

    return ActivityLog.findAll({
      where: { userId: user.id },
      limit,
      order: [['createdAt', 'DESC']],
    });
  }

  // ── Avatar ────────────────────────────────────────────────────────────────

  async updateAvatar(uuid: string, avatarUrl: string, actorId?: number): Promise<User> {
    const user = await User.findOne({ where: { uuid } });
    if (!user) throw new NotFoundError('User not found');

    const meta = { ...(user.meta ?? {}), avatarUrl };
    await user.update({ meta, updatedBy: actorId });
    return this.findByUuid(uuid);
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private async setRoles(userId: number, roleIds: number[], t?: Transaction): Promise<void> {
    await UserRole.destroy({ where: { userId }, transaction: t });
    const rows = roleIds.map((roleId) => ({
      userId, roleId, scopeType: null, scopeId: null, assignedBy: null, expiresAt: null,
    }));
    await UserRole.bulkCreate(rows as any, { transaction: t });
  }
}

export const userService = new UserService();
