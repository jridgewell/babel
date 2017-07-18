import syntaxNumericSeparator from "babel-plugin-syntax-numeric-separator";

export default function ({ types: t }) {

  function replaceNumberArg({ node }) {
    if (node.callee.name !== "Number") {
      return;
    }
    const arg = node.arguments[0];
    if (!t.isStringLiteral(arg)) {
      return;
    }
    arg.value = arg.value.replace(/_/g, "");
  }

  return {
    inherits: syntaxNumericSeparator,

    visitor: {
      CallExpression: replaceNumberArg,
      NewExpression: replaceNumberArg,
    },
  };
}
