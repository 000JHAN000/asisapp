console.log('cwd:', process.cwd());
console.log('antes de require ts-node');
try {
  require('ts-node/register');
  console.log('ts-node ok');
  require('tsconfig-paths/register');
  console.log('tsconfig-paths ok');
  console.log('antes de require main');
  require('./src/main.ts');
  console.log('main required');
} catch (e) {
  console.error('ERROR:', e.message, e.stack);
  process.exit(1);
}
