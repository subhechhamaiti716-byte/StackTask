import Chart from 'chart.js/auto';
import { store } from '../state/store.js';

let statusChartInstance;
let priorityChartInstance;
let overTimeChartInstance;

export function initializeAnalytics() {
  const ctxStatus = document.getElementById('statusChart');
  const ctxPriority = document.getElementById('priorityChart');
  const ctxOverTime = document.getElementById('completionOverTimeChart');

  if (!ctxStatus || !ctxPriority || !ctxOverTime) return;

  // Chart setup: defaults to ensure text plays nicely with dark theme if needed
  Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#6b7280';
  Chart.defaults.font.family = "'Inter', sans-serif";

  statusChartInstance = new Chart(ctxStatus, {
    type: 'doughnut',
    data: {
      labels: ['To Do', 'In Progress', 'Done'],
      datasets: [{
        data: [0, 0, 0],
        backgroundColor: ['#6366F1', '#F59E0B', '#10B981'],
        borderWidth: 0,
        cutout: '60%'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });

  priorityChartInstance = new Chart(ctxPriority, {
    type: 'bar',
    data: {
      labels: ['Low', 'Medium', 'High'],
      datasets: [{
        label: 'Tasks',
        data: [0, 0, 0],
        backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
        borderWidth: 0,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { 
          beginAtZero: true, 
          ticks: { stepSize: 1 },
          grid: { color: 'rgba(0,0,0,0.05)' }
        },
        x: {
          grid: { display: false }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });

  overTimeChartInstance = new Chart(ctxOverTime, {
    type: 'line',
    data: {
      labels: [new Date().toLocaleDateString(undefined, {month: 'numeric', day: 'numeric', year: 'numeric'})],
      datasets: [{
        label: 'Done Tasks',
        data: [0],
        borderColor: '#6366F1',
        tension: 0.1,
        pointBackgroundColor: '#6366F1',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { 
          beginAtZero: true, 
          ticks: { stepSize: 1 },
          grid: { color: 'rgba(0,0,0,0.05)' }
        },
        x: {
          grid: { display: false }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });

  store.subscribe(updateAnalytics);
  
  // Need to force an initial update since tasks might have loaded before this
  updateAnalytics(store.state);
}

function updateAnalytics(state) {
  if (!statusChartInstance) return;

  const tasks = state.tasks;
  
  // Update KPI cards
  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'done').length;
  const completion = total === 0 ? 0 : Math.round((done / total) * 100);
  const overdue = tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'done').length;
  
  document.getElementById('kpi-total').textContent = total;
  document.getElementById('kpi-done').textContent = done;
  document.getElementById('kpi-completion').textContent = `${completion}%`;
  document.getElementById('kpi-overdue').textContent = overdue;

  // 1. Task By Status Map
  const todoCount = tasks.filter(t => t.status === 'todo').length;
  const ipCount = tasks.filter(t => t.status === 'in-progress').length;
  statusChartInstance.data.datasets[0].data = [todoCount, ipCount, done];
  statusChartInstance.update();

  // 2. Task By Priority Map
  const lowCount = tasks.filter(t => t.priority === 'low').length;
  const midCount = tasks.filter(t => t.priority === 'medium').length;
  const highCount = tasks.filter(t => t.priority === 'high').length;
  priorityChartInstance.data.datasets[0].data = [lowCount, midCount, highCount];
  priorityChartInstance.update();

  // 3. Completion Over Time Map (mocked to point-in-time)
  overTimeChartInstance.data.datasets[0].data = [done];
  overTimeChartInstance.update();
}
