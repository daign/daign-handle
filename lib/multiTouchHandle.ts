import { Vector2 } from '@daign/math';
import { Schedule } from '@daign/schedule';

import { HandleConfig } from './handleConfig';
import { isPassiveSupported } from './isPassiveSupported';

/**
 * Class to handle multi touch drag actions on DOM elements.
 */
export class MultiTouchHandle {
  // The DOM node on which the start event listeners are registered.
  protected node: any;

  // Distance in pixels below which a drag is still considered a click.
  private minimumDragDistance: number = 5;

  /* The functions that are used to extract the coordinates from mouse events for the start
   * position. */
  protected extractFromEvent: ( event: any ) => Vector2;
  protected extractFromTouchEvent: ( event: any, touchIndex: number ) => Vector2;

  /* The functions that extract the coordinates from mouse events relative to the application's
   * viewport. */
  private absoluteExtractFromEvent: ( event: any ) => Vector2 = ( event: any ): Vector2 => {
    return new Vector2().setFromEvent( event );
  };
  private absoluteExtractFromTouchEvent: ( event: any, touchIndex: number ) => Vector2 =
  ( event: any, touchIndex: number ): Vector2 => {
    return new Vector2().setFromTouchEvent( event, touchIndex );
  };

  // Waiting time in milliseconds between throttled move events. 40ms = 25fps.
  private throttleInterval: number = 40;

  // Options to be passed to every event listener registration.
  protected addEventListenerOptions: AddEventListenerOptions | boolean;

  // Start positions of the multi touch drag.
  private _startPositions: Vector2[] = [];

  // Start positions of the multi touch drag relative to the application's viewport.
  private _absoluteStartPositions: Vector2[] = [];

  // Current positions of the multi touch drag.
  private _tempPositions: Vector2[] = [];

  // Current differences to start positions.
  private _deltaVectors: Vector2[] = [];

  // Variable to temporarily disable the handle.
  public enabled: boolean = true;

  /**
   * Constructor.
   * @param config - The handle config for setting up the handle.
   */
  public constructor( config: HandleConfig ) {
    this.node = config.startNode;

    if ( config.minimumDragDistance !== undefined ) {
      this.minimumDragDistance = config.minimumDragDistance;
    }

    if ( config.extractFromEvent ) {
      // Use a custom supplied extract function for the start position.
      this.extractFromEvent = config.extractFromEvent;
    } else {
      // Use the default extract function.
      this.extractFromEvent = this.absoluteExtractFromEvent;
    }

    if ( config.extractFromTouchEvent ) {
      // Use a custom supplied extract function for the start position.
      this.extractFromTouchEvent = config.extractFromTouchEvent;
    } else {
      // Use the default extract function.
      this.extractFromTouchEvent = this.absoluteExtractFromTouchEvent;
    }

    if ( config.throttleInterval !== undefined ) {
      this.throttleInterval = config.throttleInterval;
    }

    const passiveSupported = isPassiveSupported();
    if ( passiveSupported ) {
      const options: AddEventListenerOptions = { passive: false };
      this.addEventListenerOptions = options;
    } else {
      this.addEventListenerOptions = false;
    }

    this.node.addEventListener( 'mousedown', this.beginDrag, this.addEventListenerOptions );
    this.node.addEventListener( 'touchstart', this.beginDrag, this.addEventListenerOptions );
  }

  /**
   * Get the start position of the drag.
   * @param index - The finger index of the multi touch.
   * @returns The start position vector or undefined.
   */
  public getStartPosition( index: number ): Vector2 | undefined {
    return this._startPositions[ index ];
  }

  /**
   * Get the current position of the drag.
   * @param index - The finger index of the multi touch.
   * @returns The temp position vector or undefined.
   */
  public getTempPosition( index: number ): Vector2 | undefined {
    return this._tempPositions[ index ];
  }

  /**
   * Get the current difference to start position.
   * @param index - The finger index of the multi touch.
   * @returns The delta vector or undefined.
   */
  public getDelta( index: number ): Vector2 | undefined {
    return this._deltaVectors[ index ];
  }

  /**
   * Remove event listeners from node and remove reference to node.
   */
  public destroy(): void {
    if ( this.node ) {
      this.node.removeEventListener( 'mousedown', this.beginDrag, false );
      this.node.removeEventListener( 'touchstart', this.beginDrag, false );
      this.node = null;
    }
  }

  /**
   * Callback to execute when drag starts, return value determines whether to continue the drag.
   */
  public beginning: ( event: any ) => boolean = () => {
    return false;
  };

  /**
   * Callback to execute during the drag.
   */
  public continuing: ( event: any ) => void = () => {};

  /**
   * Callback to execute when the drag has ended.
   */
  public ending: ( event: any ) => void = () => {};

  /**
   * Callback to execute when mouse was released without a position change.
   */
  public clicked: ( event: any ) => void = () => {};

  /**
   * Callback to execute at the mouseup event no matter if a drag was detected or not.
   */
  public cleanup: () => void = () => {};

