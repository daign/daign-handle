import { Vector2 } from '@daign/math';
import { Schedule } from '@daign/schedule';

import { HandleConfig } from './handleConfig';

/**
 * Class to handle drag actions on DOM elements.
 */
export class Handle {
  // The DOM node on which the start event listeners are registered.
  protected node: any;

  // Distance in pixels below which a drag is still considered a click.
  private minimumDragDistance: number = 5;

  // The function that is used to extract the coordinates from mouse events for the start position.
  protected extractFromEvent: ( event: any ) => Vector2;

  /* The function that extracts the coordinates from mouse events relative to the application's
   * viewport. */
  private absoluteExtractFromEvent: ( event: any ) => Vector2 = ( event: any ): Vector2 => {
    return new Vector2().setFromEvent( event );
  };

  // Waiting time in milliseconds between throttled move events. 40ms = 25fps.
  private throttleInterval: number = 40;

  // Start position of the drag.
  private _start: Vector2 = new Vector2();

  // Start position of the drag relative to the application's viewport.
  private _absoluteStart: Vector2 = new Vector2();

  // Current position of the drag.
  private _temp: Vector2 = new Vector2();

  // Current difference to start position.
  private _delta: Vector2 = new Vector2();

  // Variable to temporarily disable the handle.
  public enabled: boolean = true;

  /**
   * Get the start position of the drag.
   */
  public get start(): Vector2 {
    return this._start;
  }

  /**
   * Get the current position of the drag.
   */
  public get temp(): Vector2 {
    return this._temp;
  }

  /**
   * Get the current difference to start position.
   */
  public get delta(): Vector2 {
    return this._delta;
  }

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

    if ( config.throttleInterval !== undefined ) {
      this.throttleInterval = config.throttleInterval;
    }

    this.node.addEventListener( 'mousedown', this.beginDrag, false );
    this.node.addEventListener( 'touchstart', this.beginDrag, false );
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
  public continuing: () => void = () => {};

  /**
   * Callback to execute when the drag has ended.
   */
  public ending: () => void = () => {};

  /**
   * Callback to execute when mouse was released without a position change.
   */
  public clicked: () => void = () => {};

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

    this._start.copy( this.extractFromEvent( startEvent ) );
    this._absoluteStart.copy( this.absoluteExtractFromEvent( startEvent ) );

    // When the beginning function returns false then the drag or click is not continued.
    if ( this.beginning( startEvent ) ) {

      const cancelSelect = ( selectEvent: any ): void => {
        selectEvent.preventDefault();
        selectEvent.stopPropagation();
      };

      const continueDrag = ( moveEvent: any ): void => {
        moveEvent.preventDefault();
        moveEvent.stopPropagation();

        const absoluteTemp = this.absoluteExtractFromEvent( moveEvent );

        /* Delta value is always calculated based upon the absolute coordinates. Because the start
         * position may be calculated relative to the target object of the mouse event, but during
         * a drag the target object can change, resulting in incorrect delta values. */
        this._delta.copy( absoluteTemp ).sub( this._absoluteStart );

        /* The calculated temp value has the same offset like the start position, added with the
         * absolute delta value. */
        this._temp.copy( this._start ).add( this._delta );

        if ( !dragged ) {
          /* The action is only recognized as a drag after a minimum distance to the start event has
           * been reached. Otherwise the continuing callback is not executed. */
          if ( this._delta.length() >= this.minimumDragDistance ) {
            dragged = true;
          } else {
            return;
          }
        }

        this.continuing();
      };

      const throttledContinue = Schedule.deferringThrottle( continueDrag, this.throttleInterval,
        this );

      const endDrag = ( endEvent: any ): void => {
        endEvent.preventDefault();
        endEvent.stopPropagation();

        const absoluteTemp = this.absoluteExtractFromEvent( endEvent );
        this._delta.copy( absoluteTemp ).sub( this._absoluteStart );
        this._temp.copy( this._start ).add( this._delta );

        if ( dragged ) {
          this.ending();
        } else {
          this.clicked();
        }

        document.removeEventListener( 'mousemove', throttledContinue, false );
        document.removeEventListener( 'touchmove', throttledContinue, false );

        document.removeEventListener( 'selectstart', cancelSelect, false );

        document.removeEventListener( 'mouseup', endDrag, false );
        document.removeEventListener( 'touchend', endDrag, false );
        document.removeEventListener( 'touchcancel', endDrag, false );
        document.removeEventListener( 'touchleave', endDrag, false );
      };

      /* The move and end events are registered on the document node by default. Because during a
       * drag the mouse can temporarily or permanently leave the node that started the event. */
      document.addEventListener( 'mousemove', throttledContinue, false );
      document.addEventListener( 'touchmove', throttledContinue, false );

      document.addEventListener( 'selectstart', cancelSelect, false );

      document.addEventListener( 'mouseup', endDrag, false );
      document.addEventListener( 'touchend', endDrag, false );
      document.addEventListener( 'touchcancel', endDrag, false );
      document.addEventListener( 'touchleave', endDrag, false );
    }
  };
}
