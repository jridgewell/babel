var _fooKey, _fooGetter, _fooSetter;

let field = 0;

let Foo =
/*#__PURE__*/
function () {
  function Foo() {
    babelHelpers.classCallCheck(this, Foo);
    Object.defineProperty(this, _fooKey, {
      get: _fooGetter,
      set: _fooSetter
    });
  }

  babelHelpers.createClass(Foo, [{
    key: "test",
    value: function test() {
      babelHelpers.classPrivateFieldBase(this, _fooKey)[_fooKey] += 1;
    }
  }]);
  return Foo;
}();

_fooKey = babelHelpers.classPrivateFieldKey("foo");

_fooGetter = function foo() {
  return field;
}

_fooSetter = function foo(v) {
  field = v;
}
