var _foo;

var Foo = function () {
  function Foo() {
    babelHelpers.classCallCheck(this, Foo);

    _foo.set(this, function () {
      return this;
    });
  }

  babelHelpers.createClass(Foo, [{
    key: "test",
    value: function test(other) {
      var _other$obj;

      babelHelpers.privateClassPropertyGetSpec(this, _foo).call(this);
      babelHelpers.privateClassPropertyGetSpec(_other$obj = other.obj, _foo).call(_other$obj);
    }
  }]);
  return Foo;
}();

_foo = new WeakMap();