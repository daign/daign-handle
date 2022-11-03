import { Vector2 } from '@daign/math';

/**
 * Definition of handle config objects.
 */
export interface HandleConfig {
  // The DOM node on which the start event listeners will be registered.
  startNode: any;

  // Distance in pixels below which a drag is still considered a click. Optional.
  minimumDragDistance?: number;

  // The function that is used to extract coordinates from mouse events. Optional.
  // tslint:disable-next-line:prefer-method-signature
  extractFromEvent?: ( event: any ) => Vector2;

  // The function that is used to extract coordinates from multi touch events. Optional.
  // tslint:disable-next-line:prefer-method-signature
  extractFromTouchEvent?: ( event: any, touchIndex: number ) => Vector2;

  // Waiting time in milliseconds between throttled move events. 40ms = 25fps. Optional.
  throttleInterval?: number;
}
