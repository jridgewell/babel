class Foo {
  async #foo() {
    this.#foo;
  }

  test() {
    const foo = this.#foo;
    foo();
    this.#foo();
  }
}
