/**
 * Worker registration entry point
 * Registers all background job handlers with PG Boss
 */
import { registerRolloverWorkers } from './rollover.js';

/**
 * Register all workers
 * Call this during server startup
 */
export async function registerAllWorkers(): Promise<void> {
  console.log('[Workers] Registering all workers...');
  
  await registerRolloverWorkers();
  
  console.log('[Workers] All workers registered');
}

export { registerRolloverWorkers };
