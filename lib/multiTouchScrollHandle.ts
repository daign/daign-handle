import { Vector2 } from '@daign/math';

import { MultiTouchHandle } from './multiTouchHandle';
import { HandleConfig } from './handleConfig';

/**
 * Class to handle multi touch drag and scroll actions on DOM elements.
 */
export class MultiTouchScrollHandle extends MultiTouchHandle {
  // Delta values of scroll event.
  private _scroll: Vector2 = new Vector2();

  // Delta mode of scroll event.
  private _scrollMode: number = 0;

  // Mouse position of the scroll event.
  private _scrollPosition: Vector2 = new Vector2();

  /**
   * Get the scroll value.
   */
  public get scroll(): Vector2 {
    return this._scroll;
  }

  /**
   * Get the scroll mode value.
   */
  public get scrollMode(): number {
    return this._scrollMode;
  }

  /**
   * Get the mouse position of the scroll event.
   */
  public get scrollPosition(): Vector2 {
    return this._scrollPosition;
  }

  /**
   * Constructor.
   * @param config - The handle config for setting up the handle.
   */
  public constructor( config: HandleConfig ) {
    super( config );

    this.node.addEventListener( 'wheel', this.beginScroll, false );
  }

  /**
   * Remove event listeners from node and remove reference to node.
   */
  public destroy(): void {
    if ( this.node ) {
      this.node.removeEventListener( 'wheel', this.beginScroll, false );
    }
    super.destroy();
  }

  /**
   * Callback to execute on scroll events.
   */
  public scrolling: () => void = () => {};

  /**
   * Function that begins executing the scroll.
   * This is a function assigned to an object property, not an object method, because when object
   * methods are called from event listeners their this-context is not set to the object.
   */
  private beginScroll: ( event: any ) => boolean = ( scrollEvent: any ): boolean => {
    // Cancel action when the handle is disabled.
    if ( !this.enabled ) {
      return true;
    }

    scrollEvent.preventDefault();
    scrollEvent.stopPropagation();

    this._scroll.setFromScrollEvent( scrollEvent );
    this._scrollMode = scrollEvent.deltaMode;
    // Mouse position is extracted with an exchangeable function.
    this._scrollPosition.copy( this.extractFromEvent( scrollEvent ) );

    this.scrolling();

    // Some browsers require to return false to prevent the default scroll action.
    return false;
  };
}