  /**
   * Update the positions during the drag.
   * @param event - The touch or mouse event.
   */
  private updatePositions( event: any ): void {
    if (
      this._startPositions.length === 0 ||
      this._absoluteStartPositions.length === 0 ||
      this._tempPositions.length === 0 ||
      this._deltaVectors.length === 0
    ) {
      throw new Error( 'Missing start positions to calculate drag.' );
    }

    if ( event && event.touches && event.touches.length > 0 ) {
      const touchPoints = event.touches.length;

      for ( let i = 0; i < touchPoints; i += 1 ) {
        const absoluteTemp = this.absoluteExtractFromTouchEvent( event, i );

        // Only calculate for touch points that were already present on the start event.
        if ( i < this._startPositions.length ) {
          /* Delta value is always calculated based upon the absolute coordinates. Because the start
           * position may be calculated relative to the target object of the mouse event, but during
           * a drag the target object can change, resulting in incorrect delta values. */
          this._deltaVectors[ i ].copy( absoluteTemp ).sub( this._absoluteStartPositions[ i ] );

          /* The calculated temp value has the same offset like the start position, added with the
           * absolute delta value. */
          this._tempPositions[ i ].copy( this._startPositions[ i ] ).add( this._deltaVectors[ i ] );
        }
      }
    } else {
      /* When there are no touch events use the normal mouse event information to get a single
       * position. */
      const absoluteTemp = this.absoluteExtractFromEvent( event );

      this._deltaVectors[ 0 ].copy( absoluteTemp ).sub( this._absoluteStartPositions[ 0 ] );
      this._tempPositions[ 0 ].copy( this._startPositions[ 0 ] ).add( this._deltaVectors[ 0 ] );
    }
  }

  /**
   * Function that begins executing the drag.
   * This is a function assigned to an object property, not an object method, because when object
   * methods are called from event listeners their this-context is not set to the object.
   */
  private beginDrag: ( event: any ) => void = ( startEvent: any ): void => {
    // Cancel action when the handle is disabled.
    if ( !this.enabled ) {
      return;
    }

    startEvent.preventDefault();
    startEvent.stopPropagation();

    let dragged = false;

    // Clear values from previous drag.
    this._startPositions = [];
    this._absoluteStartPositions = [];
    this._tempPositions = [];
    this._deltaVectors = [];

    if ( startEvent && startEvent.touches && startEvent.touches.length > 0 ) {
      const touchPoints = startEvent.touches.length;

      try {
        for ( let i = 0; i < touchPoints; i += 1 ) {
          const position = this.extractFromTouchEvent( startEvent, i );
          this._startPositions.push( position );

          const absolutePosition = this.absoluteExtractFromTouchEvent( startEvent, i );
          this._absoluteStartPositions.push( absolutePosition );

          this._deltaVectors.push( new Vector2() );
          this._tempPositions.push( position.clone() );
        }
      } catch {
        // Cancel action when the start positions could not be obtained.
        return;
      }
    } else {
      /* When there are no touch events use the normal mouse event information to get a single
       * position. */
      try {
        const position = this.extractFromEvent( startEvent );
        this._startPositions.push( position );

        const absolutePosition = this.absoluteExtractFromEvent( startEvent );
        this._absoluteStartPositions.push( absolutePosition );

        this._deltaVectors.push( new Vector2() );
        this._tempPositions.push( position.clone() );
      } catch {
        // Cancel action when the start positions could not be obtained.
        return;
      }
    }

    // When the beginning function returns false then the drag or click is not continued.
    if ( this.beginning( startEvent ) ) {

      const cancelSelect = ( selectEvent: any ): void => {
        selectEvent.preventDefault();
        selectEvent.stopPropagation();
      };

      const continueDrag = ( moveEvent: any ): void => {
        moveEvent.preventDefault();
        moveEvent.stopPropagation();

        try {
          // Extract position information from event.
          this.updatePositions( moveEvent );
        } catch {
          // Cancel the update of the continued drag if the current position could not be obtained.
          return;
        }

        if ( !dragged ) {
          /* The action is only recognized as a drag after a minimum distance to the start event has
           * been reached. Otherwise the continuing callback is not executed. */
          if ( this._deltaVectors.some( ( delta: Vector2 ): boolean =>
            delta.length() >= this.minimumDragDistance
          ) ) {
            dragged = true;
          } else {
            return;
          }
        }

        // Call the drag handling callback added by the user of the class.
        this.continuing( moveEvent );
      };

      const throttledContinue = Schedule.deferringThrottle( continueDrag, this.throttleInterval,
        this );

      const endDrag = ( endEvent: any ): void => {
        endEvent.preventDefault();
        endEvent.stopPropagation();

        /* You should not rely on the delta and temp vectors having been set in the end event
         * handler from the end event or from a move event before. */
        try {
          this.updatePositions( endEvent );
        } catch {}

        // Depending on whether a drag was detected the ending or clicked callback is called.
        if ( dragged ) {
          this.ending( endEvent );
        } else {
          this.clicked( endEvent );
        }

        // Remove event listeners.
        document.removeEventListener( 'mousemove', throttledContinue, false );
        document.removeEventListener( 'touchmove', throttledContinue, false );

        document.removeEventListener( 'selectstart', cancelSelect, false );

        document.removeEventListener( 'mouseup', endDrag, false );
        document.removeEventListener( 'touchend', endDrag, false );
        document.removeEventListener( 'touchcancel', endDrag, false );
        document.removeEventListener( 'touchleave', endDrag, false );

        // Custom cleanup actions callback.
        this.cleanup();
      };

      /* The move and end events are registered on the document node by default. Because during a
       * drag the mouse can temporarily or permanently leave the node that started the event. */
      document.addEventListener( 'mousemove', throttledContinue, this.addEventListenerOptions );
      document.addEventListener( 'touchmove', throttledContinue, this.addEventListenerOptions );

      document.addEventListener( 'selectstart', cancelSelect, this.addEventListenerOptions );

      document.addEventListener( 'mouseup', endDrag, this.addEventListenerOptions );
      document.addEventListener( 'touchend', endDrag, this.addEventListenerOptions );
      document.addEventListener( 'touchcancel', endDrag, this.addEventListenerOptions );
      document.addEventListener( 'touchleave', endDrag, this.addEventListenerOptions );
    }
  };
}
