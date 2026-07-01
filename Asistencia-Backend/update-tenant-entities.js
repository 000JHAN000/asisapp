const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const connectionManagerPath = path.join(srcDir, 'infrastructure', 'persistence', 'tenants', 'tenant-connection.manager.ts');

function findEntities(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findEntities(filePath, fileList);
    } else if (file.endsWith('.orm-entity.ts') && !file.includes('-cg.orm-entity.ts') && !file.includes('usuario-cg')) {
      fileList.push(filePath);
    } else if (file.endsWith('.tenant-entity.ts')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const entityFiles = findEntities(srcDir);
const imports = [];
const entities = [];

for (const file of entityFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const match = content.match(/export class ([a-zA-Z0-9_]+)/);
  if (match) {
    const className = match[1];
    let relPath = path.relative(path.dirname(connectionManagerPath), file).replace(/\\/g, '/').replace('.ts', '');
    if (!relPath.startsWith('.')) relPath = './' + relPath;
    imports.push(`import { ${className} } from '${relPath}';`);
    entities.push(className);
  }
}

let managerContent = fs.readFileSync(connectionManagerPath, 'utf8');
const importsEndIndex = managerContent.indexOf('export interface TenantRecord');
const prefix = managerContent.substring(0, managerContent.indexOf('import { Ficha }'));

const entitiesStr = `export const TENANT_BUSINESS_ENTITIES = [\n  ${entities.join(',\n  ')}\n];\n`;

let newContent = managerContent.substring(0, managerContent.indexOf('import { Ficha }')) + 
                   imports.join('\n') + '\n\n' + 
                   managerContent.substring(managerContent.indexOf('export interface TenantRecord'), managerContent.indexOf('export const TENANT_BUSINESS_ENTITIES')) +
                   entitiesStr + '\n' +
                   managerContent.substring(managerContent.indexOf('@Injectable()'));

newContent = newContent.replace('logging: process.env.NODE_ENV === \'development\',', 'logging: process.env.NODE_ENV === \'development\',\n      synchronize: true,');

fs.writeFileSync(connectionManagerPath, newContent);
console.log('Done!');
