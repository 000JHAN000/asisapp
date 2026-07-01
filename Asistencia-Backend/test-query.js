const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5440, user: 'postgres', password: 'alejo.v02', database: 'tenant_palmira' });
async function run() {
  try {
    const inst = await pool.query("SELECT * FROM cg_instructores WHERE id = '7fd2e283-5a49-464a-9450-12fdf31698cf'");
    console.log('cg_instructores:', inst.rows);
    const newInst = await pool.query("SELECT * FROM instructor_orm_entity WHERE id_instructor = '7fd2e283-5a49-464a-9450-12fdf31698cf'");
    console.log('instructor_orm_entity:', newInst.rows);
  } finally {
    pool.end();
  }
}
run();
