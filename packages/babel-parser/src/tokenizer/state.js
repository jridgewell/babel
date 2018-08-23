// @flow

import type { Options } from "../options";
import * as N from "../types";
import { Position } from "../util/location";

import { types as ct, type TokContext } from "./context";
import type { Token } from "./index";
import { types as tt, type TokenType } from "./types";

function isLowContinuation(byte: number): boolean {
  return byte >= 0x80 && byte <= 0x8f;
}

function isLowMidContinuation(byte: number): boolean {
  return byte >= 0x80 && byte <= 0x9f;
}

function isMidHighContinuation(byte: number): boolean {
  return byte >= 0x90 && byte <= 0xbf;
}

function isHighContinuation(byte: number): boolean {
  return byte >= 0xa0 && byte <= 0xbf;
}

function isContinuation(byte: number): boolean {
  return byte >= 0x80 && byte <= 0xbf;
}

export default class State {
  init(options: Options, buffer: Buffer): void {
    this.strict =
      options.strictMode === false ? false : options.sourceType === "module";

    this.buffer = buffer;

    this.potentialArrowAt = -1;

    this.noArrowAt = [];
    this.noArrowParamsConversionAt = [];

    this.inMethod = false;
    this.inFunction = false;
    this.inParameters = false;
    this.maybeInArrowParameters = false;
    this.inGenerator = false;
    this.inAsync = false;
    this.inPropertyName = false;
    this.inType = false;
    this.inClassProperty = false;
    this.noAnonFunctionType = false;
    this.hasFlowComment = false;
    this.isIterator = false;

    this.classLevel = 0;

    this.labels = [];

    this.decoratorStack = [[]];

    this.yieldInPossibleArrowParameters = null;

    this.tokens = [];

    this.comments = [];

    this.trailingComments = [];
    this.leadingComments = [];
    this.commentStack = [];
    // $FlowIgnore
    this.commentPreviousNode = null;

    this.pos = this.lineStart = 0;
    this.curLine = options.startLine;

    this.type = tt.eof;
    this.value = null;
    this.start = this.end = this.pos;
    this.startLoc = this.endLoc = this.curPosition();

    // $FlowIgnore
    this.lastTokEndLoc = this.lastTokStartLoc = null;
    this.lastTokStart = this.lastTokEnd = this.pos;

    this.context = [ct.braceStatement];
    this.exprAllowed = true;

    this.containsEsc = this.containsOctal = false;
    this.octalPosition = null;

    this.invalidTemplateEscapePosition = null;

    this.exportedIdentifiers = [];
  }

  // TODO
  strict: boolean;

  buffer: Buffer;

  // Used to signify the start of a potential arrow function
  potentialArrowAt: number;

  // Used to signify the start of an expression which looks like a
  // typed arrow function, but it isn't
  // e.g. a ? (b) : c => d
  //          ^
  noArrowAt: number[];

  // Used to signify the start of an expression whose params, if it looks like
  // an arrow function, shouldn't be converted to assignable nodes.
  // This is used to defer the validation of typed arrow functions inside
  // conditional expressions.
  // e.g. a ? (b) : c => d
  //          ^
  noArrowParamsConversionAt: number[];

  // Flags to track whether we are in a function, a generator.
  inFunction: boolean;
  inParameters: boolean;
  maybeInArrowParameters: boolean;
  inGenerator: boolean;
  inMethod: boolean | N.MethodKind;
  inAsync: boolean;
  inType: boolean;
  noAnonFunctionType: boolean;
  inPropertyName: boolean;
  inClassProperty: boolean;
  hasFlowComment: boolean;
  isIterator: boolean;

  // Check whether we are in a (nested) class or not.
  classLevel: number;

  // Labels in scope.
  labels: Array<{
    kind: ?("loop" | "switch"),
    name?: ?string,
    statementStart?: number,
  }>;

  // Leading decorators. Last element of the stack represents the decorators in current context.
  // Supports nesting of decorators, e.g. @foo(@bar class inner {}) class outer {}
  // where @foo belongs to the outer class and @bar to the inner
  decoratorStack: Array<Array<N.Decorator>>;

  // The first yield expression inside parenthesized expressions and arrow
  // function parameters. It is used to disallow yield in arrow function
  // parameters.
  yieldInPossibleArrowParameters: ?N.YieldExpression;

  // Token store.
  tokens: Array<Token | N.Comment>;

  // Comment store.
  comments: Array<N.Comment>;

  // Comment attachment store
  trailingComments: Array<N.Comment>;
  leadingComments: Array<N.Comment>;
  commentStack: Array<{
    start: number,
    leadingComments: ?Array<N.Comment>,
    trailingComments: ?Array<N.Comment>,
    type: string,
  }>;
  commentPreviousNode: N.Node;

  // The current position of the tokenizer in the input.
  pos: number;
  lineStart: number;
  curLine: number;

