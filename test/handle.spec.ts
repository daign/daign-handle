import { expect } from 'chai';
import { spy } from 'sinon';

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
    global.window = new MockNode();
  } );

  describe( 'constructor', (): void => {
    it( 'should register two event listeners on passed node', (): void => {
      // Arrange
      const node = new MockNode();
      const addListenerSpy = spy( node, 'addEventListener' );

      // Act
      const handle = new Handle( { startNode: node } );

      // Assert
      expect( ( handle as any ).node ).to.equal( node );
      expect( addListenerSpy.callCount ).to.equal( 2 );
    } );

    it( 'should set addEventListenerOptions to false if passive option is not supported',
      (): void => {
        // Arrange
        const node = new MockNode();

        // This causes the test for passive event listener option to fail.
        global.window = undefined;

        // Act
        const handle = new Handle( { startNode: node } );

        // Assert
        expect( ( handle as any ).addEventListenerOptions ).to.be.false;
      }
    );
  } );

  describe( 'destroy', (): void => {
    it( 'should remove the event listeners from the node', (): void => {
      // Arrange
      const node = new MockNode();
      const removeListenerSpy = spy( node, 'removeEventListener' );
      const handle = new Handle( { startNode: node } );

      // Act
      handle.destroy();

      // Assert
      expect( ( handle as any ).node ).to.be.null;
      expect( removeListenerSpy.callCount ).to.equal( 2 );
    } );

    it( 'should not fail when called twice on the same handle', (): void => {
      // Arrange
      const node = new MockNode();
      const removeEventSpy = spy( node, 'removeEventListener' );
      const handle = new Handle( { startNode: node } );

      // Act
      handle.destroy();
      handle.destroy();

      // Assert
      expect( ( handle as any ).node ).to.be.null;
      expect( removeEventSpy.callCount ).to.equal( 2 );
    } );
  } );

  describe( 'beginDrag', (): void => {
    it( 'should call the beginning function on mousedown event', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( { startNode: node } );
      const beginningSpy = spy( handle, 'beginning' );

      const event = new MockEvent().setClientPoint( 0, 0 );

      // Act
      node.sendEvent( 'mousedown', event );

      // Assert
      expect( beginningSpy.calledOnce ).to.be.true;
    } );

    it( 'should call the beginning function on touchstart event', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( { startNode: node } );
      const beginningSpy = spy( handle, 'beginning' );

      const event = new MockEvent().setClientPoint( 0, 0 );

      // Act
      node.sendEvent( 'touchstart', event );

      // Assert
      expect( beginningSpy.calledOnce ).to.be.true;
    } );

    it( 'should not call the beginning function when the handle is disabled', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( { startNode: node } );
      handle.enabled = false;
      const beginningSpy = spy( handle, 'beginning' );

      const event = new MockEvent().setClientPoint( 0, 0 );

      // Act
      node.sendEvent( 'mousedown', event );

      // Assert
      expect( beginningSpy.calledOnce ).to.be.false;
    } );

    it( 'should not call the beginning function if the event has no position info', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( { startNode: node } );
      const beginningSpy = spy( handle, 'beginning' );

      const event = new MockEvent();

      // Act
      node.sendEvent( 'mousedown', event );

      // Assert
      expect( beginningSpy.calledOnce ).to.be.false;
    } );

    it( 'should set the start vector', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( { startNode: node } );
      const event = new MockEvent().setClientPoint( 1, 2 );

      // Act
      node.sendEvent( 'mousedown', event );

      // Assert
      expect( handle.start!.equals( new Vector2( 1, 2 ) ) ).to.be.true;
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
      expect( handle.start!.equals( new Vector2( 2, 3 ) ) ).to.be.true;
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
      const addListenerSpy = spy( global.document, 'addEventListener' );

      const event = new MockEvent().setClientPoint( 0, 0 );

      // Act
      node.sendEvent( 'mousedown', event );

      // Assert
      expect( addListenerSpy.notCalled ).to.be.true;
    } );

    it( 'should register 7 more events if beginning function returns true', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( { startNode: node } );
      handle.beginning = (): boolean => {
        return true;
      };
      const addListenerSpy = spy( global.document, 'addEventListener' );

      const event = new MockEvent().setClientPoint( 0, 0 );

      // Act
      node.sendEvent( 'mousedown', event );

      // Assert
      expect( addListenerSpy.callCount ).to.equal( 7 );
      global.document.sendEvent( 'mousemove', event );
      global.document.sendEvent( 'mouseup', event );
    } );

    it( 'should clear positions from previous drags', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( { startNode: node } );
      handle.beginning = (): boolean => {
        return true;
      };
      const startEvent = new MockEvent().setClientPoint( 1, 2 );
      const dragEvent = new MockEvent().setClientPoint( 10, 20 );
      const secondStartEvent = new MockEvent();

      // Act
      node.sendEvent( 'mousedown', startEvent );
      global.document.sendEvent( 'mousemove', dragEvent );
      global.document.sendEvent( 'mouseup', dragEvent );

      expect( handle.start!.equals( new Vector2( 1, 2 ) ) ).to.be.true;

      // Second drag, without position information.
      node.sendEvent( 'mousedown', secondStartEvent );

      // Assert
      expect( handle.start ).to.be.undefined;
      expect( ( handle as any )._absoluteStart ).to.be.undefined;
      expect( handle.temp ).to.be.undefined;
      expect( handle.delta ).to.be.undefined;
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
      const continuingSpy = spy( handle, 'continuing' );

      const startEvent = new MockEvent().setClientPoint( 0, 0 );
      const dragEvent = new MockEvent().setClientPoint( 1, 100 );

      // Act
      node.sendEvent( 'mousedown', startEvent );
      global.document.sendEvent( 'mousemove', dragEvent );

      // Assert
      expect( continuingSpy.calledOnce ).to.be.true;
      global.document.sendEvent( 'mouseup', dragEvent );
    } );

    it( 'should not call the continuing function before minimum distance is reached', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( { startNode: node, minimumDragDistance: 5 } );
      handle.beginning = (): boolean => {
        return true;
      };
      const continuingSpy = spy( handle, 'continuing' );

      const startEvent = new MockEvent().setClientPoint( 0, 0 );
      const dragEvent = new MockEvent().setClientPoint( 1, 2 );

      // Act
      node.sendEvent( 'mousedown', startEvent );
      global.document.sendEvent( 'mousemove', dragEvent );

      // Assert
      expect( continuingSpy.notCalled ).to.be.true;
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
        const continuingSpy = spy( handle, 'continuing' );

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
        expect( continuingSpy.callCount ).to.equal( 2 );
        global.document.sendEvent( 'mouseup', dragEvent2 );
      }
    );

    it( 'should not call the continuing function when start positions are missing', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( { startNode: node, minimumDragDistance: 50 } );
      handle.beginning = (): boolean => {
        return true;
      };
      const continuingSpy = spy( handle, 'continuing' );

      const startEvent = new MockEvent().setClientPoint( 0, 0 );
      const dragEvent = new MockEvent().setClientPoint( 1, 100 );

      // Act
      node.sendEvent( 'mousedown', startEvent );
      ( handle as any )._start = undefined;
      global.document.sendEvent( 'mousemove', dragEvent );

      // Assert
      expect( continuingSpy.notCalled ).to.be.true;
      global.document.sendEvent( 'mouseup', dragEvent );
    } );

    it( 'should not call the continuing function if current position is missing', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( { startNode: node, minimumDragDistance: 50 } );
      handle.beginning = (): boolean => {
        return true;
      };
      const continuingSpy = spy( handle, 'continuing' );

      const startEvent = new MockEvent().setClientPoint( 0, 0 );
      const dragEvent = new MockEvent();

      // Act
      node.sendEvent( 'mousedown', startEvent );
      global.document.sendEvent( 'mousemove', dragEvent );

      // Assert
      expect( continuingSpy.notCalled ).to.be.true;
      global.document.sendEvent( 'mouseup', dragEvent );
    } );

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
        const continuingSpy = spy( handle, 'continuing' );

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
        expect( continuingSpy.callCount ).to.equal( 3 );
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
      expect( handle.temp!.equals( new Vector2( 3, 5 ) ) ).to.be.true;
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
      expect( handle.delta!.equals( new Vector2( 2, 3 ) ) ).to.be.true;
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
      expect( handle.delta!.equals( new Vector2( 2, 3 ) ) ).to.be.true;
      // Temp has delta applied on the start position that came from the custom extract function.
      expect( handle.temp!.equals( new Vector2( 102, 103 ) ) ).to.be.true;
      global.document.sendEvent( 'mouseup', dragEvent );
    } );
  } );

  describe( 'endDrag', (): void => {
    it( 'should call the ending and cleanup functions if there was a drag', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( { startNode: node } );
      handle.beginning = (): boolean => {
        return true;
      };
      const clickedSpy = spy( handle, 'clicked' );
      const endingSpy = spy( handle, 'ending' );
      const cleanupSpy = spy( handle, 'cleanup' );

      const startEvent = new MockEvent().setClientPoint( 0, 0 );
      const dragEvent = new MockEvent().setClientPoint( 1, 5 );

      // Act
      node.sendEvent( 'mousedown', startEvent );
      global.document.sendEvent( 'mousemove', dragEvent );
      global.document.sendEvent( 'mouseup', dragEvent );

      // Assert
      expect( endingSpy.calledOnce ).to.be.true;
      expect( cleanupSpy.calledOnce ).to.be.true;
      expect( clickedSpy.notCalled ).to.be.true;
    } );

    it( 'should call the clicked and cleanup functions if there was no move event', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( { startNode: node } );
      handle.beginning = (): boolean => {
        return true;
      };
      const clickedSpy = spy( handle, 'clicked' );
      const endingSpy = spy( handle, 'ending' );
      const cleanupSpy = spy( handle, 'cleanup' );

      const event = new MockEvent().setClientPoint( 0, 0 );

      // Act
      node.sendEvent( 'mousedown', event );
      global.document.sendEvent( 'mouseup', event );

      // Assert
      expect( clickedSpy.calledOnce ).to.be.true;
      expect( cleanupSpy.calledOnce ).to.be.true;
      expect( endingSpy.notCalled ).to.be.true;
    } );

    it( 'should call the clicked and cleanup functions if the move was below limit', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( { startNode: node, minimumDragDistance: 5 } );
      handle.beginning = (): boolean => {
        return true;
      };
      const clickedSpy = spy( handle, 'clicked' );
      const endingSpy = spy( handle, 'ending' );
      const cleanupSpy = spy( handle, 'cleanup' );

      const startEvent = new MockEvent().setClientPoint( 0, 0 );
      const dragEvent = new MockEvent().setClientPoint( 1, 2 );

      // Act
      node.sendEvent( 'mousedown', startEvent );
      global.document.sendEvent( 'mousemove', dragEvent );
      global.document.sendEvent( 'mouseup', dragEvent );

      // Assert
      expect( clickedSpy.calledOnce ).to.be.true;
      expect( cleanupSpy.calledOnce ).to.be.true;
      expect( endingSpy.notCalled ).to.be.true;
    } );

    it( 'should call the clicked function if only the end move was above limit', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( { startNode: node, minimumDragDistance: 50 } );
      handle.beginning = (): boolean => {
        return true;
      };
      const clickedSpy = spy( handle, 'clicked' );
      const endingSpy = spy( handle, 'ending' );
      const cleanupSpy = spy( handle, 'cleanup' );

      const startEvent = new MockEvent().setClientPoint( 0, 0 );
      const dragEvent = new MockEvent().setClientPoint( 1, 2 );
      const endEvent = new MockEvent().setClientPoint( 1, 100 );

      // Act
      node.sendEvent( 'mousedown', startEvent );
      global.document.sendEvent( 'mousemove', dragEvent );
      global.document.sendEvent( 'mouseup', endEvent );

      // Assert
      expect( clickedSpy.calledOnce ).to.be.true;
      expect( cleanupSpy.calledOnce ).to.be.true;
      expect( endingSpy.notCalled ).to.be.true;
    } );

    it( 'should call the ending callback even if the end event has no coordinates', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( { startNode: node } );
      handle.beginning = (): boolean => {
        return true;
      };
      const clickedSpy = spy( handle, 'clicked' );
      const endingSpy = spy( handle, 'ending' );
      const cleanupSpy = spy( handle, 'cleanup' );

      const startEvent = new MockEvent().setClientPoint( 0, 0 );
      const dragEvent = new MockEvent().setClientPoint( 1, 5 );
      const endEvent = new MockEvent();

      // Act
      node.sendEvent( 'mousedown', startEvent );
      global.document.sendEvent( 'mousemove', dragEvent );
      global.document.sendEvent( 'mouseup', endEvent );

      // Assert
      expect( endingSpy.calledOnce ).to.be.true;
      expect( cleanupSpy.calledOnce ).to.be.true;
      expect( clickedSpy.notCalled ).to.be.true;
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
      expect( handle.temp!.equals( new Vector2( 3, 5 ) ) ).to.be.true;
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
      expect( handle.delta!.equals( new Vector2( 2, 3 ) ) ).to.be.true;
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
      expect( handle.delta!.equals( new Vector2( 2, 3 ) ) ).to.be.true;
      // Temp has delta applied on the start position that came from the custom extract function.
      expect( handle.temp!.equals( new Vector2( 102, 103 ) ) ).to.be.true;
    } );

    it( 'should remove 7 events', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( { startNode: node } );
      handle.beginning = (): boolean => {
        return true;
      };
      const removeListenerSpy = spy( global.document, 'removeEventListener' );

      const event = new MockEvent().setClientPoint( 0, 0 );

      // Act
      node.sendEvent( 'mousedown', event );
      global.document.sendEvent( 'mousemove', event );
      global.document.sendEvent( 'mouseup', event );

      // Assert
      expect( removeListenerSpy.callCount ).to.equal( 7 );
    } );

    it( 'should remove 7 events even if the end event is missing position info', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new Handle( { startNode: node } );
      handle.beginning = (): boolean => {
        return true;
      };
      const removeListenerSpy = spy( global.document, 'removeEventListener' );

      const startEvent = new MockEvent().setClientPoint( 0, 0 );
      const dragEvent = new MockEvent().setClientPoint( 1, 5 );
      const endEvent = new MockEvent();

      // Act
      node.sendEvent( 'mousedown', startEvent );
      global.document.sendEvent( 'mousemove', dragEvent );
      global.document.sendEvent( 'mouseup', endEvent );

      // Assert
      expect( removeListenerSpy.callCount ).to.equal( 7 );
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
      const preventDefaultSpy = spy( selectEvent, 'preventDefault' );

      // Act
      node.sendEvent( 'mousedown', event );
      global.document.sendEvent( 'selectstart', selectEvent );
      global.document.sendEvent( 'mouseup', event );

      // Assert
      expect( preventDefaultSpy.calledOnce ).to.be.true;
    } );
  } );
} );
