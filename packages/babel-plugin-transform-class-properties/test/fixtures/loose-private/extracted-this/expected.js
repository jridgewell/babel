var _bar, _baz;

var foo = "bar";

var Foo = function Foo(foo) {
  babelHelpers.classCallCheck(this, Foo);

  _initialiseProps(this);
};

_bar = babelHelpers.classPrivateFieldKey("bar");
_baz = babelHelpers.classPrivateFieldKey("baz");

var _initialiseProps = function (_this) {
  Object.defineProperty(_this, _bar, {
    writable: true,
    value: _this
  });
  Object.defineProperty(_this, _baz, {
    writable: true,
    value: foo
  });
};
