/**
 * Worker registration entry point
 * Registers all background job handlers with PG Boss
 */
import { registerRolloverWorkers } from './rollover/index.js';
import { registerEmailWorkers } from './email/index.js';
import { setWorkerRegistrationFn } from '../lib/pgboss.js';

/**
 * Register all workers
 * Call this during server startup
 */
export async function registerAllWorkers(): Promise<void> {
  console.log('[Workers] Registering all workers...');
  
  // Set the registration function for automatic recovery
  setWorkerRegistrationFn(registerAllWorkers);
  
  await registerRolloverWorkers();
  await registerEmailWorkers();
  
  console.log('[Workers] All workers registered');
}

export { registerRolloverWorkers };
export { registerEmailWorkers };
