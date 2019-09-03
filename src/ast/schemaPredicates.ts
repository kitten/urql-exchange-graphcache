import {
  DocumentNode,
  Kind,
  ObjectTypeDefinitionNode,
  buildClientSchema,
  printSchema,
  parse,
} from 'graphql';

const parseSchema = schema => parse(printSchema(buildClientSchema(schema)));

type RootField = 'query' | 'mutation' | 'subscription';

export class SchemaPredicates {
  schema?: DocumentNode;
  fragTypes?: { [typeCondition: string]: Array<string> };
  rootFields: { query: string; mutation: string; subscription: string };

  constructor(schema?) {
    if (schema) {
      this.schema = parseSchema(schema);
      this.fragTypes = {};
      schema.__schema.types.forEach(type => {
        if (
          type.kind === Kind.UNION_TYPE_DEFINITION ||
          type.kind === Kind.INTERFACE_TYPE_DEFINITION
        ) {
          // @ts-ignore
          this.fragTypes[type.name] = type.possibleTypes.map(
            ({ name }) => name
          );
        }
      });
      this.rootFields = {
        query: schema.__schema.queryType && schema.__schema.queryType.name,
        mutation:
          schema.__schema.mutationType && schema.__schema.mutationType.name,
        subscription:
          schema.__schema.subscriptionType &&
          schema.__schema.subscriptionType.name,
      };
    } else {
      this.rootFields = {
        query: 'Query',
        mutation: 'Mutation',
        subscription: 'Subscription',
      };
    }
  }

  getRootKey(name: RootField) {
    return this.rootFields[name];
  }

  isFieldNullable(typename: string, fieldName: string): boolean {
    if (!this.schema) return true;
    const objectTypeNode = this.schema.definitions.find(
      node =>
        node.kind === Kind.OBJECT_TYPE_DEFINITION &&
        node.name.value === typename
    );

    // TODO: error when the type does not exist
    if (!objectTypeNode) return true;

    const field = (
      (objectTypeNode as ObjectTypeDefinitionNode).fields || []
    ).find(node => node.name.value === fieldName);

    // TODO: error when the field does not exist
    if (!field) return true;

    return field.type.kind !== Kind.NON_NULL_TYPE;
  }

  isInterfaceOfType(typeCondition: string, typename: string): boolean {
    if (typename === typeCondition) return true;
    if (!this.fragTypes) return true; // TODO: heuristic here
    const possibleTypes = this.fragTypes[typeCondition];
    if (possibleTypes && possibleTypes.includes(typename)) return true;
    return false;
  }
}
