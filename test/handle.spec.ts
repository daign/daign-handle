import {expect} from 'chai';
import * as sinon from 'sinon';

import {Handle} from '../lib/handle';

class MockNode {
  public addEventListener(): void {}
}

class MockEvent {
  public clientX: number;
  public clientY: number;

  constructor( x: number, y: number ) {
    this.clientX = x;
    this.clientY = y;
  }

  public preventDefault(): void {}
  public stopPropagation(): void {}
}

describe( 'Handle', () => {
  describe( 'constructor', () => {
    it( 'should register two event listeners on passed node', () => {
      // arrange
      const node = new MockNode();
      const spy = sinon.spy( node, 'addEventListener' );

      // act
      const handle = new Handle( node );

      // assert
      expect( ( handle as any ).node ).to.equal( node );
      expect( spy.callCount ).to.equal( 2 );
    } );
  } );

  describe( 'beginDrag', () => {
    it( 'should call the beginning function', () => {
      // arrange
      const node = new MockNode();
      const handle = new Handle( node );
      handle.beginning = () => {
        return false;
      };
      const spy = sinon.spy( handle, 'beginning' );

      const event = new MockEvent( 0, 0 );

      // act
      ( handle as any ).beginDrag( event );

      // assert
      expect( spy.calledOnce ).to.be.true;
    } );
  } );
} );
