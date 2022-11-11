import { expect } from 'chai';
import { spy } from 'sinon';

import { Vector2 } from '@daign/math';
import { MockEvent, MockNode } from '@daign/mock-dom';

import { ScrollHandle } from '../lib';

declare var global: any;

describe( 'ScrollHandle', (): void => {
  beforeEach( (): void => {
    global.window = new MockNode();
  } );

  describe( 'constructor', (): void => {
    it( 'should register three event listeners on passed node', (): void => {
      // Arrange
      const node = new MockNode();
      const addListenerSpy = spy( node, 'addEventListener' );

      // Act
      const handle = new ScrollHandle( { startNode: node } );

      // Assert
      expect( ( handle as any ).node ).to.equal( node );
      expect( addListenerSpy.callCount ).to.equal( 3 );
    } );
  } );

  describe( 'destroy', (): void => {
    it( 'should remove the event listeners from the node', (): void => {
      // Arrange
      const node = new MockNode();
      const removeListenerSpy = spy( node, 'removeEventListener' );
      const handle = new ScrollHandle( { startNode: node } );

      // Act
      handle.destroy();

      // Assert
      expect( ( handle as any ).node ).to.be.null;
      expect( removeListenerSpy.callCount ).to.equal( 3 );
    } );

    it( 'should not fail when called twice on the same handle', (): void => {
      // Arrange
      const node = new MockNode();
      const removeListenerSpy = spy( node, 'removeEventListener' );
      const handle = new ScrollHandle( { startNode: node } );

      // Act
      handle.destroy();
      handle.destroy();

      // Assert
      expect( ( handle as any ).node ).to.be.null;
      expect( removeListenerSpy.callCount ).to.equal( 3 );
    } );
  } );

  describe( 'beginScroll', (): void => {
    it( 'should call the scrolling function on wheel event', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new ScrollHandle( { startNode: node } );
      const scrollingSpy = spy( handle, 'scrolling' );

      const event = new MockEvent().setScrollDelta( 1, 2 ).setClientPoint( 3, 4 );

      // Act
      node.sendEvent( 'wheel', event );

      // Assert
      expect( scrollingSpy.calledOnce ).to.be.true;
    } );

    it( 'should not call the scrolling function when the handle is disabled', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new ScrollHandle( { startNode: node } );
      handle.enabled = false;
      const scrollingSpy = spy( handle, 'scrolling' );

      const event = new MockEvent().setScrollDelta( 1, 2 ).setClientPoint( 3, 4 );

      // Act
      node.sendEvent( 'wheel', event );

      // Assert
      expect( scrollingSpy.calledOnce ).to.be.false;
    } );

    it( 'should not call the scrolling function if the event is missing scroll info', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new ScrollHandle( { startNode: node } );
      const scrollingSpy = spy( handle, 'scrolling' );

      const event = new MockEvent().setClientPoint( 3, 4 );

      // Act
      node.sendEvent( 'wheel', event );

      // Assert
      expect( scrollingSpy.calledOnce ).to.be.false;
    } );

    it( 'should set the scroll and scrollPosition vectors', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new ScrollHandle( { startNode: node } );
      const event = new MockEvent().setScrollDelta( 1, 2 ).setClientPoint( 3, 4 );

      // Act
      node.sendEvent( 'wheel', event );

      // Assert
      expect( handle.scroll.equals( new Vector2( 1, 2 ) ) ).to.be.true;
      expect( handle.scrollPosition.equals( new Vector2( 3, 4 ) ) ).to.be.true;
    } );

    it( 'should set scrollPosition vector to result of the custom extract function', (): void => {
      // Arrange
      const node = new MockNode();
      const extractFromEvent = (): Vector2 => {
        return new Vector2( 5, 6 );
      };
      const handle = new ScrollHandle( { startNode: node, extractFromEvent } );
      const event = new MockEvent().setScrollDelta( 1, 2 ).setClientPoint( 3, 4 );

      // Act
      node.sendEvent( 'wheel', event );

      // Assert
      expect( handle.scrollPosition.equals( new Vector2( 5, 6 ) ) ).to.be.true;
    } );

    it( 'should set the scroll mode value', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new ScrollHandle( { startNode: node } );
      const event = new MockEvent().setScrollDelta( 1, 2, 5 );

      // Act
      node.sendEvent( 'wheel', event );

      // Assert
      expect( handle.scrollMode ).to.equal( 5 );
    } );
  } );
} );
