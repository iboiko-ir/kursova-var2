import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { escapeLike } from '../common/page';

const UNIQUE_VIOLATION = '23505';

export class PartyService {
  constructor(dataSource, schema, label) {
    this.dataSource = dataSource;
    this.schema = schema;
    this.label = label;
  }

  get repository() {
    return this.dataSource.getRepository(this.schema);
  }

  async list({ page, limit, search, includeArchived }) {
    const query = this.repository.createQueryBuilder('party');
    if (!includeArchived) {
      query.andWhere('party.archived = false');
    }
    if (search) {
      query.andWhere("(party.name ILIKE :search OR party.contactDetails ILIKE :search)", {
        search: `%${escapeLike(search)}%`,
      });
    }
    const [items, total] = await query
      .orderBy('party.name', 'ASC')
      .addOrderBy('party.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { items, total, page, limit };
  }

  async get(id) {
    const party = await this.repository.findOneBy({ id });
    if (!party) {
      throw new NotFoundException(`${this.label} ${id} was not found.`);
    }
    return party;
  }

  async create({ name, contactDetails }) {
    return this.save(() =>
      this.repository.save(this.repository.create({ name, contactDetails: contactDetails || null })),
    );
  }

  async update(id, changes) {
    const party = await this.get(id);
    if (changes.name === undefined && changes.contactDetails === undefined) {
      throw new BadRequestException('At least one field must be provided.');
    }
    if (changes.name !== undefined) {
      party.name = changes.name;
    }
    if (changes.contactDetails !== undefined) {
      party.contactDetails = changes.contactDetails || null;
    }
    return this.save(() => this.repository.save(party));
  }

  async setArchived(id, archived) {
    const party = await this.get(id);
    party.archived = archived;
    return this.repository.save(party);
  }

  async save(operation) {
    try {
      return await operation();
    } catch (error) {
      if (error.code === UNIQUE_VIOLATION) {
        throw new ConflictException(`${this.label} with this name already exists.`);
      }
      throw error;
    }
  }
}
