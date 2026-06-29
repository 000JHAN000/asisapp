import re

with open('temp_tenant_caldas_schema.sql', 'r', encoding='utf-16') as f:
    sql = f.read()

# Quitar líneas de comentarios, SET, CREATE EXTENSION, \restrict y vacías
lines = []
for line in sql.splitlines():
    stripped = line.strip()
    if not stripped:
        continue
    if stripped.startswith('--'):
        continue
    if stripped.startswith('SET '):
        continue
    if stripped.startswith('SELECT pg_catalog'):
        continue
    if stripped.startswith('CREATE EXTENSION'):
        continue
    if stripped.startswith('\\restrict'):
        continue
    lines.append(line)

filtered = '\n'.join(lines)

# Dividir en sentencias por ; seguido de newline (ignorar ; dentro de cadenas? no debería haber)
statements = []
for raw in filtered.split('\n\n'):
    raw = raw.strip()
    if not raw:
        continue
    # A veces pg_dump separa sentencias con doble newline sin ; al final? Verificamos
    # Unimos y spliteamos por ;
    pass

# Mejor split por ;\n
parts = re.split(r';\s*\n', filtered)
statements = []
for part in parts:
    part = part.strip()
    if not part:
        continue
    # Quitar comentarios inline?
    part = re.sub(r'\s*--[^\n]*', '', part)
    if not part:
        continue
    lower = part.lower()
    if 'migrations' in lower:
        continue
    if lower.startswith('\\unrestrict'):
        continue
    statements.append(part + ';')

print(f'Sentencias: {len(statements)}')

# Extraer nombres de tablas y tipos para down
tables = re.findall(r'CREATE TABLE (?:public\.)?"?([a-z_][a-z0-9_]*)"?', sql, re.IGNORECASE)
types = re.findall(r'CREATE TYPE (?:public\.)?"?([a-z_][a-z0-9_]*)"?', sql, re.IGNORECASE)

statements_js = ',\n    '.join(repr(s) for s in statements)

down_statements = []
for t in tables:
    down_statements.append(f'DROP TABLE IF EXISTS "{t}" CASCADE;')
for t in types:
    down_statements.append(f'DROP TYPE IF EXISTS "{t}" CASCADE;')
down_js = ',\n    '.join(repr(s) for s in down_statements)

content = f'''import {{ MigrationInterface, QueryRunner }} from "typeorm";

export class InitTenantSchema implements MigrationInterface {{
    name = 'InitTenantSchema'

    public async up(queryRunner: QueryRunner): Promise<void> {{
        const statements = [
    {statements_js}
        ];
        for (const stmt of statements) {{
            await queryRunner.query(stmt);
        }}
    }}

    public async down(queryRunner: QueryRunner): Promise<void> {{
        const statements = [
    {down_js}
        ];
        for (const stmt of statements) {{
            await queryRunner.query(stmt);
        }}
    }}
}}
'''

output_path = 'Asistencia-Backend/src/migrations/tenant/InitTenantSchema.ts'
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f'Migración generada en {output_path}')
