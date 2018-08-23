// @flow

import { nextLineBreak } from "./whitespace";

export type Pos = {
  start: number,
};

// These are used when `options.locations` is on, for the
// `startLoc` and `endLoc` properties.

export class Position {
  line: number;
  column: number;

  constructor(line: number, col: number) {
    this.line = line;
    this.column = col;
  }
}

export class SourceLocation {
  start: Position;
  end: Position;
  filename: string;
  identifierName: ?string;

  constructor(start: Position, end?: Position) {
    this.start = start;
    // $FlowIgnore (may start as null, but initialized later)
    this.end = end;
  }
}

// The `getLineInfo` function is mostly useful when the
// `locations` option is off (for performance reasons) and you
// want to find the line/column position for a given character
// offset. `buffer` should be the code buffer that the offset refers
// into.

export function getLineInfo(buffer: Buffer, offset: number): Position {
  let line = 1;
  let cur = 0;
  while (true) {
    const index = nextLineBreak(buffer, cur);
    if (index > -1 && index < offset) {
      ++line;
      cur = index + 1;
    } else {
      return new Position(line, offset - cur);
    }
  }
  // istanbul ignore next
  throw new Error("Unreachable");
}
