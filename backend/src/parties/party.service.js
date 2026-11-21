import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { escapeLike } from '../common/page';

const UNIQUE_VIOLATION = '23505';

export class PartyService {
  constructor(dataSource, entitySchema, partyLabel, usages) {
    this.dataSource = dataSource;
    this.entitySchema = entitySchema;
    this.partyLabel = partyLabel;
    this.usages = usages;
  }

  get repository() {
    return this.dataSource.getRepository(this.entitySchema);
  }

  async list({ page, limit, search, includeArchived }) {
    const query = this.repository.createQueryBuilder('party');
    if (!includeArchived) {
      query.andWhere('party.archived = false');
    }
    if (search) {
      query.andWhere('(party.name ILIKE :search OR party.contactDetails ILIKE :search)', {
        search: `%${escapeLike(search)}%`,
      });
    }
    const [parties, total] = await query
      .orderBy('party.name', 'ASC')
      .addOrderBy('party.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { items: parties, total, page, limit };
  }

  async get(partyId) {
    const party = await this.repository.findOneBy({ id: partyId });
    if (!party) {
      throw new NotFoundException(`${this.partyLabel} ${partyId} was not found.`);
    }
    return party;
  }

  async create({ name, contactDetails }) {
    return this.saveOrReportDuplicate(() =>
      this.repository.save(this.repository.create({ name, contactDetails: contactDetails || null })),
    );
  }

  async update(partyId, changes) {
    const party = await this.get(partyId);
    if (changes.name === undefined && changes.contactDetails === undefined) {
      throw new BadRequestException('At least one field must be provided.');
    }
    if (changes.name !== undefined) {
      party.name = changes.name;
    }
    if (changes.contactDetails !== undefined) {
      party.contactDetails = changes.contactDetails || null;
    }
    return this.saveOrReportDuplicate(() => this.repository.save(party));
  }

  async setArchived(partyId, archived) {
    const party = await this.get(partyId);
    party.archived = archived;
    return this.repository.save(party);
  }

  async delete(partyId) {
    await this.dataSource.transaction(async (manager) => {
      const party = await manager.getRepository(this.entitySchema).findOneBy({ id: partyId });
      if (!party) {
        throw new NotFoundException(`${this.partyLabel} ${partyId} was not found.`);
      }
      for (const usage of this.usages) {
        const [{ usageCount }] = await manager.query(
          `SELECT count(*)::int AS "usageCount" FROM ${usage.tableName} WHERE ${usage.columnName} = $1`,
          [partyId],
        );
        if (usageCount > 0) {
          throw new ConflictException(
            `This ${this.partyLabel.toLowerCase()} is used in ${usage.description} and cannot be deleted. Archive it instead.`,
          );
        }
      }
      await manager.getRepository(this.entitySchema).delete({ id: partyId });
    });
  }

  async saveOrReportDuplicate(saveOperation) {
    try {
      return await saveOperation();
    } catch (error) {
      if (error.code === UNIQUE_VIOLATION) {
        throw new ConflictException(`${this.partyLabel} with this name already exists.`);
      }
      throw error;
    }
  }
}
