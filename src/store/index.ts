import { DocumentNode } from 'graphql';
import {
  Entity,
  Link,
  LinksMap,
  EntitiesMap,
  ResolverConfig,
  ResolverResult,
  SystemFields,
  Variables,
  Data,
  UpdatesConfig,
} from '../types';

import { keyOfEntity, joinKeys, keyOfField } from '../helpers';
import { query, write, writeFragment } from '../operations';

export class Store {
  records: EntitiesMap;
  links: LinksMap;

  resolvers: ResolverConfig;
  updates: UpdatesConfig;

  constructor(resolvers?: ResolverConfig, updates?: UpdatesConfig) {
    this.records = new Map();
    this.links = new Map();
    this.resolvers = resolvers || {};
    this.updates = updates || {};
  }

  find(key: string): Entity | null {
    const entity = this.records.get(key);
    return entity !== undefined ? entity : null;
  }

  findOrCreate(key: string): Entity {
    const entity = this.find(key);
    if (entity !== null) {
      return entity;
    }

    const record: Entity = Object.create(null);
    this.records.set(key, record);
    return record;
  }

  readLink(key: string): void | Link {
    return this.links.get(key);
  }

  remove(key: string): void {
    this.records.delete(key);
  }

  setLink(key: string, link: Link): void {
    this.links.set(key, link);
  }

  removeLink(key: string): void {
    this.links.delete(key);
  }

  resolveEntity(entity: SystemFields): Entity | null {
    const key = keyOfEntity(entity);
    return key !== null ? this.find(key) : null;
  }

  resolveProperty(
    parent: Entity,
    field: string,
    args?: null | Variables
  ): ResolverResult {
    const fieldKey = keyOfField(field, args || null);
    const fieldValue = parent[fieldKey];

    if (fieldValue === undefined && fieldKey in parent) {
      // The field is present but set to undefined, which indicates a link
      const entityKey = keyOfEntity(parent);
      if (entityKey === null) {
        return null;
      }

      const link = this.readLink(joinKeys(entityKey, fieldKey));
      if (Array.isArray(link)) {
        return link.map(key => (key !== null ? this.find(key) : null));
      } else {
        return link ? this.find(link) : null;
      }
    } else if (fieldValue === undefined) {
      return null;
    } else {
      return fieldValue;
    }
  }

  updateQuery(
    dataQuery: DocumentNode,
    updater: (data: Data | null) => Data
  ): void {
    const { data } = query(this, { query: dataQuery });
    write(this, { query: dataQuery }, updater(data));
  }

  writeFragment(dataFragment: DocumentNode, data: Data): void {
    writeFragment(this, dataFragment, data);
  }
}
