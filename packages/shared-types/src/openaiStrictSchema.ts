type JsonSchemaNode = Record<string, unknown>;

function isObjectSchema(node: JsonSchemaNode): boolean {
  return (
    node.type === "object" &&
    typeof node.properties === "object" &&
    node.properties !== null
  );
}

function makeNullable(node: JsonSchemaNode): JsonSchemaNode {
  if (Array.isArray(node.anyOf)) {
    return { ...node, anyOf: [...node.anyOf, { type: "null" }] };
  }
  if (Array.isArray(node.type)) {
    return node.type.includes("null")
      ? node
      : { ...node, type: [...node.type, "null"] };
  }
  if (typeof node.type === "string") {
    return { ...node, type: [node.type, "null"] };
  }
  return { anyOf: [node, { type: "null" }] };
}

/**
 * OpenAI/Azure OpenAI structured-output "strict" mode requires every property
 * to be listed in `required` (optional fields become nullable instead of
 * omitted), forbids `additionalProperties` on objects other than `false`, and
 * rejects the `default` keyword outright. zod's `.optional()`/`.default()`
 * don't map onto that directly, so this walks zod-to-json-schema's output and
 * rewrites it into a strict-mode-compliant shape.
 */
function strictify(node: unknown): unknown {
  if (Array.isArray(node)) {
    return node.map(strictify);
  }
  if (node === null || typeof node !== "object") {
    return node;
  }

  const obj: JsonSchemaNode = { ...(node as JsonSchemaNode) };
  delete obj.default;
  delete obj.$schema;

  for (const key of Object.keys(obj)) {
    obj[key] = strictify(obj[key]);
  }

  if (isObjectSchema(obj)) {
    const properties = obj.properties as Record<string, JsonSchemaNode>;
    const originallyRequired = new Set(
      Array.isArray(obj.required) ? (obj.required as string[]) : [],
    );

    for (const key of Object.keys(properties)) {
      if (!originallyRequired.has(key)) {
        properties[key] = makeNullable(properties[key]);
      }
    }

    obj.required = Object.keys(properties);
    obj.additionalProperties = false;
  }

  return obj;
}

export function toOpenAIStrictJsonSchema<T extends object>(schema: T): T {
  return strictify(schema) as T;
}

/**
 * The inverse of the nullable rewrite above: strict mode forces the model to
 * send `null` for fields it has nothing to fill in, but zod's `.optional()`
 * only special-cases `undefined` (a bare `.optional()` string schema still
 * rejects `null`), and `.default()` only substitutes on `undefined`. Without
 * this, every "the model had nothing to say here" field fails validation
 * instead of falling back to optional/default behavior. Run this on the
 * parsed model output before handing it to a zod schema.
 */
export function denullifyModelOutput(value: unknown): unknown {
  if (value === null) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value.map(denullifyModelOutput);
  }
  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      const converted = denullifyModelOutput(entry);
      if (converted !== undefined) {
        result[key] = converted;
      }
    }
    return result;
  }
  return value;
}
