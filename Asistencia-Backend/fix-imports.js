const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const renames = {
  'Evento': 'EventoOrmEntity',
  'SolicitudCambio': 'SolicitudCambioOrmEntity',
  'Notificacion': 'NotificacionOrmEntity',
  'ConfiguracionApp': 'ConfiguracionAppOrmEntity',
  'Competencia': 'CompetenciaOrmEntity',
  'Ubicacion': 'UbicacionOrmEntity'
};

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      processDir(filePath);
    } else if (filePath.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let changed = false;
      for (const [oldName, newName] of Object.entries(renames)) {
        const regex = new RegExp(`\\b${oldName}\\b`, 'g');
        if (regex.test(content) && !filePath.includes('.orm-entity.ts')) {
          content = content.replace(regex, newName);
          changed = true;
        }
      }
      // Also fix HorarioTypeOrmRepository type error
      if (filePath.endsWith('horario.typeorm.repository.ts')) {
        content = content.replace(/nuevo\.fecha = undefined/g, '');
        content = content.replace(/encontrado\.fecha = undefined/g, '');
        changed = true;
      }
      
      if (changed) {
        fs.writeFileSync(filePath, content);
      }
    }
  }
}

processDir(path.join(__dirname, 'src'));
console.log('Fixed imports!');
