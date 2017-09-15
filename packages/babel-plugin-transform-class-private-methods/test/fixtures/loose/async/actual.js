class Foo {
  async #foo() {}

  test() {
    const foo = this.#foo;
    foo();
    this.#foo();
  }
}
