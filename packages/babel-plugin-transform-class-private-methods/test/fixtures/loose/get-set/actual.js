let field = 0;

class Foo {
  get #foo() {
    return field;
  }

  set #foo(v) {
    field = v;
  }

  test() {
    this.#foo += 1;
  }
}
