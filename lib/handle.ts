import {Vector2} from '@daign/math';
import {Schedule} from '@daign/schedule';

/**
 * Class to handle drag actions on DOM elements.
 */
export class Handle {
  // The DOM node that triggers the start event
  private node: any;

  // Start position of the drag
  private _start: Vector2 = new Vector2();

  // Current position of the drag
  private _temp: Vector2 = new Vector2();

  // Current difference to start position
  private _delta: Vector2 = new Vector2();

  /**
   * Get the start position of the drag
   */
  public get start(): Vector2 {
    return this._start;
  }

  /**
   * Get the current position of the drag
   */
  public get temp(): Vector2 {
    return this._temp;
  }

  /**
   * Get the current difference to start position
   */
  public get delta(): Vector2 {
    return this._delta;
  }

  /**
   * Constructor
   * @param node The DOM node that should trigger the start event
   */
  constructor( node: any ) {
    this.node = node;

    this.node.addEventListener( 'mousedown', ( event: any ): void => {
      this.beginDrag( event );
    }, false );
    this.node.addEventListener( 'touchstart', ( event: any ): void => {
      this.beginDrag( event );
    }, false );
  }

  /**
   * Callback to execute when drag starts, return value determines whether to continue the drag.
   */
  public beginning: ( event: any ) => boolean = () => {
    return false;
  }

  /**
   * Callback to execute during the drag
   */
  public continuing: () => void = () => {};

  /**
   * Callback to execute when the drag has ended
   */
  public ending: () => void = () => {};

  /**
   * Callback to execute when mouse was released without a position change
   */
  public clicked: () => void = () => {};

  /**
   * Begin executing the drag
   * @param startEvent The start event for the drag
   */
  private beginDrag( startEvent: any ): void {
    startEvent.preventDefault();
    startEvent.stopPropagation();

    let dragged = false;

    this._start.setFromEvent( startEvent );

    if ( this.beginning( startEvent ) ) {

      const cancelSelect = ( selectEvent: any ): void => {
        selectEvent.preventDefault();
        selectEvent.stopPropagation();
      };

      const continueDrag = ( moveEvent: any ): void => {
        moveEvent.preventDefault();
        moveEvent.stopPropagation();

        dragged = true;

        this._temp.setFromEvent( moveEvent );
        this._delta.copy( this._temp ).sub( this._start );
        this.continuing();
      };

      const throttledContinue = Schedule.deferringThrottle( continueDrag, 40, this );

      const endDrag = ( endEvent: any ): void => {
        endEvent.preventDefault();
        endEvent.stopPropagation();

        this._temp.setFromEvent( endEvent );
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
  }
}
