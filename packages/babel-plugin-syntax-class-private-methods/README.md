# babel-plugin-syntax-class-private-methods

> Allow parsing of class private methods.

## Installation

```sh
npm install --save-dev babel-plugin-syntax-class-private-methods
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": ["syntax-class-private-methods"]
}
```

### Via CLI

```sh
babel --plugins syntax-class-private-methods script.js
```

### Via Node API

```javascript
require("babel-core").transform("code", {
  plugins: ["syntax-class-private-methods"]
});
```
