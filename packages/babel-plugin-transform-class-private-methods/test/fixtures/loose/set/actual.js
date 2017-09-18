let field = 0;

class Foo {
  set #foo(v) {
    field = v;
  }

  test() {
    this.#foo = 1;
  }
}
