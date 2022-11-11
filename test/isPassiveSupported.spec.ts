import { expect } from 'chai';

import { MockNode } from '@daign/mock-dom';

import { isPassiveSupported } from '../lib';

declare var global: any;

describe( 'isPassiveSupported', (): void => {
  it( 'should return true if passive is supported in the event listener options', (): void => {
    // Arrange
    global.window = new MockNode();

    // Act
    const result = isPassiveSupported();

    // Assert
    expect( result ).to.be.true;
  } );

  it( 'should return false if adding a listener with passive option fails', (): void => {
    // Arrange
    global.window = undefined;

    // Act
    const result = isPassiveSupported();

    // Assert
    expect( result ).to.be.false;
  } );
} );
