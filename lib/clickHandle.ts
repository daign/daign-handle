import { Vector2 } from '@daign/math';

import { HandleConfig } from './handleConfig';

/**
 * Class to handle click actions on DOM elements.
 * This is a simple version of the handle class only for click events.
 */
export class ClickHandle {
  // The DOM node on which the event listener will be registered.
  protected node: any;

  // The function that is used to extract the coordinates from mouse events for the click position.
  protected extractFromEvent: ( event: any ) => Vector2;

  /* The function that extracts the coordinates from mouse events relative to the application's
   * viewport. */
  private absoluteExtractFromEvent: ( event: any ) => Vector2 = ( event: any ): Vector2 => {
    return new Vector2().setFromEvent( event );
  };

  // Position of the click event.
  private _position: Vector2 | undefined;

  // Variable to temporarily disable the handle.
  public enabled: boolean = true;

  /**
   * Get the position of the click event.
   */
  public get position(): Vector2 | undefined {
    return this._position;
  }

  /**
   * Constructor.
   * @param config - The handle config for setting up the handle.
   */
  public constructor( config: HandleConfig ) {
    this.node = config.startNode;

    if ( config.extractFromEvent ) {
      // Use a custom supplied extract function for the start position.
      this.extractFromEvent = config.extractFromEvent;
    } else {
      // Use the default extract function.
      this.extractFromEvent = this.absoluteExtractFromEvent;
    }

    this.node.addEventListener( 'click', this.beginClick, false );
  }

  /**
   * Remove event listener from node and remove reference to node.
   */
  public destroy(): void {
    if ( this.node ) {
      this.node.removeEventListener( 'click', this.beginClick, false );
      this.node = null;
    }
  }

  /**
   * Callback to execute on a click event.
   */
  public clicked: ( event: any ) => void = () => {};

  /**
   * Function that evaluates the click event.
   * This is a function assigned to an object property, not an object method, because when object
   * methods are called from event listeners their this-context is not set to the object.
   */
  private beginClick: ( event: any ) => void = ( event: any ): void => {
    // Cancel action when the handle is disabled.
    if ( !this.enabled ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    // Clear values from previous click.
    this._position = undefined;

    try {
      const position = this.extractFromEvent( event );
      this._position = position;
    } catch {}

    // Execute the custom callback for click event action.
    this.clicked( event );
  };
}
