import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function globalSetup() {
  console.log('Building Electron app for tests...');
  
  try {
    // Build the Electron app
    await execAsync('npm run build-electron');
    console.log('Electron app build completed successfully');
  } catch (error) {
    console.error('Failed to build Electron app:', error);
    throw error;
  }
}

export default globalSetup;