export interface View {
  displayErrorMessage: (message: string) => void;
}

export interface MessageView extends View {
  displayInfoMessage: (message: string, duration: number) => void;
  clearLastInfoMessage: () => void;
  clearUserInfo: () => void;
}

export interface StatusMessageView extends View {
  displayInfoMessage: (message: string, duration: number) => void;
  clearLastInfoMessage: () => void;
}

export class Presenter<V extends View> {
  private _view: V;

  protected constructor(view: V) {
    this._view = view;
  }

  protected get view(): V {
    return this._view;
  }

  public async doFailureReportingOperation(
    operation: () => Promise<void>,
    operationDescription: string
  ): Promise<void> {
    console.log(`Starting operation: ${operationDescription}`);

    try {
      // Execute the operation
      await operation();
      console.log(`Operation '${operationDescription}' completed successfully`);
    } catch (error) {
      // Log the error and display it through the view
      console.error(
        `Operation '${operationDescription}' failed due to:`,
        error instanceof Error ? error.message : error
      );

      // Inform the user about the failure
      this.view.displayErrorMessage(
        `Failed to ${operationDescription} because of exception: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
