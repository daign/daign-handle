# daign-handle

[![NPM package][npm]][npm-url]

Define drag actions for DOM elements.

## Installation

```sh
npm install @daign/handle --save
```

## Usage example

```typescript
import { Handle } from '@daign/handle';

// Create the node which will initiate the drag, or reference it from your HTML.
const node = document.createElement( 'div' );

// Create the Handle.
const handle = new Handle( { startNode: node } );

// Callback to execute when drag starts.
handle.beginning = (): boolean => {
  // Get the coordinates of the start event.
  console.log( handle.start );

  // Return value determines whether to continue the drag.
  return true;
};

// Callback to execute during the drag.
handle.continuing = (): void => {
  // Get the coordinates of the events during the drag.
  console.log( handle.temp );

  // Get the difference between start and temp position.
  console.log( handle.delta );
};

// Callback to execute when the drag has ended.
handle.ending = (): void => {};
```

## Scripts

#### Build

    npm run build

#### Run lint analysis

    npm run lint

#### Run unit tests with code coverage

    npm run test

[npm]: https://img.shields.io/npm/v/@daign/handle.svg
[npm-url]: https://www.npmjs.com/package/@daign/handle
