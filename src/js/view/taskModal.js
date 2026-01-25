import { store } from '../state/store.js';
import { generateUUID } from '../utils/helpers.js';

export function initializeModal() {
  const modal = document.getElementById('taskModal');
  const addTaskBtn = document.getElementById('addTaskBtn');
  const closeBtns = document.querySelectorAll('.close-modal, .cancel-modal');
  const taskForm = document.getElementById('taskForm');
  const modalTitle = document.getElementById('modalTitle');

  const openModal = (task = null) => {
    modalTitle.textContent = task ? 'Edit Task' : 'New Task';
    
    if (task) {
      document.getElementById('taskId').value = task.id;
      document.getElementById('taskTitle').value = task.title;
      document.getElementById('taskDesc').value = task.description || '';
      document.getElementById('taskStatus').value = task.status;
      document.getElementById('taskPriority').value = task.priority;
      document.getElementById('taskDeadline').value = task.deadline || '';
    } else {
      taskForm.reset();
      document.getElementById('taskId').value = '';
    }
    
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    // timeout ensures the transition starts before focusing
    setTimeout(() => document.getElementById('taskTitle').focus(), 100);
  };

  const closeModal = () => {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    setTimeout(() => taskForm.reset(), 300);
  };

  addTaskBtn.addEventListener('click', () => openModal(null));
  
  closeBtns.forEach(btn => {
    btn.addEventListener('click', closeModal);
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = document.getElementById('taskId').value;
    const task = {
      title: document.getElementById('taskTitle').value.trim(),
      description: document.getElementById('taskDesc').value.trim(),
      status: document.getElementById('taskStatus').value,
      priority: document.getElementById('taskPriority').value,
      deadline: document.getElementById('taskDeadline').value || null,
      updatedAt: Date.now()
    };

    if (id) {
      task.id = id;
      store.dispatch('UPDATE_TASK', task);
    } else {
      task.id = generateUUID();
      task.createdAt = Date.now();
      store.dispatch('ADD_TASK', task);
    }

    closeModal();
  });
  
  // Expose for Global Delegate click handling from board
  window.StackTask = window.StackTask || {};
  window.StackTask.openEditModal = openModal;
}
