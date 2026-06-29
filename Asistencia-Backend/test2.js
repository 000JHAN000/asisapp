console.log('antes import AppModule');
try {
  const { AppModule } = require('./src/app.module');
  console.log('AppModule importado');
} catch (e) {
  console.error('ERROR:', e.message, e.stack);
  process.exit(1);
}
