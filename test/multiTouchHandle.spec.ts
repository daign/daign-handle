import { expect } from 'chai';
import { spy } from 'sinon';

import { Vector2 } from '@daign/math';
import { MockDocument, MockEvent, MockNode } from '@daign/mock-dom';

import { MultiTouchHandle } from '../lib/multiTouchHandle';

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

describe( 'MultiTouchHandle', (): void => {
  beforeEach( (): void => {
    global.document = new MockDocument();
    global.window = new MockNode();
  } );

  describe( 'constructor', (): void => {
    it( 'should set addEventListenerOptions to false if passive option is not supported',
      (): void => {
        // Arrange
        // This causes the test for passive event listener option to fail.
        global.window = undefined;

        // Act
        const handle = new MultiTouchHandle();

        // Assert
        expect( ( handle as any ).addEventListenerOptions ).to.be.false;
      }
    );
  } );

  describe( 'getStartPosition', (): void => {
    it( 'should get the start position at touch index', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new MultiTouchHandle();
      handle.setStartNode( node );
      ( handle as any )._startPositions.push( new Vector2( 1, 2 ) );
      ( handle as any )._startPositions.push( new Vector2( 3, 4 ) );

      // Act
      const result = handle.getStartPosition( 1 );

      // Assert
      expect( result!.equals( new Vector2( 3, 4 ) ) ).to.be.true;
    } );
  } );

  describe( 'getTempPosition', (): void => {
    it( 'should get the current position at touch index', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new MultiTouchHandle();
      handle.setStartNode( node );
      ( handle as any )._tempPositions.push( new Vector2( 1, 2 ) );
      ( handle as any )._tempPositions.push( new Vector2( 3, 4 ) );

      // Act
      const result = handle.getTempPosition( 1 );

      // Assert
      expect( result!.equals( new Vector2( 3, 4 ) ) ).to.be.true;
    } );
  } );

  describe( 'getDelta', (): void => {
    it( 'should get the delta at touch index', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new MultiTouchHandle();
      handle.setStartNode( node );
      ( handle as any )._deltaVectors.push( new Vector2( 1, 2 ) );
      ( handle as any )._deltaVectors.push( new Vector2( 3, 4 ) );

      // Act
      const result = handle.getDelta( 1 );

      // Assert
      expect( result!.equals( new Vector2( 3, 4 ) ) ).to.be.true;
    } );
  } );

  describe( 'destroy', (): void => {
    it( 'should remove the event listeners from the node', (): void => {
      // Arrange
      const node = new MockNode();
      const removeListenerSpy = spy( node, 'removeEventListener' );
      const handle = new MultiTouchHandle();
      handle.setStartNode( node );

      // Act
      handle.destroy();

      // Assert
      expect( ( handle as any ).node ).to.be.null;
      expect( removeListenerSpy.callCount ).to.equal( 2 );
    } );

    it( 'should not fail when called twice on the same handle', (): void => {
      // Arrange
      const node = new MockNode();
      const removeListenerSpy = spy( node, 'removeEventListener' );
      const handle = new MultiTouchHandle();
      handle.setStartNode( node );

      // Act
      handle.destroy();
      handle.destroy();

      // Assert
      expect( ( handle as any ).node ).to.be.null;
      expect( removeListenerSpy.callCount ).to.equal( 2 );
    } );
  } );

  describe( 'setStartNode', (): void => {
    it( 'should register two event listeners on passed node', (): void => {
      // Arrange
      const node = new MockNode();
      const addListenerSpy = spy( node, 'addEventListener' );
      const handle = new MultiTouchHandle();

      // Act
      handle.setStartNode( node );

      // Assert
      expect( ( handle as any ).node ).to.equal( node );
      expect( addListenerSpy.callCount ).to.equal( 2 );
    } );
  } );

  describe( 'updatePositions', (): void => {
    it( 'should throw error when there are no start positions', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new MultiTouchHandle();
      handle.setStartNode( node );

      handle.beginning = (): boolean => {
        return true;
      };
      const dragEvent = new MockEvent().setClientPoint( 3, 5 );

      // Act
      const badFn = (): void => {
        ( handle as any ).updatePositions( dragEvent );
      };

      // Assert
      expect( badFn ).to.throw( 'Missing start positions to calculate drag.' );
    } );

    it( 'should set the temp vector from mouse event', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new MultiTouchHandle();
      handle.setStartNode( node );

      handle.beginning = (): boolean => {
        return true;
      };
      const startEvent = new MockEvent().setClientPoint( 1, 2 );
      const dragEvent = new MockEvent().setClientPoint( 3, 5 );

      // Act
      node.sendEvent( 'mousedown', startEvent );
      ( handle as any ).updatePositions( dragEvent );

      // Assert
      expect( handle.getTempPosition( 0 )!.equals( new Vector2( 3, 5 ) ) ).to.be.true;
      global.document.sendEvent( 'mouseup', dragEvent );
    } );

    it( 'should set the temp vectors from multi touch events', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new MultiTouchHandle();
      handle.setStartNode( node );

      handle.beginning = (): boolean => {
        return true;
      };
      const startTouch1 = new MockEvent();
      const startTouch2 = new MockEvent();
      startTouch1.setClientPoint( 1, 1 );
      startTouch2.setClientPoint( 4, 5 );
      const startEvent = new MockEvent();
      startEvent.addTouchPoint( startTouch1 );
      startEvent.addTouchPoint( startTouch2 );

      const dragEvent1 = new MockEvent();
      const dragEvent2 = new MockEvent();
      dragEvent1.setClientPoint( 2, 3 );
      dragEvent2.setClientPoint( 7, 9 );
      const dragEvent = new MockEvent();
      dragEvent.addTouchPoint( dragEvent1 );
      dragEvent.addTouchPoint( dragEvent2 );

      // Act
      node.sendEvent( 'mousedown', startEvent );
      ( handle as any ).updatePositions( dragEvent );

      // Assert
      expect( handle.getTempPosition( 0 )!.equals( new Vector2( 2, 3 ) ) ).to.be.true;
      expect( handle.getTempPosition( 1 )!.equals( new Vector2( 7, 9 ) ) ).to.be.true;
      global.document.sendEvent( 'mouseup', dragEvent );
    } );

    it( 'should not add temp vectors that were not present on the start event', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new MultiTouchHandle();
      handle.setStartNode( node );

      handle.beginning = (): boolean => {
        return true;
      };
      const startTouch = new MockEvent();
      startTouch.setClientPoint( 1, 2 );
      const startEvent = new MockEvent();
      startEvent.addTouchPoint( startTouch );

      const dragEvent1 = new MockEvent();
      const dragEvent2 = new MockEvent();
      dragEvent1.setClientPoint( 3, 4 );
      dragEvent2.setClientPoint( 5, 6 );
      const dragEvent = new MockEvent();
      dragEvent.addTouchPoint( dragEvent1 );
      dragEvent.addTouchPoint( dragEvent2 );

      // Act
      node.sendEvent( 'mousedown', startEvent );
      ( handle as any ).updatePositions( dragEvent );

      // Assert
      expect( handle.getTempPosition( 0 )!.equals( new Vector2( 3, 4 ) ) ).to.be.true;
      expect( handle.getTempPosition( 1 ) ).to.be.undefined;
      global.document.sendEvent( 'mouseup', dragEvent );
    } );

    it( 'should set the delta vector from mouse event', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new MultiTouchHandle();
      handle.setStartNode( node );

      handle.beginning = (): boolean => {
        return true;
      };
      const startEvent = new MockEvent().setClientPoint( 1, 2 );
      const dragEvent = new MockEvent().setClientPoint( 3, 5 );

      // Act
      node.sendEvent( 'mousedown', startEvent );
      ( handle as any ).updatePositions( dragEvent );

      // Assert
      expect( handle.getDelta( 0 )!.equals( new Vector2( 2, 3 ) ) ).to.be.true;
      global.document.sendEvent( 'mouseup', dragEvent );
    } );

    it( 'should set the delta vectors from multi touch events', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new MultiTouchHandle();
      handle.setStartNode( node );

      handle.beginning = (): boolean => {
        return true;
      };
      const startTouch1 = new MockEvent();
      const startTouch2 = new MockEvent();
      startTouch1.setClientPoint( 1, 1 );
      startTouch2.setClientPoint( 4, 5 );
      const startEvent = new MockEvent();
      startEvent.addTouchPoint( startTouch1 );
      startEvent.addTouchPoint( startTouch2 );

      const dragEvent1 = new MockEvent();
      const dragEvent2 = new MockEvent();
      dragEvent1.setClientPoint( 2, 3 );
      dragEvent2.setClientPoint( 7, 9 );
      const dragEvent = new MockEvent();
      dragEvent.addTouchPoint( dragEvent1 );
      dragEvent.addTouchPoint( dragEvent2 );

      // Act
      node.sendEvent( 'mousedown', startEvent );
      ( handle as any ).updatePositions( dragEvent );

      // Assert
      expect( handle.getDelta( 0 )!.equals( new Vector2( 1, 2 ) ) ).to.be.true;
      expect( handle.getDelta( 1 )!.equals( new Vector2( 3, 4 ) ) ).to.be.true;
      global.document.sendEvent( 'mouseup', dragEvent );
    } );

    it( 'should not let delta calculation be influenced by custom extract function', (): void => {
      // Arrange
      const node = new MockNode();
      const extractFromEvent = (): Vector2 => {
        return new Vector2( 100, 100 );
      };
      const handle = new MultiTouchHandle();
      handle.setStartNode( node );
      handle.extractFromEvent = extractFromEvent;

      handle.beginning = (): boolean => {
        return true;
      };
      const startEvent = new MockEvent().setClientPoint( 1, 2 );
      const dragEvent = new MockEvent().setClientPoint( 3, 5 );

      // Act
      node.sendEvent( 'mousedown', startEvent );
      ( handle as any ).updatePositions( dragEvent );

      // Assert
      // Delta ignores the custom extract function and uses only client coordinates.
      expect( handle.getDelta( 0 )!.equals( new Vector2( 2, 3 ) ) ).to.be.true;
      // Temp has delta applied on the start position that came from the custom extract function.
      expect( handle.getTempPosition( 0 )!.equals( new Vector2( 102, 103 ) ) ).to.be.true;
      global.document.sendEvent( 'mouseup', dragEvent );
    } );
  } );

  describe( 'beginDrag', (): void => {
    it( 'should call the beginning function on mousedown event', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new MultiTouchHandle();
      handle.setStartNode( node );
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
      const handle = new MultiTouchHandle();
      handle.setStartNode( node );
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
      const handle = new MultiTouchHandle();
      handle.setStartNode( node );
      handle.enabled = false;
      const beginningSpy = spy( handle, 'beginning' );

      const event = new MockEvent().setClientPoint( 0, 0 );

      // Act
      node.sendEvent( 'mousedown', event );

      // Assert
      expect( beginningSpy.calledOnce ).to.be.false;
    } );

    it( 'should not call the beginning function if event has no position info', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new MultiTouchHandle();
      handle.setStartNode( node );
      const beginningSpy = spy( handle, 'beginning' );

      const event = new MockEvent();

      // Act
      node.sendEvent( 'mousedown', event );

      // Assert
      expect( beginningSpy.notCalled ).to.be.true;
    } );

    it( 'should not call the beginning function if touch event has no position info', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new MultiTouchHandle();
      handle.setStartNode( node );
      const beginningSpy = spy( handle, 'beginning' );

      const event = new MockEvent().setClientPoint( 0, 0 );
      const touchEvent = new MockEvent();
      event.addTouchPoint( touchEvent );

      // Act
      node.sendEvent( 'mousedown', event );

      // Assert
      expect( beginningSpy.notCalled ).to.be.true;
    } );

    it( 'should set the start vectors', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new MultiTouchHandle();
      handle.setStartNode( node );
      const event = new MockEvent().setClientPoint( 1, 2 );

      // Act
      node.sendEvent( 'mousedown', event );

      // Assert
      expect( handle.getStartPosition( 0 )!.equals( new Vector2( 1, 2 ) ) ).to.be.true;
    } );

    it( 'should set the start vectors from touch event', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new MultiTouchHandle();
      handle.setStartNode( node );

      const startTouch1 = new MockEvent();
      const startTouch2 = new MockEvent();
      startTouch1.setClientPoint( 1, 1 );
      startTouch2.setClientPoint( 4, 5 );
      const startEvent = new MockEvent();
      startEvent.addTouchPoint( startTouch1 );
      startEvent.addTouchPoint( startTouch2 );

      // Act
      node.sendEvent( 'mousedown', startEvent );

      // Assert
      expect( handle.getStartPosition( 0 )!.equals( new Vector2( 1, 1 ) ) ).to.be.true;
      expect( handle.getStartPosition( 1 )!.equals( new Vector2( 4, 5 ) ) ).to.be.true;
    } );

    it( 'should set the start vectors from the custom extract function', (): void => {
      // Arrange
      const node = new MockNode();
      const extractFromEvent = (): Vector2 => {
        return new Vector2( 2, 3 );
      };
      const handle = new MultiTouchHandle();
      handle.setStartNode( node );
      handle.extractFromEvent = extractFromEvent;
      const event = new MockEvent().setClientPoint( 1, 2 );

      // Act
      node.sendEvent( 'mousedown', event );

      // Assert
      expect( handle.getStartPosition( 0 )!.equals( new Vector2( 2, 3 ) ) ).to.be.true;
      // Absolute start coordinates should be stored in a private variable.
      expect( ( handle as any )._absoluteStartPositions[ 0 ].equals( new Vector2( 1, 2 ) ) )
        .to.be.true;
    } );

    it( 'should set the start vectors from the custom multi touch extract function', (): void => {
      // Arrange
      const node = new MockNode();
      const extractFromTouchEvent = ( _: any, touchIndex: number ): Vector2 => {
        if ( touchIndex === 0 ) {
          return new Vector2( 3, 4 );
        } else {
          return new Vector2( 7, 8 );
        }
      };
      const handle = new MultiTouchHandle();
      handle.setStartNode( node );
      handle.extractFromTouchEvent = extractFromTouchEvent;

      const startTouch1 = new MockEvent();
      const startTouch2 = new MockEvent();
      startTouch1.setClientPoint( 1, 2 );
      startTouch2.setClientPoint( 5, 6 );
      const startEvent = new MockEvent();
      startEvent.addTouchPoint( startTouch1 );
      startEvent.addTouchPoint( startTouch2 );

      // Act
      node.sendEvent( 'mousedown', startEvent );

      // Assert
      expect( handle.getStartPosition( 0 )!.equals( new Vector2( 3, 4 ) ) ).to.be.true;
      expect( handle.getStartPosition( 1 )!.equals( new Vector2( 7, 8 ) ) ).to.be.true;

      // Absolute start coordinates should be stored in a private variable.
      expect( ( handle as any )._absoluteStartPositions[ 0 ].equals( new Vector2( 1, 2 ) ) )
        .to.be.true;
      expect( ( handle as any )._absoluteStartPositions[ 1 ].equals( new Vector2( 5, 6 ) ) )
        .to.be.true;
    } );

    it( 'should not register more events if beginning function returns false', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new MultiTouchHandle();
      handle.setStartNode( node );

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
      const handle = new MultiTouchHandle();
      handle.setStartNode( node );

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

    it( 'should clear positions from previous drag', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new MultiTouchHandle();
      handle.setStartNode( node );

      handle.beginning = (): boolean => {
        return true;
      };

      const startEvent = new MockEvent().setClientPoint( 0, 0 );
      const dragEvent = new MockEvent().setClientPoint( 1, 5 );
      const secondStartEvent = new MockEvent();

      // Act
      node.sendEvent( 'mousedown', startEvent );
      global.document.sendEvent( 'mousemove', dragEvent );
      global.document.sendEvent( 'mouseup', dragEvent );

      expect( ( handle as any )._startPositions.length ).to.equal( 1 );
      expect( ( handle as any )._absoluteStartPositions.length ).to.equal( 1 );
      expect( ( handle as any )._tempPositions.length ).to.equal( 1 );
      expect( ( handle as any )._deltaVectors.length ).to.equal( 1 );

      // Second drag, without position information.
      node.sendEvent( 'mousedown', secondStartEvent );

      // Assert
      expect( ( handle as any )._startPositions.length ).to.equal( 0 );
      expect( ( handle as any )._absoluteStartPositions.length ).to.equal( 0 );
      expect( ( handle as any )._tempPositions.length ).to.equal( 0 );
      expect( ( handle as any )._deltaVectors.length ).to.equal( 0 );
    } );
  } );

  describe( 'continueDrag', (): void => {
    it( 'should call the continuing function on mousemove event', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new MultiTouchHandle();
      handle.setStartNode( node );
      handle.minimumDragDistance = 50;

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
      const handle = new MultiTouchHandle();
      handle.setStartNode( node );
      handle.minimumDragDistance = 5;

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
        const handle = new MultiTouchHandle();
        handle.setStartNode( node );
        handle.minimumDragDistance = 5;
        handle.throttleInterval = 1;

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

    it( 'should not call the continuing function if updatePositions fails', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new MultiTouchHandle();
      handle.setStartNode( node );
      handle.minimumDragDistance = 50;

      handle.beginning = (): boolean => {
        return true;
      };
      const continuingSpy = spy( handle, 'continuing' );

      const startEvent = new MockEvent().setClientPoint( 0, 0 );
      const dragEvent = new MockEvent().setClientPoint( 1, 100 );

      // Act
      node.sendEvent( 'mousedown', startEvent );
      ( handle as any )._startPositions = [];
      global.document.sendEvent( 'mousemove', dragEvent );

      // Assert
      expect( continuingSpy.notCalled ).to.be.true;
      global.document.sendEvent( 'mouseup', dragEvent );
    } );

    it( 'should skip event execution according to throttle interval',
      async (): Promise<void> => {
        // Arrange
        const node = new MockNode();
        const handle = new MultiTouchHandle();
        handle.setStartNode( node );
        handle.minimumDragDistance = 5;
        handle.throttleInterval = 10;

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

    it( 'should call updatePositions', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new MultiTouchHandle();
      handle.setStartNode( node );

      const updatePostionsSpy = spy( ( handle as any ), 'updatePositions' );
      handle.beginning = (): boolean => {
        return true;
      };
      const startEvent = new MockEvent().setClientPoint( 1, 2 );
      const dragEvent = new MockEvent().setClientPoint( 3, 5 );

      // Act
      node.sendEvent( 'mousedown', startEvent );
      global.document.sendEvent( 'mousemove', dragEvent );

      // Assert
      expect( updatePostionsSpy.calledOnce ).to.be.true;
      global.document.sendEvent( 'mouseup', dragEvent );
    } );
  } );

  describe( 'endDrag', (): void => {
    it( 'should call the ending and cleanup functions if there was a drag', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new MultiTouchHandle();
      handle.setStartNode( node );

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

    it( 'should call the ending function even if end event is missing coordinates', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new MultiTouchHandle();
      handle.setStartNode( node );

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

    it( 'should call the clicked and cleanup functions if there was no move event', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new MultiTouchHandle();
      handle.setStartNode( node );

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

    it( 'should call the clicked function if the movement was below limit', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new MultiTouchHandle();
      handle.setStartNode( node );
      handle.minimumDragDistance = 5;

      handle.beginning = (): boolean => {
        return true;
      };
      const clickedSpy = spy( handle, 'clicked' );
      const endingSpy = spy( handle, 'ending' );

      const startEvent = new MockEvent().setClientPoint( 0, 0 );
      const dragEvent = new MockEvent().setClientPoint( 1, 2 );

      // Act
      node.sendEvent( 'mousedown', startEvent );
      global.document.sendEvent( 'mousemove', dragEvent );
      global.document.sendEvent( 'mouseup', dragEvent );

      // Assert
      expect( clickedSpy.calledOnce ).to.be.true;
      expect( endingSpy.notCalled ).to.be.true;
    } );

    it( 'should call the clicked function if only the end move was above limit', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new MultiTouchHandle();
      handle.setStartNode( node );
      handle.minimumDragDistance = 50;

      handle.beginning = (): boolean => {
        return true;
      };
      const clickedSpy = spy( handle, 'clicked' );
      const endingSpy = spy( handle, 'ending' );

      const startEvent = new MockEvent().setClientPoint( 0, 0 );
      const dragEvent = new MockEvent().setClientPoint( 1, 2 );
      const endEvent = new MockEvent().setClientPoint( 1, 100 );

      // Act
      node.sendEvent( 'mousedown', startEvent );
      global.document.sendEvent( 'mousemove', dragEvent );
      global.document.sendEvent( 'mouseup', endEvent );

      // Assert
      expect( clickedSpy.calledOnce ).to.be.true;
      expect( endingSpy.notCalled ).to.be.true;
    } );

    it( 'should call updatePositions', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new MultiTouchHandle();
      handle.setStartNode( node );

      const updatePositionsSpy = spy( ( handle as any ), 'updatePositions' );
      handle.beginning = (): boolean => {
        return true;
      };
      const startEvent = new MockEvent().setClientPoint( 1, 2 );
      const dragEvent = new MockEvent().setClientPoint( 0, 0 );
      const endEvent = new MockEvent().setClientPoint( 3, 5 );

      // Act
      node.sendEvent( 'mousedown', startEvent );
      global.document.sendEvent( 'mousemove', dragEvent );
      updatePositionsSpy.resetHistory();
      global.document.sendEvent( 'mouseup', endEvent );

      // Assert
      expect( updatePositionsSpy.calledOnce ).to.be.true;
    } );

    it( 'should remove 7 events', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new MultiTouchHandle();
      handle.setStartNode( node );

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
  } );

  describe( 'cancelSelect', (): void => {
    it( 'should call preventDefault on the selectEvent', (): void => {
      // Arrange
      const node = new MockNode();
      const handle = new MultiTouchHandle();
      handle.setStartNode( node );

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
