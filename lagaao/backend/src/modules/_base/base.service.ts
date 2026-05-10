import { Model, ModelStatic, WhereOptions, FindOptions, Order } from 'sequelize';
import { buildPagination, buildPaginationMeta, toPaginatedResult } from '../../utils/pagination.util';
import { buildSort } from '../../utils/sort.util';
import { PaginatedResult, PaginationOptions } from '../../types/common.types';
import { NotFoundError } from '../../middleware/error.middleware';
import { CONSTANTS } from '../../config/constants';

/**
 * Generic base service providing standard CRUD + paginated list operations.
 * Every module service extends this and passes its Sequelize model.
 *
 * Usage:
 *   class UserService extends BaseService<UserModel> {
 *     constructor() { super(UserModel); }
 *   }
 *   export const userService = new UserService();
 */
export abstract class BaseService<T extends Model> {
  constructor(protected readonly model: ModelStatic<T>) {}

  async findAll(options: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
    where?: WhereOptions;
    include?: FindOptions['include'];
    allowedSortFields?: string[];
  } = {}): Promise<PaginatedResult<T>> {
    const pagination: PaginationOptions = buildPagination(
      options.page ?? CONSTANTS.PAGINATION.DEFAULT_PAGE,
      options.limit ?? CONSTANTS.PAGINATION.DEFAULT_LIMIT,
    );

    const order: Order = buildSort(
      options.sortBy,
      options.sortOrder,
      options.allowedSortFields,
    );

    const { rows, count } = await this.model.findAndCountAll({
      where: options.where ?? {},
      include: options.include,
      order,
      limit: pagination.limit,
      offset: pagination.offset,
      distinct: true, // required for accurate count with includes
    });

    return toPaginatedResult(rows, count, pagination);
  }

  async findById(id: number, include?: FindOptions['include']): Promise<T> {
    const record = await this.model.findByPk(id, { include });
    if (!record) throw new NotFoundError();
    return record;
  }

  async create(data: Partial<T['_creationAttributes']>): Promise<T> {
    return this.model.create(data as T['_creationAttributes']);
  }

  async updateById(
    id: number,
    data: Partial<T['_creationAttributes']>,
  ): Promise<T> {
    const record = await this.findById(id);
    return record.update(data);
  }

  async deleteById(id: number): Promise<void> {
    const record = await this.findById(id);
    await record.destroy(); // soft delete if paranoid:true
  }

  async exists(where: WhereOptions): Promise<boolean> {
    const count = await this.model.count({ where });
    return count > 0;
  }
}
