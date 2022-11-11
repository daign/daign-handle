import { expect } from 'chai';
import { spy } from 'sinon';

import { Vector2 } from '@daign/math';
import { MockDocument, MockEvent, MockNode } from '@daign/mock-dom';

import { ClickHandle } from '../lib/clickHandle';

declare var global: any;

describe( 'ClickHandle', (): void => {
  beforeEach( (): void => {
    global.document = new MockDocument();
  } );

  describe( 'constructor', (): void => {
    it( 'should register one event listeners on passed node', (): void => {
      // Arrange
      const node = new MockNode();
      const addListenerSpy = spy( node, 'addEventListener' );

      // Act
      const handle = new ClickHandle( { startNode: node } );

      // Assert
      expect( ( handle as any ).node ).to.equal( node );
      expect( addListenerSpy.callCount ).to.equal( 1 );
    } );
  } );

  describe( 'destroy', (): void => {
    it( 'should remove the event listener from the node', (): void => {
      // Arrange
      const node = new MockNode();
      const removeListenerSpy = spy( node, 'removeEventListener' );
      const handle = new ClickHandle( { startNode: node } );

      // Act
      handle.destroy();

      // Assert
      expect( ( handle as any ).node ).to.be.null;
      expect( removeListenerSpy.callCount ).to.equal( 1 );
    } );

    it( 'should not fail when called twice on the same handle', (): void => {
      // Arrange
      const node = new MockNode();
      const removeListenerSpy = spy( node, 'removeEventListener' );
      const handle = new ClickHandle( { startNode: node } );

      // Act
      handle.destroy();
      handle.destroy();

      // Assert
      expect( ( handle as any ).node ).to.be.null;
      expect( removeListenerSpy.callCount ).to.equal( 1 );
    } );
  } );

  describe( 'beginClick', (): void => {
    it( 'should call the clicked callback on click event', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new ClickHandle( { startNode: node } );
      const clickedSpy = spy( handle, 'clicked' );

      const event = new MockEvent().setClientPoint( 0, 0 );

      // Act
      node.sendEvent( 'click', event );

      // Assert
      expect( clickedSpy.calledOnce ).to.be.true;
    } );

    it( 'should not call the clicked function when the handle is disabled', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new ClickHandle( { startNode: node } );
      handle.enabled = false;
      const clickedSpy = spy( handle, 'clicked' );

      const event = new MockEvent().setClientPoint( 0, 0 );

      // Act
      node.sendEvent( 'click', event );

      // Assert
      expect( clickedSpy.calledOnce ).to.be.false;
    } );

    it( 'should call the clicked function even if the event has no position info', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new ClickHandle( { startNode: node } );
      const clickedSpy = spy( handle, 'clicked' );

      const event = new MockEvent();

      // Act
      node.sendEvent( 'click', event );

      // Assert
      expect( clickedSpy.calledOnce ).to.be.true;
    } );

    it( 'should set the position vector', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new ClickHandle( { startNode: node } );
      const event = new MockEvent().setClientPoint( 1, 2 );

      // Act
      node.sendEvent( 'click', event );

      // Assert
      expect( handle.position!.equals( new Vector2( 1, 2 ) ) ).to.be.true;
    } );

    it( 'should set the position vector to the result of the custom extract function', (): void => {
      // Arrange
      const node = new MockNode();
      const extractFromEvent = (): Vector2 => {
        return new Vector2( 2, 3 );
      };
      const handle = new ClickHandle( { startNode: node, extractFromEvent } );
      const event = new MockEvent().setClientPoint( 1, 2 );

      // Act
      node.sendEvent( 'click', event );

      // Assert
      expect( handle.position!.equals( new Vector2( 2, 3 ) ) ).to.be.true;
    } );

    it( 'should clear positions from previous clicks', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new ClickHandle( { startNode: node } );

      const clickEvent = new MockEvent().setClientPoint( 1, 2 );
      const secondClickEvent = new MockEvent();

      // Act
      node.sendEvent( 'click', clickEvent );
      expect( handle.position!.equals( new Vector2( 1, 2 ) ) ).to.be.true;

      // Second click, without position information.
      node.sendEvent( 'click', secondClickEvent );

      // Assert
      expect( handle.position ).to.be.undefined;
    } );
  } );
} );
