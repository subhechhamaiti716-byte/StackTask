import { store } from '../state/store.js';

export function initializeDragDrop(boardElement) {
  let draggedCard = null;
  let sourceColumnId = null;

  boardElement.addEventListener('dragstart', (e) => {
    if (!e.target.classList.contains('task-card')) return;
    draggedCard = e.target;
    sourceColumnId = draggedCard.closest('.kanban-column').dataset.status;
    
    setTimeout(() => {
      draggedCard.classList.add('dragging');
      draggedCard.classList.add('ghost');
    }, 0);
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedCard.dataset.id);
  });

  boardElement.addEventListener('dragend', (e) => {
    if (!e.target.classList.contains('task-card')) return;
    e.target.classList.remove('dragging');
    e.target.classList.remove('ghost');
    draggedCard = null;
    
    document.querySelectorAll('.column-content').forEach(col => {
      col.classList.remove('drag-over');
    });
  });

  boardElement.addEventListener('dragover', (e) => {
    e.preventDefault(); 
    const columnContent = e.target.closest('.column-content');
    if (!columnContent) return;
    
    document.querySelectorAll('.column-content').forEach(col => {
      if(col !== columnContent) col.classList.remove('drag-over');
    });
    columnContent.classList.add('drag-over');
    
    // Native sort feedback
    const afterElement = getDragAfterElement(columnContent, e.clientY);
    if (draggedCard) {
      if (afterElement == null) {
        columnContent.appendChild(draggedCard);
      } else {
        columnContent.insertBefore(draggedCard, afterElement);
      }
    }
  });

  boardElement.addEventListener('drop', (e) => {
    e.preventDefault();
    const columnContent = e.target.closest('.column-content');
    if (!columnContent) return;
    
    columnContent.classList.remove('drag-over');
    const taskId = e.dataTransfer.getData('text/plain');
    const targetColumn = columnContent.closest('.kanban-column');
    const newStatus = targetColumn.dataset.status;

    // Only update state if moved to a different column
    if (taskId && sourceColumnId !== newStatus) {
      store.dispatch('UPDATE_TASK', { id: taskId, status: newStatus });
    }
  });

  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }
}
