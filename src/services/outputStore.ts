import type { GeneratedOutput } from '@/types';

type Listener = (outputs: GeneratedOutput[]) => void;

/**
 * Phase-1 client store for generated outputs. In Phase 2 this is replaced by
 * outputService backed by the FastAPI API — components keep the same interface.
 */
class OutputStore {
  private outputs: GeneratedOutput[] = [];
  private listeners = new Set<Listener>();

  set(outputs: GeneratedOutput[]) {
    this.outputs = outputs;
    this.listeners.forEach((l) => l(this.outputs));
  }

  get(): GeneratedOutput[] {
    return this.outputs;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.outputs);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const MockOutputStore = new OutputStore();
