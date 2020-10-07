import { expect } from 'chai';
import * as sinon from 'sinon';

import { Vector2 } from '@daign/math';
import { MockDocument, MockEvent, MockNode } from '@daign/mock-dom';

import { Handle } from '../lib/handle';

declare var global: any;

describe( 'Handle', (): void => {
  beforeEach( (): void => {
    global.document = new MockDocument();
  } );

  describe( 'constructor', (): void => {
    it( 'should register two event listeners on passed node', (): void => {
      // Arrange
      const node = new MockNode();
      const spy = sinon.spy( node, 'addEventListener' );

      // Act
      const handle = new Handle( node );

      // Assert
      expect( ( handle as any ).node ).to.equal( node );
      expect( spy.callCount ).to.equal( 2 );
    } );
  } );

  describe( 'beginDrag', (): void => {
    it( 'should call the beginning function on mousedown event', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( node );
      const spy = sinon.spy( handle, 'beginning' );

      const event = new MockEvent().setClientPoint( 0, 0 );

      // Act
      node.sendEvent( 'mousedown', event );

      // Assert
      expect( spy.calledOnce ).to.be.true;
    } );

    it( 'should call the beginning function on touchstart event', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( node );
      const spy = sinon.spy( handle, 'beginning' );

      const event = new MockEvent().setClientPoint( 0, 0 );

      // Act
      node.sendEvent( 'touchstart', event );

      // Assert
      expect( spy.calledOnce ).to.be.true;
    } );

    it( 'should set the start vector', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( node );
      const event = new MockEvent().setClientPoint( 1, 2 );

      // Act
      node.sendEvent( 'mousedown', event );

      // Assert
      expect( handle.start.equals( new Vector2( 1, 2 ) ) ).to.be.true;
    } );

    it( 'should not register more events if beginning function returns false', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( node );
      handle.beginning = (): boolean => {
        return false;
      };
      const spy = sinon.spy( global.document, 'addEventListener' );

      const event = new MockEvent().setClientPoint( 0, 0 );

      // Act
      node.sendEvent( 'mousedown', event );

      // Assert
      expect( spy.notCalled ).to.be.true;
    } );

    it( 'should register 7 more events if beginning function returns true', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( node );
      handle.beginning = (): boolean => {
        return true;
      };
      const spy = sinon.spy( global.document, 'addEventListener' );

      const event = new MockEvent().setClientPoint( 0, 0 );

      // Act
      node.sendEvent( 'mousedown', event );

      // Assert
      expect( spy.callCount ).to.equal( 7 );
      global.document.sendEvent( 'mousemove', event );
      global.document.sendEvent( 'mouseup', event );
    } );
  } );

  describe( 'continueDrag', (): void => {
    it( 'should call the continuing function on mousemove event', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( node );
      handle.beginning = (): boolean => {
        return true;
      };
      const spy = sinon.spy( handle, 'continuing' );

      const event = new MockEvent().setClientPoint( 0, 0 );

      // Act
      node.sendEvent( 'mousedown', event );
      global.document.sendEvent( 'mousemove', event );

      // Assert
      expect( spy.calledOnce ).to.be.true;
      global.document.sendEvent( 'mouseup', event );
    } );

    it( 'should set the temp vector', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( node );
      handle.beginning = (): boolean => {
        return true;
      };
      const startEvent = new MockEvent().setClientPoint( 1, 2 );
      const dragEvent = new MockEvent().setClientPoint( 3, 5 );
      const endEvent = new MockEvent().setClientPoint( 0, 0 );

      // Act
      node.sendEvent( 'mousedown', startEvent );
      global.document.sendEvent( 'mousemove', dragEvent );

      // Assert
      expect( handle.temp.equals( new Vector2( 3, 5 ) ) ).to.be.true;
      global.document.sendEvent( 'mouseup', endEvent );
    } );

    it( 'should set the delta vector', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( node );
      handle.beginning = (): boolean => {
        return true;
      };
      const startEvent = new MockEvent().setClientPoint( 1, 2 );
      const dragEvent = new MockEvent().setClientPoint( 3, 5 );
      const endEvent = new MockEvent().setClientPoint( 0, 0 );

      // Act
      node.sendEvent( 'mousedown', startEvent );
      global.document.sendEvent( 'mousemove', dragEvent );

      // Assert
      expect( handle.delta.equals( new Vector2( 2, 3 ) ) ).to.be.true;
      global.document.sendEvent( 'mouseup', endEvent );
    } );
  } );

  describe( 'endDrag', (): void => {
    it( 'should call the ending function if there was a mousemove event', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( node );
      handle.beginning = (): boolean => {
        return true;
      };
      const spy = sinon.spy( handle, 'ending' );

      const event = new MockEvent().setClientPoint( 0, 0 );

      // Act
      node.sendEvent( 'mousedown', event );
      global.document.sendEvent( 'mousemove', event );
      global.document.sendEvent( 'mouseup', event );

      // Assert
      expect( spy.calledOnce ).to.be.true;
    } );

    it( 'should call the clicked function if there was no mousemove event', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( node );
      handle.beginning = (): boolean => {
        return true;
      };
      const spy = sinon.spy( handle, 'clicked' );

      const event = new MockEvent().setClientPoint( 0, 0 );

      // Act
      node.sendEvent( 'mousedown', event );
      global.document.sendEvent( 'mouseup', event );

      // Assert
      expect( spy.calledOnce ).to.be.true;
    } );

    it( 'should set the temp vector', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( node );
      handle.beginning = (): boolean => {
        return true;
      };
      const startEvent = new MockEvent().setClientPoint( 1, 2 );
      const dragEvent = new MockEvent().setClientPoint( 0, 0 );
      const endEvent = new MockEvent().setClientPoint( 3, 5 );

      // Act
      node.sendEvent( 'mousedown', startEvent );
      global.document.sendEvent( 'mousemove', dragEvent );
      global.document.sendEvent( 'mouseup', endEvent );

      // Assert
      expect( handle.temp.equals( new Vector2( 3, 5 ) ) ).to.be.true;
    } );

    it( 'should set the delta vector', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( node );
      handle.beginning = (): boolean => {
        return true;
      };
      const startEvent = new MockEvent().setClientPoint( 1, 2 );
      const dragEvent = new MockEvent().setClientPoint( 0, 0 );
      const endEvent = new MockEvent().setClientPoint( 3, 5 );

      // Act
      node.sendEvent( 'mousedown', startEvent );
      global.document.sendEvent( 'mousemove', dragEvent );
      global.document.sendEvent( 'mouseup', endEvent );

      // Assert
      expect( handle.delta.equals( new Vector2( 2, 3 ) ) ).to.be.true;
    } );

    it( 'should remove 7 events', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( node );
      handle.beginning = (): boolean => {
        return true;
      };
      const spy = sinon.spy( global.document, 'removeEventListener' );

      const event = new MockEvent().setClientPoint( 0, 0 );

      // Act
      node.sendEvent( 'mousedown', event );
      global.document.sendEvent( 'mousemove', event );
      global.document.sendEvent( 'mouseup', event );

      // Assert
      expect( spy.callCount ).to.equal( 7 );
    } );
  } );

  describe( 'cancelSelect', (): void => {
    it( 'should call preventDefault on the selectEvent', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( node );
      handle.beginning = (): boolean => {
        return true;
      };

      const event = new MockEvent().setClientPoint( 0, 0 );
      const selectEvent = new MockEvent().setClientPoint( 1, 1 );
      const spy = sinon.spy( selectEvent, 'preventDefault' );

      // Act
      node.sendEvent( 'mousedown', event );
      global.document.sendEvent( 'selectstart', selectEvent );
      global.document.sendEvent( 'mouseup', event );

      // Assert
      expect( spy.calledOnce ).to.be.true;
    } );
  } );
} );
