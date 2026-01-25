import { store } from '../state/store.js';
import { initializeDragDrop } from '../utils/dragDrop.js';
import { escapeHTML, debounce } from '../utils/helpers.js';

export function initializeBoard() {
  const boardEl = document.querySelector('.kanban-board');
  const searchInput = document.getElementById('searchInput');
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');

  // 1. Hook up Drag and Drop
  initializeDragDrop(boardEl);

  // 2. Subscribe to Global State Changes
  store.subscribe((state) => {
    renderBoard(state);
  });

  // 3. Hook up History / Undo-Redo
  window.addEventListener('history-changed', (e) => {
    undoBtn.disabled = !e.detail.canUndo;
    redoBtn.disabled = !e.detail.canRedo;
  });

  undoBtn.addEventListener('click', () => store.history.undo());
  redoBtn.addEventListener('click', () => store.history.redo());

  // 4. Hook up Search via debounce
  searchInput.addEventListener('input', debounce((e) => {
    store.dispatch('SET_SEARCH', e.target.value);
  }, 250));

  // 5. Global Event Delegation for Cards (Edit/Delete)
  boardEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    
    const card = btn.closest('.task-card');
    if (!card) return;
    
    const taskId = card.dataset.id;
    
    if (btn.classList.contains('edit-btn')) {
      const task = store.state.tasks.find(t => t.id === taskId);
      if (task && window.StackTask?.openEditModal) {
        window.StackTask.openEditModal(task);
      }
    } else if (btn.classList.contains('delete-btn')) {
      if(confirm('Delete this task permenantly?')) {
        store.dispatch('DELETE_TASK', taskId);
      }
    }
  });
}

function renderBoard(state) {
  const { tasks, searchQuery } = state;
  let filteredTasks = tasks;
  
  if (searchQuery) {
    filteredTasks = tasks.filter(t => 
      t.title.toLowerCase().includes(searchQuery) || 
      (t.description && t.description.toLowerCase().includes(searchQuery))
    );
  }

  // Group tasks purely in memory
  const columns = { 'todo': [], 'in-progress': [], 'done': [] };

  filteredTasks.forEach(task => {
    if (columns[task.status]) columns[task.status].push(task);
  });

  // Fast DOM mapping per column
  Object.keys(columns).forEach(status => {
    const colContent = document.getElementById(`col-${status}`);
    const colCount = document.getElementById(`count-${status}`);
    
    if (colContent && colCount) {
      colCount.textContent = columns[status].length;
      
      if (columns[status].length === 0) {
        colContent.innerHTML = `<div class="empty-state">No tasks here</div>`;
      } else {
        colContent.innerHTML = columns[status].map(task => createTaskHTML(task)).join('');
      }
    }
  });
}

function createTaskHTML(task) {
  const editIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
  const deleteIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue = task.deadline && new Date(task.deadline) < today && task.status !== 'done';
  const deadlineHtml = task.deadline ? `<span class="task-deadline ${isOverdue ? 'overdue' : ''}">🕒 ${new Date(task.deadline).toLocaleDateString()}</span>` : '';

  return `
    <article class="task-card" draggable="true" data-id="${task.id}" tabindex="0">
      <h3 class="task-title">${escapeHTML(task.title)}</h3>
      ${task.description ? `<p class="task-desc">${escapeHTML(task.description)}</p>` : ''}
      <div class="task-footer">
        <div class="task-meta">
          <span class="task-priority prio-${task.priority}">${task.priority}</span>
          ${deadlineHtml}
        </div>
        <div class="task-actions">
          <button class="btn-icon edit-btn" aria-label="Edit task">${editIcon}</button>
          <button class="btn-icon delete-btn" aria-label="Delete task">${deleteIcon}</button>
        </div>
      </div>
    </article>
  `;
}
