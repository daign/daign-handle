import { expect } from 'chai';
import * as sinon from 'sinon';

import { Vector2 } from '@daign/math';
import { MockDocument, MockEvent, MockNode } from '@daign/mock-dom';

import { Handle } from '../lib/handle';

declare var global: any;

describe( 'Handle', () => {
  beforeEach( () => {
    global.document = new MockDocument();
  } );

  describe( 'constructor', () => {
    it( 'should register two event listeners on passed node', () => {
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

  describe( 'beginDrag', () => {
    it( 'should call the beginning function on mousedown event', () => {
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

    it( 'should call the beginning function on touchstart event', () => {
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

    it( 'should set the start vector', () => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( node );
      const event = new MockEvent().setClientPoint( 1, 2 );

      // Act
      node.sendEvent( 'mousedown', event );

      // Assert
      expect( handle.start.equals( new Vector2( 1, 2 ) ) ).to.be.true;
    } );

    it( 'should not register more events if beginning function returns false', () => {
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

    it( 'should register 7 more events if beginning function returns true', () => {
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

  describe( 'continueDrag', () => {
    it( 'should call the continuing function on mousemove event', () => {
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

    it( 'should set the temp vector', () => {
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

    it( 'should set the delta vector', () => {
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

  describe( 'endDrag', () => {
    it( 'should call the ending function if there was a mousemove event', () => {
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

    it( 'should call the clicked function if there was no mousemove event', () => {
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

    it( 'should set the temp vector', () => {
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

    it( 'should set the delta vector', () => {
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

    it( 'should remove 7 events', () => {
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

  describe( 'cancelSelect', () => {
    it( 'should call preventDefault on the selectEvent', () => {
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
