// Unfortunately, there's an ugly ordering that's necessary.
// transform-class-properties, then transform-class-private-methods, then transform-es2015-classes
class Foo {
  #field;

  #method() {
    this.#field;
  }

  async #asyncMethod() {
    this.#field;
  }

  *#generatorMethod() {
    this.#field;
  }

  async *#asyncGeneratorMethod() {
    this.#field;
  }

  get #foo() {
    return this.#field;
  }

  set #foo(v) {
    this.#field = v;
  }
}
