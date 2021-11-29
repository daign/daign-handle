import { Vector2 } from '@daign/math';
import { Schedule } from '@daign/schedule';

/**
 * Class to handle drag actions on DOM elements.
 */
export class Handle {
  // The DOM node that triggers the start event.
  protected node: any;

  // Distance in pixels below which a drag is still considered a click.
  private minimumDragDistance: number = 5;

  // The function that is used to extract coordinates from mouse events.
  protected extractFromEvent: ( event: any ) => Vector2;

  // Waiting time in milliseconds between throttled move events. 40ms = 25fps.
  private throttleInterval: number = 40;

  // Start position of the drag.
  private _start: Vector2 = new Vector2();

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
   * @param node - The DOM node that should trigger the start event.
   * @param minimumDragDistance - Distance in px below which a drag is considered a click. Optional.
   * @param extractFromEvent - The function to extract coordinates from mouse events. Optional.
   * @param throttleInterval - Waiting time in milliseconds between throttled move events. Optional.
   */
  public constructor(
    node: any,
    minimumDragDistance?: number,
    extractFromEvent?: ( event: any ) => Vector2,
    throttleInterval?: number
  ) {
    this.node = node;

    if ( minimumDragDistance !== undefined ) {
      this.minimumDragDistance = minimumDragDistance;
    }

    if ( extractFromEvent ) {
      // Use a custom supplied extract function.
      this.extractFromEvent = extractFromEvent;
    } else {
      // Use the default extract function.
      this.extractFromEvent = ( event: any ): Vector2 => {
        return new Vector2().setFromEvent( event );
      };
    }

    if ( throttleInterval !== undefined ) {
      this.throttleInterval = throttleInterval;
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

    // When the beginning function returns false then the drag or click is not continued.
    if ( this.beginning( startEvent ) ) {

      const cancelSelect = ( selectEvent: any ): void => {
        selectEvent.preventDefault();
        selectEvent.stopPropagation();
      };

      const continueDrag = ( moveEvent: any ): void => {
        moveEvent.preventDefault();
        moveEvent.stopPropagation();

        this._temp.copy( this.extractFromEvent( moveEvent ) );
        this._delta.copy( this._temp ).sub( this._start );

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

        this._temp.copy( this.extractFromEvent( endEvent ) );
        this._delta.copy( this._temp ).sub( this._start );

        if ( dragged ) {
          this.ending();
        } else {
          this.clicked();
        }

        document.removeEventListener( 'selectstart', cancelSelect, false );

        document.removeEventListener( 'mousemove', throttledContinue, false );
        document.removeEventListener( 'touchmove', throttledContinue, false );

        document.removeEventListener( 'mouseup', endDrag, false );
        document.removeEventListener( 'touchend', endDrag, false );
        document.removeEventListener( 'touchcancel', endDrag, false );
        document.removeEventListener( 'touchleave', endDrag, false );
      };

      document.addEventListener( 'selectstart', cancelSelect, false );

      document.addEventListener( 'mousemove', throttledContinue, false );
      document.addEventListener( 'touchmove', throttledContinue, false );

      document.addEventListener( 'mouseup', endDrag, false );
      document.addEventListener( 'touchend', endDrag, false );
      document.addEventListener( 'touchcancel', endDrag, false );
      document.addEventListener( 'touchleave', endDrag, false );
    }
  };
}
