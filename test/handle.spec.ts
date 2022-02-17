import { expect } from 'chai';
import * as sinon from 'sinon';

import { Vector2 } from '@daign/math';
import { MockDocument, MockEvent, MockNode } from '@daign/mock-dom';

import { Handle } from '../lib/handle';

declare var global: any;

/**
 * Sleep function.
 * @param milliseconds - The time to pause code execution.
 */
const sleep = ( milliseconds: number ): Promise<void> => {
  return new Promise( ( resolve: any ): void => {
    setTimeout( resolve, milliseconds );
  } );
};

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
      const handle = new Handle( { startNode: node } );

      // Assert
      expect( ( handle as any ).node ).to.equal( node );
      expect( spy.callCount ).to.equal( 2 );
    } );
  } );

  describe( 'destroy', (): void => {
    it( 'should remove the event listeners from the node', (): void => {
      // Arrange
      const node = new MockNode();
      const spy = sinon.spy( node, 'removeEventListener' );
      const handle = new Handle( { startNode: node } );

      // Act
      handle.destroy();

      // Assert
      expect( ( handle as any ).node ).to.be.null;
      expect( spy.callCount ).to.equal( 2 );
    } );

    it( 'should not fail when called twice on the same handle', (): void => {
      // Arrange
      const node = new MockNode();
      const spy = sinon.spy( node, 'removeEventListener' );
      const handle = new Handle( { startNode: node } );

      // Act
      handle.destroy();
      handle.destroy();

      // Assert
      expect( ( handle as any ).node ).to.be.null;
      expect( spy.callCount ).to.equal( 2 );
    } );
  } );

  describe( 'beginDrag', (): void => {
    it( 'should call the beginning function on mousedown event', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( { startNode: node } );
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
      const handle = new Handle( { startNode: node } );
      const spy = sinon.spy( handle, 'beginning' );

      const event = new MockEvent().setClientPoint( 0, 0 );

      // Act
      node.sendEvent( 'touchstart', event );

      // Assert
      expect( spy.calledOnce ).to.be.true;
    } );

    it( 'should not call the beginning function when the handle is disabled', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( { startNode: node } );
      handle.enabled = false;
      const spy = sinon.spy( handle, 'beginning' );

      const event = new MockEvent().setClientPoint( 0, 0 );

      // Act
      node.sendEvent( 'mousedown', event );

      // Assert
      expect( spy.calledOnce ).to.be.false;
    } );

    it( 'should set the start vector', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( { startNode: node } );
      const event = new MockEvent().setClientPoint( 1, 2 );

      // Act
      node.sendEvent( 'mousedown', event );

      // Assert
      expect( handle.start.equals( new Vector2( 1, 2 ) ) ).to.be.true;
    } );

    it( 'should set the start vector to the result of the custom extract function', (): void => {
      // Arrange
      const node = new MockNode();
      const extractFromEvent = (): Vector2 => {
        return new Vector2( 2, 3 );
      };
      const handle = new Handle( { startNode: node, extractFromEvent } );
      const event = new MockEvent().setClientPoint( 1, 2 );

      // Act
      node.sendEvent( 'mousedown', event );

      // Assert
      expect( handle.start.equals( new Vector2( 2, 3 ) ) ).to.be.true;
      // Absolute start coordinates should be stored in a private variable.
      expect( ( handle as any )._absoluteStart.equals( new Vector2( 1, 2 ) ) ).to.be.true;
    } );

    it( 'should not register more events if beginning function returns false', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( { startNode: node } );
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
      const handle = new Handle( { startNode: node } );
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
      const handle = new Handle( { startNode: node, minimumDragDistance: 50 } );
      handle.beginning = (): boolean => {
        return true;
      };
      const spy = sinon.spy( handle, 'continuing' );

      const startEvent = new MockEvent().setClientPoint( 0, 0 );
      const dragEvent = new MockEvent().setClientPoint( 1, 100 );

      // Act
      node.sendEvent( 'mousedown', startEvent );
      global.document.sendEvent( 'mousemove', dragEvent );

      // Assert
      expect( spy.calledOnce ).to.be.true;
      global.document.sendEvent( 'mouseup', dragEvent );
    } );

    it( 'should not call the continuing function before minimum distance is reached', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( { startNode: node, minimumDragDistance: 5 } );
      handle.beginning = (): boolean => {
        return true;
      };
      const spy = sinon.spy( handle, 'continuing' );

      const startEvent = new MockEvent().setClientPoint( 0, 0 );
      const dragEvent = new MockEvent().setClientPoint( 1, 2 );

      // Act
      node.sendEvent( 'mousedown', startEvent );
      global.document.sendEvent( 'mousemove', dragEvent );

      // Assert
      expect( spy.notCalled ).to.be.true;
      global.document.sendEvent( 'mouseup', dragEvent );
    } );

    it( 'should always call the continuing function when distance was reached once',
      async (): Promise<void> => {
        // Arrange
        const node = new MockNode();
        const handle = new Handle( {
          startNode: node, minimumDragDistance: 5, throttleInterval: 1
        } );
        handle.beginning = (): boolean => {
          return true;
        };
        const spy = sinon.spy( handle, 'continuing' );

        const startEvent = new MockEvent().setClientPoint( 0, 0 );
        const dragEvent1 = new MockEvent().setClientPoint( 1, 5 );
        const dragEvent2 = new MockEvent().setClientPoint( 1, 2 );

        // Act
        node.sendEvent( 'mousedown', startEvent );
        global.document.sendEvent( 'mousemove', dragEvent1 );
        global.document.sendEvent( 'mousemove', dragEvent2 );

        /* Wait 2 milliseconds after sending second move event, because the execution of the drag
         * function is throttled by 1 milliseconds intervals. */
        await sleep( 2 );

        // Assert
        expect( spy.callCount ).to.equal( 2 );
        global.document.sendEvent( 'mouseup', dragEvent2 );
      }
    );

    it( 'should skip event execution according to throttle interval',
      async (): Promise<void> => {
        // Arrange
        const node = new MockNode();
        const handle = new Handle( {
          startNode: node, minimumDragDistance: 5, throttleInterval: 10
        } );
        handle.beginning = (): boolean => {
          return true;
        };
        const spy = sinon.spy( handle, 'continuing' );

        const startEvent = new MockEvent().setClientPoint( 0, 0 );
        const dragEvent1 = new MockEvent().setClientPoint( 1, 10 );
        const dragEvent2 = new MockEvent().setClientPoint( 2, 20 );
        const dragEvent3 = new MockEvent().setClientPoint( 3, 30 );
        const dragEvent4 = new MockEvent().setClientPoint( 4, 40 );
        const dragEvent5 = new MockEvent().setClientPoint( 5, 50 );

        // Act
        node.sendEvent( 'mousedown', startEvent );
        global.document.sendEvent( 'mousemove', dragEvent1 ); // Executed.
        await sleep( 4 );
        global.document.sendEvent( 'mousemove', dragEvent2 ); // Deferred.
        await sleep( 4 );
        global.document.sendEvent( 'mousemove', dragEvent3 ); // Canceled.
        await sleep( 4 );
        global.document.sendEvent( 'mousemove', dragEvent4 ); // Deferred.
        await sleep( 4 );
        global.document.sendEvent( 'mousemove', dragEvent5 ); // Canceled.

        // Wait until throttling function is finished.
        await sleep( 11 );

        // Assert
        expect( spy.callCount ).to.equal( 3 );
        global.document.sendEvent( 'mouseup', dragEvent5 );
      }
    );

    it( 'should set the temp vector', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( { startNode: node } );
      handle.beginning = (): boolean => {
        return true;
      };
      const startEvent = new MockEvent().setClientPoint( 1, 2 );
      const dragEvent = new MockEvent().setClientPoint( 3, 5 );

      // Act
      node.sendEvent( 'mousedown', startEvent );
      global.document.sendEvent( 'mousemove', dragEvent );

      // Assert
      expect( handle.temp.equals( new Vector2( 3, 5 ) ) ).to.be.true;
      global.document.sendEvent( 'mouseup', dragEvent );
    } );

    it( 'should set the delta vector', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( { startNode: node } );
      handle.beginning = (): boolean => {
        return true;
      };
      const startEvent = new MockEvent().setClientPoint( 1, 2 );
      const dragEvent = new MockEvent().setClientPoint( 3, 5 );

      // Act
      node.sendEvent( 'mousedown', startEvent );
      global.document.sendEvent( 'mousemove', dragEvent );

      // Assert
      expect( handle.delta.equals( new Vector2( 2, 3 ) ) ).to.be.true;
      global.document.sendEvent( 'mouseup', dragEvent );
    } );

    it( 'should not let delta calculation be influenced by custom extract function', (): void => {
      // Arrange
      const node = new MockNode();
      const extractFromEvent = (): Vector2 => {
        return new Vector2( 100, 100 );
      };
      const handle = new Handle( { startNode: node, extractFromEvent } );
      handle.beginning = (): boolean => {
        return true;
      };
      const startEvent = new MockEvent().setClientPoint( 1, 2 );
      const dragEvent = new MockEvent().setClientPoint( 3, 5 );

      // Act
      node.sendEvent( 'mousedown', startEvent );
      global.document.sendEvent( 'mousemove', dragEvent );

      // Assert
      // Delta ignores the custom extract function and uses only client coordinates.
      expect( handle.delta.equals( new Vector2( 2, 3 ) ) ).to.be.true;
      // Temp has delta applied on the start position that came from the custom extract function.
      expect( handle.temp.equals( new Vector2( 102, 103 ) ) ).to.be.true;
      global.document.sendEvent( 'mouseup', dragEvent );
    } );
  } );

  describe( 'endDrag', (): void => {
    it( 'should call the ending function if there was a drag', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( { startNode: node } );
      handle.beginning = (): boolean => {
        return true;
      };
      const spyClicked = sinon.spy( handle, 'clicked' );
      const spyEnding = sinon.spy( handle, 'ending' );

      const startEvent = new MockEvent().setClientPoint( 0, 0 );
      const dragEvent = new MockEvent().setClientPoint( 1, 5 );

      // Act
      node.sendEvent( 'mousedown', startEvent );
      global.document.sendEvent( 'mousemove', dragEvent );
      global.document.sendEvent( 'mouseup', dragEvent );

      // Assert
      expect( spyEnding.calledOnce ).to.be.true;
      expect( spyClicked.notCalled ).to.be.true;
    } );

    it( 'should call the clicked function if there was no mousemove event', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( { startNode: node } );
      handle.beginning = (): boolean => {
        return true;
      };
      const spyClicked = sinon.spy( handle, 'clicked' );
      const spyEnding = sinon.spy( handle, 'ending' );

      const event = new MockEvent().setClientPoint( 0, 0 );

      // Act
      node.sendEvent( 'mousedown', event );
      global.document.sendEvent( 'mouseup', event );

      // Assert
      expect( spyClicked.calledOnce ).to.be.true;
      expect( spyEnding.notCalled ).to.be.true;
    } );

    it( 'should call the clicked function if the movement was below limit', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( { startNode: node, minimumDragDistance: 5 } );
      handle.beginning = (): boolean => {
        return true;
      };
      const spyClicked = sinon.spy( handle, 'clicked' );
      const spyEnding = sinon.spy( handle, 'ending' );

      const startEvent = new MockEvent().setClientPoint( 0, 0 );
      const dragEvent = new MockEvent().setClientPoint( 1, 2 );

      // Act
      node.sendEvent( 'mousedown', startEvent );
      global.document.sendEvent( 'mousemove', dragEvent );
      global.document.sendEvent( 'mouseup', dragEvent );

      // Assert
      expect( spyClicked.calledOnce ).to.be.true;
      expect( spyEnding.notCalled ).to.be.true;
    } );

    it( 'should call the clicked function if only the end move was above limit', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( { startNode: node, minimumDragDistance: 50 } );
      handle.beginning = (): boolean => {
        return true;
      };
      const spyClicked = sinon.spy( handle, 'clicked' );
      const spyEnding = sinon.spy( handle, 'ending' );

      const startEvent = new MockEvent().setClientPoint( 0, 0 );
      const dragEvent = new MockEvent().setClientPoint( 1, 2 );
      const endEvent = new MockEvent().setClientPoint( 1, 100 );

      // Act
      node.sendEvent( 'mousedown', startEvent );
      global.document.sendEvent( 'mousemove', dragEvent );
      global.document.sendEvent( 'mouseup', endEvent );

      // Assert
      expect( spyClicked.calledOnce ).to.be.true;
      expect( spyEnding.notCalled ).to.be.true;
    } );

    it( 'should set the temp vector', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( { startNode: node } );
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
      const handle = new Handle( { startNode: node } );
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

    it( 'should not let delta calculation be influenced by custom extract function', (): void => {
      // Arrange
      const node = new MockNode();
      const extractFromEvent = (): Vector2 => {
        return new Vector2( 100, 100 );
      };
      const handle = new Handle( { startNode: node, extractFromEvent } );
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
      // Delta ignores the custom extract function and uses only client coordinates.
      expect( handle.delta.equals( new Vector2( 2, 3 ) ) ).to.be.true;
      // Temp has delta applied on the start position that came from the custom extract function.
      expect( handle.temp.equals( new Vector2( 102, 103 ) ) ).to.be.true;
    } );

    it( 'should remove 7 events', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( { startNode: node } );
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
      const handle = new Handle( { startNode: node } );
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
