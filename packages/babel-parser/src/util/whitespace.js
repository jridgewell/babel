// @flow

import * as charCodes from "charcodes";

export function isNewLine(code: number): boolean {
  return (
    code === charCodes.lineFeed ||
    code === charCodes.carriageReturn ||
    code === charCodes.lineSeparator ||
    code === charCodes.paragraphSeparator
  );
}

export function containsNewLine(buffer: Buffer): boolean {
  for (let i = 0; i < buffer.length; i++) {
    if (isNewLine(buffer[i])) {
      return true;
    }
  }
  return false;
}

export function nextLineBreak(buffer: Buffer, start: number): number {
  for (let i = start; i < buffer.length; i++) {
    const code = buffer[i];
    switch (code) {
      case charCodes.carriageReturn: {
        const next = i + 1;
        if (next < buffer.length && buffer[next] === charCodes.lineFeed) {
          return next;
        }
      }
      case charCodes.lineFeed:
      case charCodes.lineSeparator:
      case charCodes.paragraphSeparator:
        return i;
    }
  }

  return -1;
}

export const nonASCIIwhitespace = /[\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff]/;
