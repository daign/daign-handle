/**
 * Function to determine whether the current browser supports the passive property in the event
 * listener options.
 * @returns The result of the check.
 */
export const isPassiveSupported = (): boolean => {
  let supported = false;

  try {
    const options: AddEventListenerOptions = {
      // This function will be called when the browser attempts to access the passive property.
      get passive(): boolean {
        supported = true;
        return false;
      }
    };

    const callback = (): void => {};

    window.addEventListener( 'click', callback, options );
    window.removeEventListener( 'click', callback, false );
  } catch {
    supported = false;
  }

  return supported;
};
