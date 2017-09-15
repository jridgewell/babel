import nameFunction from "babel-helper-function-name";
import template from "babel-template";
import syntaxClassPrivateMethods from "babel-plugin-syntax-class-private-methods";

export default function({ types: t }) {
  function collectPropertiesVisitor(body, propNames) {
    for (const path of body.get("body")) {
      if (path.isClassMethod({ kind: "constructor" })) {
        propNames.constructor = path;
        continue;
      }

      if (!path.isClassPrivateMethod()) continue;

      const { node } = path;
      const { key, kind, static: isStatic } = node;
      const { name } = key.id;
      const seen = propNames.privateProps;

      let descriptor = seen[name];
      if (descriptor) {
        if (kind === "method" || descriptor.method || descriptor.static !== isStatic) {
          throw path.buildCodeFrameError("duplicate class field");
        }
      } else {
        descriptor = seen[name] = {
          name,
          get: null,
          set: null,
          method: null,
          static: false,
        };
      }

      descriptor[kind] = t.functionExpression(
        node.id,
        node.params,
        node.body,
        node.generator,
        node.async,
      );
      descriptor.static = isStatic;
    }
  }

  const privateNameRemapper = {
    PrivateName(path) {
      const { node, parent, parentPath, scope } = path;
      if (node.id.name !== this.name) {
        return;
      }
      if (!parentPath.isMemberExpression()) return;

      const grandParentPath = parentPath.parentPath;
      const { object } = parent;

      let replacePath = parentPath;
      let replaceWith = t.callExpression(this.get, [object, this.privateMap]);

      if (
        grandParentPath.isAssignmentExpression() ||
        grandParentPath.isUpdateExpression()
      ) {
        const { node } = grandParentPath;
        let assign;
        let memo;
        let postfix;

        if (grandParentPath.isAssignmentExpression({ operator: "=" })) {
          assign = node.right;
        } else {
          const { right, operator } = node;
          memo = scope.maybeGenerateMemoised(object);

          if (memo) {
            replaceWith.arguments[0] = memo;
            memo = t.assignmentExpression("=", memo, object);
          }

          if (grandParentPath.isUpdateExpression({ prefix: false })) {
            postfix = scope.generateUidIdentifierBasedOnNode(parent);
            scope.push({ id: postfix });
            replaceWith = t.assignmentExpression(
              "=",
              postfix,
              t.unaryExpression("+", replaceWith),
            );
          }

          assign = t.binaryExpression(
            operator.slice(0, -1),
            replaceWith,
            right || t.numericLiteral(1),
          );
        }

        replacePath = grandParentPath;
        replaceWith = t.callExpression(this.put, [
          memo || object,
          this.privateMap,
          assign,
        ]);

        if (postfix) {
          replaceWith = t.sequenceExpression([replaceWith, postfix]);
        }
      } else if (grandParentPath.isCallExpression({ callee: parent })) {
        const memo = scope.maybeGenerateMemoised(object);
        if (memo) {
          replaceWith.arguments[0] = t.assignmentExpression("=", memo, object);
        }

        const call = t.clone(grandParentPath.node);
        call.callee = t.memberExpression(replaceWith, t.identifier("call"));
        call.arguments.unshift(memo || object);

        replacePath = grandParentPath;
        replaceWith = call;
      }

      replacePath.replaceWith(replaceWith);
    },

    ClassBody(path) {
      path.skip();
    },
  };

  const privateNameRemapperLoose = {
    PrivateName(path) {
      const { parentPath, parent, node } = path;
      if (node.id.name !== this.name) {
        return;
      }

      if (parentPath.isMethod({ key: node })) {
        parent.computed = true;
        path.replaceWith(this.privateKey);
        return;
      }

      if (!parentPath.isMemberExpression()) return;

      const object = parentPath.get("object");

      object.replaceWith(
        t.callExpression(this.base, [object.node, this.privateKey]),
      );
      parent.computed = true;
      path.replaceWith(this.privateKey);
    },

    ClassBody(path) {
      path.skip();
    },
  };

  const buildPrivateProperty = template(`
    Object.defineProperty(REF, KEY, {
      // configurable is false by default
      // enumerable is false by default
      writable: true,
      value: VALUE
    });
  `);

  function buildPrivateClassPropertySpec(ref, prop, klass, nodes) {
    const { node } = prop;
    const { name } = node.key.id;
    const { file } = klass.hub;
    const privateMap = klass.scope.generateDeclaredUidIdentifier(name);

    klass.traverse(privateNameRemapper, {
      name,
      privateMap,
      get: file.addHelper("classPrivateFieldGet"),
    });

    nodes.push(
      t.expressionStatement(
        t.assignmentExpression(
          "=",
          privateMap,
          t.newExpression(t.identifier("WeakMap"), []),
        ),
      ),
    );

    return t.expressionStatement(
      t.callExpression(t.memberExpression(privateMap, t.identifier("set")), [
        ref,
        node.value || klass.scope.buildUndefinedNode(),
      ]),
    );
  }

  function buildPrivateClassPropertyLoose(ref, descriptor, klass, nodes) {
    const { name, method } = descriptor;
    const { file } = klass.hub;
    const privateName = klass.scope.generateDeclaredUidIdentifier(name);
    const fnRef = klass.scope.generateDeclaredUidIdentifier(name);

    console.log(name);
    klass.traverse(privateNameRemapperLoose, { name, privateName });

    nodes.push(
      t.expressionStatement(
        t.assignmentExpression(
          "=",
          privateName,
          t.callExpression(file.addHelper("classPrivateFieldKey"), [
            t.stringLiteral(name),
          ]),
        ),
      ),
      t.expressionStatement(t.assignmentExpression("=", fnRef, method)),
    );

    return buildPrivateProperty({
      REF: ref,
      KEY: privateName,
      VALUE: fnRef,
    });
  }

  return {
    inherits: syntaxClassPrivateMethods,

    visitor: {
      Class(path) {
        const buildPrivateClassProperty = this.opts.loose
          ? buildPrivateClassPropertyLoose
          : buildPrivateClassPropertySpec;
        const isDerived = !!path.node.superClass;

        const body = path.get("body");
        const { scope } = path;

        const state = {
          privateProps: Object.create(null),
          constructor: null,
        };
        collectPropertiesVisitor(body, state);
        body.traverse(staticErrorVisitor, state);

        const { privateProps } = state;
        const propNames = Object.keys(privateProps);

        if (!propNames.length) return;

        let ref;
        if (path.isClassExpression() || !path.node.id) {
          nameFunction(path);
          ref = scope.generateUidIdentifier("class");
        } else {
          // path.isClassDeclaration() && path.node.id
          ref = path.node.id;
        }

        const nodes = [];
        let instanceBody = [];

        for (const name of propNames) {
          const prop = privateProps[name];
          if (!prop.static) continue;
          nodes.push(buildPrivateClassProperty(ref, prop, path, nodes));
        }

        if (instanceProps.length) {
          let { constructor } = state;
          if (!constructor) {
            const newConstructor = t.classMethod(
              "constructor",
              t.identifier("constructor"),
              [],
              t.blockStatement([]),
            );

            if (isDerived) {
              newConstructor.body.body.push(
                t.returnStatement(
                  t.callExpression(t.super(), [
                    t.spreadElement(t.identifier("arguments")),
                  ]),
                ),
              );
            }

            [constructor] = body.unshiftContainer("body", newConstructor);
          }

          const collisionState = {
            collision: false,
            scope: constructor.scope,
          };
          const bareSupers = [];

          if (isDerived) {
            constructor.traverse(findBareSupers, bareSupers);
          }

          if (bareSupers.length <= 1) {
            for (const prop of instanceProps) {
              prop.traverse(collisionVisitor, collisionState);
              if (collisionState.collision) break;
            }
          }

          const extract = bareSupers.length > 1 || collisionState.collision;
          const thisRef = extract
            ? scope.generateUidIdentifier("this")
            : t.thisExpression();

          for (const prop of instanceProps) {
            if (extract) {
              prop.traverse(remapThisVisitor, { thisRef });
            }

            instanceBody.push(buildPrivateClassProperty(thisRef, prop, path, nodes));
          }

          if (extract) {
            const initialisePropsRef = scope.generateUidIdentifier(
              "initialiseProps",
            );

            nodes.push(
              t.variableDeclaration("var", [
                t.variableDeclarator(
                  initialisePropsRef,
                  t.functionExpression(
                    null,
                    [thisRef],
                    t.blockStatement(instanceBody),
                  ),
                ),
              ]),
            );

            instanceBody = [
              t.expressionStatement(
                t.callExpression(initialisePropsRef, [t.thisExpression()]),
              ),
            ];
          }

          if (bareSupers.length) {
            for (const bareSuper of bareSupers) {
              bareSuper.insertAfter(instanceBody);
            }
          } else {
            constructor.get("body").unshiftContainer("body", instanceBody);
          }
        }

        for (const prop of [...staticProps, ...instanceProps]) {
          prop.remove();
        }

        if (!nodes.length) return;

        if (path.isClassExpression()) {
          scope.push({ id: ref });
          path.replaceWith(t.assignmentExpression("=", ref, path.node));
        } else {
          // path.isClassDeclaration()
          if (!path.node.id) {
            path.node.id = ref;
          }

          if (path.parentPath.isExportDeclaration()) {
            path = path.parentPath;
          }
        }

        path.insertAfter(nodes);
      },

      PrivateName(path) {
        throw path.buildCodeFrameError(
          "PrivateName is illegal outside ClassBody",
        );
      },

      ArrowFunctionExpression(path) {
        const classExp = path.get("body");
        if (!classExp.isClassExpression()) return;

        const body = classExp.get("body");
        const members = body.get("body");
        if (members.some(member => member.isProperty())) {
          path.ensureBlock();
        }
      },
    },
  };
}
