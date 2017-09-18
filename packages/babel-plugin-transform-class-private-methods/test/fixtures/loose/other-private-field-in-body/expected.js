var _field, _methodKey, _method, _asyncMethodKey, _asyncMethod, _generatorMethodKey, _generatorMethod, _asyncGeneratorMethodKey, _asyncGeneratorMethod, _fooKey, _fooGetter, _fooSetter;

// Unfortunately, there's an ugly ordering that's necessary.
// transform-class-properties, then transform-class-private-methods, then transform-es2015-classes
let Foo = function Foo() {
  babelHelpers.classCallCheck(this, Foo);
  Object.defineProperty(this, _methodKey, {
    value: _method
  });
  Object.defineProperty(this, _asyncMethodKey, {
    value: _asyncMethod
  });
  Object.defineProperty(this, _generatorMethodKey, {
    value: _generatorMethod
  });
  Object.defineProperty(this, _asyncGeneratorMethodKey, {
    value: _asyncGeneratorMethod
  });
  Object.defineProperty(this, _fooKey, {
    get: _fooGetter,
    set: _fooSetter
  });

  _field.set(this, void 0);
};

_methodKey = babelHelpers.classPrivateFieldKey("method");

_method = function method() {
  babelHelpers.classPrivateFieldGet(this, _field);
}

_asyncMethodKey = babelHelpers.classPrivateFieldKey("asyncMethod");

_asyncMethod = async function asyncMethod() {
  babelHelpers.classPrivateFieldGet(this, _field);
}

_generatorMethodKey = babelHelpers.classPrivateFieldKey("generatorMethod");

_generatorMethod = function* generatorMethod() {
  babelHelpers.classPrivateFieldGet(this, _field);
}

_asyncGeneratorMethodKey = babelHelpers.classPrivateFieldKey("asyncGeneratorMethod");

_asyncGeneratorMethod = async function* asyncGeneratorMethod() {
  babelHelpers.classPrivateFieldGet(this, _field);
}

_fooKey = babelHelpers.classPrivateFieldKey("foo");

_fooGetter = function foo() {
  return babelHelpers.classPrivateFieldGet(this, _field);
}

_fooSetter = function foo(v) {
  babelHelpers.classPrivateFieldPut(this, _field, v);
}

_field = new WeakMap();
