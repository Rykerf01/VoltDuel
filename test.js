import { execSync } from 'child_process';
try {
  execSync('NODE_ENV=production node --experimental-strip-types server.ts & sleep 2; kill $!', { stdio: 'inherit' });
} catch (e) {
  console.error(e);
}