  // Properties of the current token:
  // Its type
  type: TokenType;

  // For tokens that include more information than their type, the value
  value: any;

  // Its start and end offset
  start: number;
  end: number;

  // And, if locations are used, the {line, column} object
  // corresponding to those offsets
  startLoc: Position;
  endLoc: Position;

  // Position information for the previous token
  lastTokEndLoc: Position;
  lastTokStartLoc: Position;
  lastTokStart: number;
  lastTokEnd: number;

  // The context stack is used to superficially track syntactic
  // context to predict whether a regular expression is allowed in a
  // given position.
  context: Array<TokContext>;
  exprAllowed: boolean;

  // Used to signal to callers of `readWord1` whether the word
  // contained any escape sequences. This is needed because words with
  // escape sequences must not be interpreted as keywords.
  containsEsc: boolean;

  // TODO
  containsOctal: boolean;
  octalPosition: ?number;

  // Names of exports store. `default` is stored as a name for both
  // `export default foo;` and `export { foo as default };`.
  exportedIdentifiers: Array<string>;

  invalidTemplateEscapePosition: ?number;

  curPosition(): Position {
    return new Position(this.curLine, this.pos - this.lineStart);
  }

  advance(): number {
    const { buffer } = this;
    const code = buffer[this.pos];

    // This is **very** likely to always hit
    // code < 0x80 is ASCII
    // code < 0xC0 is Continuation Bytes
    // C0, and C1 are always invalid bytes
    if (code <= 0xc2) {
      return ++this.pos;
    }

    switch (code) {
      case 0xe0:
        return this._e0();
      case 0xed:
        return this._ed();
      case 0xf0:
        return this._f0();
      case 0xf4:
        return this._f4();
    }

    // 0xC2..0xDF is the start of a two-byte series
    // It must be followed by a continuation to be two bytes long.
    if (code <= 0xdf) {
      return this._continuation();
    }

    // 0xE1..0xEC, 0xEE, 0xEF are the start of a three-byte series
    // It must be followed by any continuation then any continuation to be
    // three bytes long.
    if (code <= 0xef) {
      return this._doubleContinuation();
    }

    // 0xF1..0xF3 is the start of a four-byte series
    // It must be followed by any continuation then any continuation then any
    // continuation to be four bytes long.
    if (code <= 0xf3) {
      return this._tripleContinuation();
    }

    // 0xF4..0xFF is an illegal start sequence
    return ++this.pos;
  }

  _continuation(): number {
    const { buffer } = this;
    const pos = ++this.pos;

    if (pos < buffer.length && isContinuation(buffer[pos])) {
      return ++this.pos;
    }

    return pos;
  }

  _doubleContinuation(): number {
    const { buffer } = this;
    const pos = ++this.pos;

    if (pos < buffer.length && isContinuation(buffer[pos])) {
      return this._continuation();
    }

    return pos;
  }

  _tripleContinuation(): number {
    const { buffer } = this;
    const pos = ++this.pos;

    if (pos < buffer.length && isContinuation(buffer[pos])) {
      return this._doubleContinuation();
    }

    return pos;
  }

  // 0xE0 is the start of a three-byte series
  // It must be followed by a high continuation then any continuation to be
  // three bytes long.
  _e0(): number {
    const { buffer } = this;
    const pos = ++this.pos;

    if (pos < buffer.length && isHighContinuation(buffer[pos])) {
      return this._continuation();
    }

    return pos;
  }

  // 0xED is the start of a three-byte series
  // It must be followed by a low-mid continuation then any continuation to be
  // three bytes long.
  _ed(): number {
    const { buffer } = this;
    const pos = ++this.pos;

    if (pos < buffer.length && isLowMidContinuation(buffer[pos])) {
      return this._continuation();
    }

    return pos;
  }

  // 0xF0 is the start of a four-byte series
  // It must be followed by a mid-high continuation then any continuation then
  // any continuation to be three bytes long.
  _f0(): number {
    const { buffer } = this;
    const pos = ++this.pos;

    if (pos < buffer.length && isMidHighContinuation(buffer[pos])) {
      return this._doubleContinuation();
    }

    return pos;
  }

  // 0xF4 is the start of a four-byte series
  // It must be followed by a low continuation then any continuation then any
  // continuation to be three bytes long.
  _f4(): number {
    const { buffer } = this;
    const pos = ++this.pos;

    if (pos < buffer.length && isLowContinuation(buffer[pos])) {
      return this._doubleContinuation();
    }

    return pos;
  }

  clone(skipArrays?: boolean): State {
    const state = new State();
    Object.keys(this).forEach(key => {
      // $FlowIgnore
      let val = this[key];

      if ((!skipArrays || key === "context") && Array.isArray(val)) {
        val = val.slice();
      }

      // $FlowIgnore
      state[key] = val;
    });
    return state;
  }
}
