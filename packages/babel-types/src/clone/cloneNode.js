import { NODE_FIELDS } from "../definitions";

const has = Function.call.bind(Object.prototype.hasOwnProperty);

function cloneIfNode(obj, deep, withoutLoc) {
  if (
    obj &&
    typeof obj.type === "string" &&
    // CommentLine and CommentBlock are used in File#comments, but they are
    // not defined in babel-types
    obj.type !== "CommentLine" &&
    obj.type !== "CommentBlock"
  ) {
    return cloneNode(obj, deep, withoutLoc);
  }

  return obj;
}

function cloneIfNodeOrArray(obj, deep, withoutLoc) {
  if (Array.isArray(obj)) {
    return obj.map(node => cloneIfNode(node, deep, withoutLoc));
  }
  return cloneIfNode(obj, deep, withoutLoc);
}

/**
 * Create a clone of a `node` including only properties belonging to the node.
 * If the second parameter is `false`, cloneNode performs a shallow clone.
 * If the third parameter is `true`, cloneNode does not copy the location property.
 */
export default function cloneNode<T: Object>(node: T, deep: boolean = true, withoutLoc: boolean = false): T {
  if (!node) return node;

  const { type } = node;
  const newNode = (({ type }: any): T);

  // Special-case identifiers since they are the most cloned nodes.
  if (type === "Identifier") {
    newNode.name = node.name;

    if (has(node, "optional") && typeof node.optional === "boolean") {
      newNode.optional = node.optional;
    }

    if (has(node, "typeAnnotation")) {
      newNode.typeAnnotation = deep
        ? cloneIfNodeOrArray(node.typeAnnotation, true)
        : node.typeAnnotation;
    }
  } else if (!has(NODE_FIELDS, type)) {
    throw new Error(`Unknown node type: "${type}"`);
  } else {
    for (const field of Object.keys(NODE_FIELDS[type])) {
      if (has(node, field)) {
        newNode[field] = deep
          ? cloneIfNodeOrArray(node[field], true)
          : node[field];
      }
    }
  }

  if (has(node, "loc")) {
    newNode.loc = withoutLoc ? null : node.loc;
  }
  if (has(node, "leadingComments")) {
    newNode.leadingComments = node.leadingComments;
  }
  if (has(node, "innerComments")) {
    newNode.innerComments = node.innerComments;
  }
  if (has(node, "trailingComments")) {
    newNode.trailingComments = node.trailingComments;
  }
  if (has(node, "extra")) {
    newNode.extra = {
      ...node.extra,
    };
  }

  return newNode;
}
