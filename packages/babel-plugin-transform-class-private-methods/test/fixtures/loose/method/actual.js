class Foo {
  #foo() {}

  test() {
    const foo = this.#foo;
    foo();
    this.#foo();
  }
}
