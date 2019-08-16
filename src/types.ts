import { DocumentNode, FragmentDefinitionNode, SelectionNode } from 'graphql';
import { Store } from './store';

// Helper types
export type NullPrototype = { [K in keyof ObjectConstructor]: never };
export type NullArray<T> = Array<null | T>;

// GraphQL helper types
export type SelectionSet = ReadonlyArray<SelectionNode>;
export interface Fragments {
  [fragmentName: string]: void | FragmentDefinitionNode;
}

// Scalar types are not entities as part of response data
export type Primitive = null | number | boolean | string;

export interface ScalarObject {
  __typename?: never;
  [key: string]: any;
}
export type Scalar = Primitive | ScalarObject;

export interface SystemFields {
  __typename: string;
  _id?: string | number | null;
  id?: string | number | null;
}

export type EntityField = undefined | Scalar | Scalar[];

export interface EntityFields {
  [fieldName: string]: EntityField;
}

// Entities are objects from the response data which are full GraphQL types
export type Entity = NullPrototype & SystemFields & EntityFields;

export interface DataFields {
  [fieldName: string]: Scalar | Scalar[] | Data | NullArray<Data>;
}

export type Data = SystemFields & DataFields;

// Links are relations between entities
export type Link<Key = string> = null | Key | NullArray<Key>;
export type ResolvedLink = Link<Entity>;

export interface Variables {
  [name: string]: Scalar | Scalar[] | Variables | NullArray<Variables>;
}

// This is an input operation
export interface OperationRequest {
  query: DocumentNode;
  variables?: object;
}

// This can be any field read from the cache
export type ResolverResult = Scalar | Data | NullArray<Scalar | Data>;

export interface ResolveInfo {
  fragments: Fragments;
  variables: Variables;
}

// Cache resolvers are user-defined to overwrite an entity field result
export type Resolver = (
  parent: Data,
  args: Variables,
  cache: Store,
  info: ResolveInfo
) => ResolverResult;

export interface ResolverConfig {
  [typeName: string]: {
    [fieldName: string]: Resolver;
  };
}

export type UpdateResolver<T = any> = (
  result: T,
  args: Variables,
  cache: Store,
  info: ResolveInfo
) => void;

export interface UpdatesConfig {
  [fieldName: string]: UpdateResolver;
}

// Completeness of the query result
export type Completeness = 'EMPTY' | 'PARTIAL' | 'FULL';
