import { WorkerPoolTask } from '../types';

class WorkerPool {
  private maxWorkers: number;
  private activeWorkers: Set<Worker>;
  private taskQueue: WorkerPoolTask[];
  private workerScript: string;

  constructor(maxWorkers = navigator.hardwareConcurrency || 4) {
    this.maxWorkers = maxWorkers;
    this.activeWorkers = new Set();
    this.taskQueue = [];
    this.workerScript = '/pdf-worker/pdf.worker.min.js';
  }

  private createWorker(): Worker {
    const worker = new Worker(this.workerScript);
    this.activeWorkers.add(worker);
    
    worker.onmessage = (e) => {
      const { type, payload, error } = e.data;
      
      if (error) {
        console.error('Worker error:', error);
      }
      
      // Handle worker completion
      this.activeWorkers.delete(worker);
      worker.terminate();
      
      // Process next task if available
      this.processNextTask();
    };
    
    return worker;
  }

  private processNextTask() {
    if (this.taskQueue.length === 0) return;
    
    if (this.activeWorkers.size >= this.maxWorkers) return;
    
    const task = this.taskQueue.shift();
    if (!task) return;
    
    const worker = this.createWorker();
    worker.postMessage({
      type: task.type,
      payload: task.payload
    });
  }

  public scheduleTask(task: WorkerPoolTask) {
    // Add task to queue
    this.taskQueue.push(task);
    
    // Sort queue by priority
    this.taskQueue.sort((a, b) => b.priority - a.priority);
    
    // Try to process immediately if possible
    this.processNextTask();
  }

  public clearTasks(predicate?: (task: WorkerPoolTask) => boolean) {
    if (predicate) {
      this.taskQueue = this.taskQueue.filter(task => !predicate(task));
    } else {
      this.taskQueue = [];
    }
  }

  public terminateAll() {
    this.activeWorkers.forEach(worker => worker.terminate());
    this.activeWorkers.clear();
    this.taskQueue = [];
  }
}

// Create singleton instance
const workerPool = new WorkerPool();

export default workerPool; 