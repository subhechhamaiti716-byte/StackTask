import { HistoryManager } from './history.js';
import * as db from '../storage/db.js';

class Store {
  constructor() {
    this.state = {
      tasks: [],
      searchQuery: '',
      theme: localStorage.getItem('theme') || 'light'
    };
    this.listeners = [];
    this.history = new HistoryManager(this);
    this.userId = null;
  }

  /** View Subscriptions */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    // Only pass shallow copy to protect state mutability outside dispatch
    this.listeners.forEach(listener => listener({ ...this.state }));
  }

  async init(userId) {
    try {
      this.userId = userId;
      // Wipe History to prevent undoing another user's state from previous login session
      this.history.undoStack = [];
      this.history.redoStack = [];
      this.history.notify();

      const tasks = await db.getAllTasks(userId);
      this.state.tasks = tasks || [];
      this.notify();
    } catch (e) {
      console.error("Failed to initialize store from DB", e);
    }
  }

  /**
   * Main Dispatcher
   * @param {string} actionType - 'ADD_TASK', 'DELETE_TASK', 'UPDATE_TASK', 'SET_SEARCH', 'TOGGLE_THEME'
   * @param {any} payload - The state to mutate
   * @param {boolean} isHistoryAction - Prevents feedback loop when executing un/redos
   */
  async dispatch(actionType, payload, isHistoryAction = false) {
    const { tasks } = this.state;
    let oldTask, newTask;

    switch (actionType) {
      case 'ADD_TASK':
        payload.userId = this.userId; // Enforce user tenancy
        await db.saveTask(payload);
        this.state.tasks = [...tasks, payload];
        
        if (!isHistoryAction) {
          this.history.push({
            undoType: 'DELETE_TASK',
            undoPayload: payload.id,
            redoType: 'ADD_TASK',
            redoPayload: payload
          });
        }
        break;

      case 'DELETE_TASK':
        oldTask = tasks.find(t => t.id === payload);
        if (!oldTask) break; // safeguard
        
        await db.deleteTask(payload);
        this.state.tasks = tasks.filter(t => t.id !== payload);
        
        if (!isHistoryAction) {
          this.history.push({
            undoType: 'ADD_TASK',
            undoPayload: oldTask,
            redoType: 'DELETE_TASK',
            redoPayload: payload
          });
        }
        break;

      case 'UPDATE_TASK':
        // Payload comes in as full or partial object (needs id minimum)
        oldTask = tasks.find(t => t.id === payload.id);
        if (!oldTask) break;
        
        newTask = { ...oldTask, ...payload };
        await db.saveTask(newTask);
        this.state.tasks = tasks.map(t => t.id === payload.id ? newTask : t);
        
        if (!isHistoryAction) {
          this.history.push({
            undoType: 'UPDATE_TASK',
            undoPayload: oldTask,
            redoType: 'UPDATE_TASK',
            redoPayload: newTask
          });
        }
        break;
        
      case 'SET_SEARCH':
        this.state.searchQuery = payload.toLowerCase();
        break;
        
      case 'TOGGLE_THEME':
        this.state.theme = this.state.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.state.theme);
        break;
    }
    
    this.notify();
  }
}

export const store = new Store();
