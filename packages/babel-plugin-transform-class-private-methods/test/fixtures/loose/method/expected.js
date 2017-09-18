var _fooKey, _foo;

let Foo =
/*#__PURE__*/
function () {
  function Foo() {
    babelHelpers.classCallCheck(this, Foo);
    Object.defineProperty(this, _fooKey, {
      value: _foo
    });
  }

  babelHelpers.createClass(Foo, [{
    key: "test",
    value: function test() {
      const foo = babelHelpers.classPrivateFieldBase(this, _fooKey)[_fooKey];

      foo();

      babelHelpers.classPrivateFieldBase(this, _fooKey)[_fooKey]();
    }
  }]);
  return Foo;
}();

_fooKey = babelHelpers.classPrivateFieldKey("foo");

_foo = function foo() {
  babelHelpers.classPrivateFieldBase(this, _fooKey)[_fooKey];
}
