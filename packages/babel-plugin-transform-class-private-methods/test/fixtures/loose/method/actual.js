class Foo {
  #foo() {
    this.#foo;
  }

  test() {
    const foo = this.#foo;
    foo();
    this.#foo();
  }
}
