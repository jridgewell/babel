let field = 0;

class Foo {
  get #foo() {
    return field;
  }

  test() {
    this.#foo;
  }
}
