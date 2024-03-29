import { Vector2 } from '@daign/math';
import { Schedule } from '@daign/schedule';

import { isPassiveSupported } from './isPassiveSupported';

/* The function that extracts the coordinates from mouse events relative to the application's
 * viewport. */
const absoluteExtractFromEvent = ( event: any ): Vector2 => {
  return new Vector2().setFromEvent( event );
};

/**
 * Class to handle drag actions on DOM elements.
 */
export class Handle {
  // The DOM node on which the start event listeners are registered.
  protected node: any;

  // Distance in pixels below which a drag is still considered a click.
  public minimumDragDistance: number = 5;

  // The function that is used to extract the coordinates from mouse events for the start position.
  public extractFromEvent: ( event: any ) => Vector2 = absoluteExtractFromEvent;

  // Waiting time in milliseconds between throttled move events. 40ms = 25fps.
  public throttleInterval: number = 40;

  // Options to be passed to every event listener registration.
  protected addEventListenerOptions: AddEventListenerOptions | boolean;

  // Start position of the drag.
  private _start: Vector2 | undefined;

  // Start position of the drag relative to the application's viewport.
  private _absoluteStart: Vector2 | undefined;

  // Current position of the drag.
  private _temp: Vector2 | undefined;

  // Current difference to start position.
  private _delta: Vector2 | undefined;

  // Variable to temporarily disable the handle.
  public enabled: boolean = true;

  /**
   * Get the start position of the drag.
   * @returns The start position of the drag or undefined.
   */
  public get start(): Vector2 | undefined {
    return this._start;
  }

  /**
   * Get the current position of the drag.
   * @returns The current position of the drag or undefined.
   */
  public get temp(): Vector2 | undefined {
    return this._temp;
  }

  /**
   * Get the current difference to start position.
   * @returns The current difference to start position or undefined.
   */
  public get delta(): Vector2 | undefined {
    return this._delta;
  }

  /**
   * Constructor.
   */
  public constructor() {
    /* Add the passive false option to every event listener registration, if supported by the
     * browser. */
    const passiveSupported = isPassiveSupported();
    if ( passiveSupported ) {
      const options: AddEventListenerOptions = { passive: false };
      this.addEventListenerOptions = options;
    } else {
      this.addEventListenerOptions = false;
    }
  }

  /**
   * Set the DOM node on which the start event listeners will be registered.
   * @param startNode - The DOM node.
   */
  public setStartNode( startNode: any ): void {
    this.destroy();
    this.node = startNode;
    this.node.addEventListener( 'mousedown', this.beginDrag, this.addEventListenerOptions );
    this.node.addEventListener( 'touchstart', this.beginDrag, this.addEventListenerOptions );
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
   * Callback to execute during the drag if a drag was detected.
   */
  public continuing: ( event: any ) => void = () => {};

  /**
   * Callback to execute when the drag has ended if a drag was detected.
   */
  public ending: ( event: any ) => void = () => {};

  /**
   * Callback to execute instead of a drag if the mouse was released without a position change.
   */
  public clicked: ( event: any ) => void = () => {};

  /**
   * Callback to execute at the mouseup event no matter if a drag was detected or not.
   */
  public cleanup: () => void = () => {};

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
    this._start = undefined;
    this._absoluteStart = undefined;
    this._temp = undefined;
    this._delta = undefined;

    try {
      const startPosition = this.extractFromEvent( startEvent );
      const absoluteStartPosition = absoluteExtractFromEvent( startEvent );

      this._start = startPosition;
      this._absoluteStart = absoluteStartPosition;
    } catch {
      // Cancel action when the start positions could not be obtained.
      return;
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

        // Cancel the update of the continued drag if the start positions are missing.
        if ( this._start === undefined || this._absoluteStart === undefined ) {
          return;
        }

        try {
          const absoluteTemp = absoluteExtractFromEvent( moveEvent );

          /* Delta value is always calculated based upon the absolute coordinates. Because the start
           * position may be calculated relative to the target object of the mouse event, but during
           * a drag the target object can change, resulting in incorrect delta values. */
          this._delta = absoluteTemp.clone().sub( this._absoluteStart );

          /* The calculated temp value has the same offset like the start position, added with the
           * absolute delta value. */
          this._temp = this._start.clone().add( this._delta );
        } catch {
          // Cancel the update of the continued drag if the current position could not be obtained.
          return;
        }

        if ( !dragged ) {
          /* The action is only recognized as a drag after a minimum distance to the start event has
           * been reached. Otherwise the continuing callback is not executed. */
          if ( this._delta.length() >= this.minimumDragDistance ) {
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

        // Only execute drag end if the start positions are not missing.
        if ( this._start !== undefined && this._absoluteStart !== undefined ) {
          /* You should not rely on the delta and temp vectors having been set in the end event
           * handler from the end event or from a move event before. */
          try {
            const absoluteTemp = absoluteExtractFromEvent( endEvent );
            this._delta = absoluteTemp.clone().sub( this._absoluteStart );
            this._temp = this._start.clone().add( this._delta );
          } catch {}

          // Depending on whether a drag was detected the ending or clicked callback is called.
          if ( dragged ) {
            this.ending( endEvent );
          } else {
            this.clicked( endEvent );
          }
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
