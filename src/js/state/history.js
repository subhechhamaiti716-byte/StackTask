export class HistoryManager {
  constructor(store) {
    this.store = store; // reference to main store
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Action format: { undoType, undoPayload, redoType, redoPayload }
   */
  push(action) {
    this.undoStack.push(action);
    this.redoStack = []; // Clear redo strictly on any new historical branch
    this.notify();
  }

  undo() {
    if (this.undoStack.length === 0) return;
    const action = this.undoStack.pop();
    this.redoStack.push(action);
    
    // Execute reverse action bypassing history
    this.store.dispatch(action.undoType, action.undoPayload, true);
    this.notify();
  }

  redo() {
    if (this.redoStack.length === 0) return;
    const action = this.redoStack.pop();
    this.undoStack.push(action);
    
    // Execute forward action bypassing history
    this.store.dispatch(action.redoType, action.redoPayload, true);
    this.notify();
  }

  canUndo() { return this.undoStack.length > 0; }
  canRedo() { return this.redoStack.length > 0; }

  notify() {
    // Standard DOM Event for decoupled UI listener
    window.dispatchEvent(new CustomEvent('history-changed', {
      detail: { canUndo: this.canUndo(), canRedo: this.canRedo() }
    }));
  }
}
