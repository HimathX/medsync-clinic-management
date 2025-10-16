import os
import subprocess
import logging
from datetime import datetime
from pathlib import Path
import mysql.connector
from core.database import DB_CONFIG

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database/exports directory
BASE_DIR = Path(__file__).parent.parent
EXPORT_DIR = BASE_DIR / "database" / "exports"
EXPORT_DIR.mkdir(parents=True, exist_ok=True)


def export_using_mysqldump():
    """
    Export database using mysqldump utility (recommended method)
    Exports DDL, DML, procedures, functions, triggers, views separately
    """
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # File paths
        schema_file = EXPORT_DIR / f"schema_ddl_{timestamp}.sql"
        data_file = EXPORT_DIR / f"data_dml_{timestamp}.sql"
        procedures_file = EXPORT_DIR / f"procedures_{timestamp}.sql"
        functions_file = EXPORT_DIR / f"functions_{timestamp}.sql"
        triggers_file = EXPORT_DIR / f"triggers_{timestamp}.sql"
        views_file = EXPORT_DIR / f"views_{timestamp}.sql"
        complete_file = EXPORT_DIR / f"complete_backup_{timestamp}.sql"
        
        host = DB_CONFIG['host']
        port = DB_CONFIG['port']
        user = DB_CONFIG['user']
        password = DB_CONFIG['password']
        database = DB_CONFIG['database']
        
        # 1. Export Schema (DDL) - Tables only, no routines/triggers
        logger.info("[1/7] Exporting Schema (DDL - Tables only)...")
        schema_command = [
            'mysqldump',
            f'--host={host}',
            f'--port={port}',
            f'--user={user}',
            f'--password={password}',
            '--no-data',
            '--skip-routines',
            '--skip-triggers',
            '--skip-events',
            '--single-transaction',
            '--result-file=' + str(schema_file),
            database
        ]
        subprocess.run(schema_command, check=True, capture_output=True, text=True)
        logger.info(f"✅ Schema exported to: {schema_file.name}")
        
        # 2. Export Data (DML)
        logger.info("[2/7] Exporting Data (DML)...")
        data_command = [
            'mysqldump',
            f'--host={host}',
            f'--port={port}',
            f'--user={user}',
            f'--password={password}',
            '--no-create-info',
            '--skip-triggers',
            '--single-transaction',
            '--result-file=' + str(data_file),
            database
        ]
        subprocess.run(data_command, check=True, capture_output=True, text=True)
        logger.info(f"✅ Data exported to: {data_file.name}")
        
        # 3. Export Procedures
        logger.info("[3/7] Exporting Stored Procedures...")
        procedures_command = [
            'mysqldump',
            f'--host={host}',
            f'--port={port}',
            f'--user={user}',
            f'--password={password}',
            '--no-create-info',
            '--no-data',
            '--routines',
            '--skip-triggers',
            '--skip-events',
            '--result-file=' + str(procedures_file),
            database
        ]
        subprocess.run(procedures_command, check=True, capture_output=True, text=True)
        
        # Filter only procedures (remove functions)
        with open(procedures_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        with open(procedures_file, 'w', encoding='utf-8') as f:
            f.write(f"-- ============================================\n")
            f.write(f"-- MedSync Stored Procedures Export\n")
            f.write(f"-- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"-- ============================================\n\n")
            f.write(f"USE `{database}`;\n\n")
            
            lines = content.split('\n')
            in_procedure = False
            procedure_lines = []
            
            for line in lines:
                if 'CREATE DEFINER' in line and 'PROCEDURE' in line:
                    in_procedure = True
                    procedure_lines = [line]
                elif in_procedure:
                    procedure_lines.append(line)
                    if line.strip() == '$$':
                        f.write('\n'.join(procedure_lines) + '\n\n')
                        in_procedure = False
                        procedure_lines = []
        
        logger.info(f"✅ Procedures exported to: {procedures_file.name}")
        
        # 4. Export Functions (from Python since mysqldump combines them)
        logger.info("[4/7] Exporting Functions...")
        export_functions_only(functions_file, timestamp)
        logger.info(f"✅ Functions exported to: {functions_file.name}")
        
        # 5. Export Triggers
        logger.info("[5/7] Exporting Triggers...")
        triggers_command = [
            'mysqldump',
            f'--host={host}',
            f'--port={port}',
            f'--user={user}',
            f'--password={password}',
            '--no-create-info',
            '--no-data',
            '--triggers',
            '--skip-routines',
            '--skip-events',
            '--result-file=' + str(triggers_file),
            database
        ]
        subprocess.run(triggers_command, check=True, capture_output=True, text=True)
        
        # Clean up triggers file
        with open(triggers_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        with open(triggers_file, 'w', encoding='utf-8') as f:
            f.write(f"-- ============================================\n")
            f.write(f"-- MedSync Triggers Export\n")
            f.write(f"-- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"-- ============================================\n\n")
            f.write(f"USE `{database}`;\n\n")
            f.write(content)
        
        logger.info(f"✅ Triggers exported to: {triggers_file.name}")
        
        # 6. Export Views
        logger.info("[6/7] Exporting Views...")
        export_views_only(views_file, timestamp)
        logger.info(f"✅ Views exported to: {views_file.name}")
        
        # 7. Create Complete Backup
        logger.info("[7/7] Creating Complete Backup...")
        complete_command = [
            'mysqldump',
            f'--host={host}',
            f'--port={port}',
            f'--user={user}',
            f'--password={password}',
            '--routines',
            '--triggers',
            '--events',
            '--single-transaction',
            '--result-file=' + str(complete_file),
            database
        ]
        subprocess.run(complete_command, check=True, capture_output=True, text=True)
        
        # Add header to complete backup
        with open(complete_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        with open(complete_file, 'w', encoding='utf-8') as f:
            f.write(f"-- ============================================\n")
            f.write(f"-- MedSync Complete Database Backup\n")
            f.write(f"-- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"-- ============================================\n\n")
            f.write(content)
        
        logger.info(f"✅ Complete backup exported to: {complete_file.name}")
        
        return {
            'success': True,
            'files': {
                'schema_ddl': str(schema_file),
                'data_dml': str(data_file),
                'procedures': str(procedures_file),
                'functions': str(functions_file),
                'triggers': str(triggers_file),
                'views': str(views_file),
                'complete_backup': str(complete_file)
            }
        }
        
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ mysqldump error: {e.stderr}")
        logger.info("Falling back to Python-based export...")
        return export_using_python()
    except FileNotFoundError:
        logger.warning("⚠️ mysqldump not found in PATH. Using Python-based export...")
        return export_using_python()
    except Exception as e:
        logger.error(f"❌ Export error: {str(e)}")
        import traceback
        traceback.print_exc()
        return export_using_python()


def export_functions_only(output_file, timestamp):
    """Export only functions using Python"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor(dictionary=True)
        database = DB_CONFIG['database']
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(f"-- ============================================\n")
            f.write(f"-- MedSync Functions Export\n")
            f.write(f"-- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"-- ============================================\n\n")
            f.write(f"USE `{database}`;\n\n")
            f.write("DELIMITER $$\n\n")
            
            cursor.execute("SHOW FUNCTION STATUS WHERE Db = %s", (database,))
            functions = cursor.fetchall()
            
            if functions:
                for func in functions:
                    func_name = func['Name']
                    cursor.execute(f"SHOW CREATE FUNCTION `{func_name}`")
                    result = cursor.fetchone()
                    if result and 'Create Function' in result:
                        create_func = result['Create Function']
                        f.write(f"-- Function: {func_name}\n")
                        f.write(f"DROP FUNCTION IF EXISTS `{func_name}`$$\n\n")
                        f.write(f"{create_func}$$\n\n")
            else:
                f.write("-- No functions found\n\n")
            
            f.write("DELIMITER ;\n")
        
        cursor.close()
        connection.close()
        
    except Exception as e:
        logger.error(f"Error exporting functions: {str(e)}")


def export_views_only(output_file, timestamp):
    """Export only views using Python"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor(dictionary=True)
        database = DB_CONFIG['database']
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(f"-- ============================================\n")
            f.write(f"-- MedSync Views Export\n")
            f.write(f"-- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"-- ============================================\n\n")
            f.write(f"USE `{database}`;\n\n")
            
            cursor.execute("SHOW FULL TABLES WHERE Table_type = 'VIEW'")
            views = cursor.fetchall()
            
            if views:
                for view in views:
                    view_name = list(view.values())[0]
                    cursor.execute(f"SHOW CREATE VIEW `{view_name}`")
                    result = cursor.fetchone()
                    if result and 'Create View' in result:
                        create_view = result['Create View']
                        f.write(f"-- View: {view_name}\n")
                        f.write(f"DROP VIEW IF EXISTS `{view_name}`;\n\n")
                        f.write(f"{create_view};\n\n")
            else:
                f.write("-- No views found\n\n")
        
        cursor.close()
        connection.close()
        
    except Exception as e:
        logger.error(f"Error exporting views: {str(e)}")


def export_using_python():
    """
    Export database using Python mysql.connector
    Fallback method if mysqldump is not available
    """
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        schema_file = EXPORT_DIR / f"schema_ddl_{timestamp}.sql"
        data_file = EXPORT_DIR / f"data_dml_{timestamp}.sql"
        procedures_file = EXPORT_DIR / f"procedures_{timestamp}.sql"
        functions_file = EXPORT_DIR / f"functions_{timestamp}.sql"
        triggers_file = EXPORT_DIR / f"triggers_{timestamp}.sql"
        views_file = EXPORT_DIR / f"views_{timestamp}.sql"
        complete_file = EXPORT_DIR / f"complete_backup_{timestamp}.sql"
        
        logger.info("Connecting to database...")
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor(dictionary=True)
        database = DB_CONFIG['database']
        
        # 1. Export Schema (DDL)
        logger.info("[1/7] Exporting Schema (DDL)...")
        with open(schema_file, 'w', encoding='utf-8') as f:
            f.write(f"-- ============================================\n")
            f.write(f"-- MedSync Schema (DDL) Export\n")
            f.write(f"-- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"-- ============================================\n\n")
            f.write(f"CREATE DATABASE IF NOT EXISTS `{database}`;\n")
            f.write(f"USE `{database}`;\n\n")
            
            cursor.execute("SHOW TABLES")
            tables = [list(row.values())[0] for row in cursor.fetchall()]
            
            for table in tables:
                cursor.execute(f"SHOW CREATE TABLE `{table}`")
                result = cursor.fetchone()
                create_statement = list(result.values())[1]
                f.write(f"-- ============================================\n")
                f.write(f"-- Table: {table}\n")
                f.write(f"-- ============================================\n")
                f.write(f"DROP TABLE IF EXISTS `{table}`;\n\n")
                f.write(f"{create_statement};\n\n")
        
        logger.info(f"✅ Schema exported to: {schema_file.name}")
        
        # 2. Export Data (DML)
        logger.info("[2/7] Exporting Data (DML)...")
        with open(data_file, 'w', encoding='utf-8') as f:
            f.write(f"-- ============================================\n")
            f.write(f"-- MedSync Data (DML) Export\n")
            f.write(f"-- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"-- ============================================\n\n")
            f.write(f"USE `{database}`;\n\n")
            f.write("SET FOREIGN_KEY_CHECKS=0;\n\n")
            
            for table in tables:
                cursor.execute(f"SELECT COUNT(*) as count FROM `{table}`")
                count = cursor.fetchone()['count']
                
                if count > 0:
                    f.write(f"-- ============================================\n")
                    f.write(f"-- Data for table: {table} ({count} rows)\n")
                    f.write(f"-- ============================================\n\n")
                    
                    cursor.execute(f"SELECT * FROM `{table}`")
                    rows = cursor.fetchall()
                    
                    if rows:
                        columns = list(rows[0].keys())
                        column_list = ', '.join([f"`{col}`" for col in columns])
                        
                        batch_size = 100
                        for i in range(0, len(rows), batch_size):
                            batch = rows[i:i+batch_size]
                            f.write(f"INSERT INTO `{table}` ({column_list}) VALUES\n")
                            
                            for idx, row in enumerate(batch):
                                values = []
                                for col in columns:
                                    val = row[col]
                                    if val is None:
                                        values.append('NULL')
                                    elif isinstance(val, (int, float)):
                                        values.append(str(val))
                                    elif isinstance(val, bytes):
                                        values.append(f"X'{val.hex()}'")
                                    else:
                                        escaped = str(val).replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n').replace('\r', '\\r')
                                        values.append(f"'{escaped}'")
                                
                                values_str = '(' + ', '.join(values) + ')'
                                
                                if idx < len(batch) - 1:
                                    f.write(f"  {values_str},\n")
                                else:
                                    f.write(f"  {values_str};\n")
                            
                            f.write("\n")
            
            f.write("SET FOREIGN_KEY_CHECKS=1;\n")
        
        logger.info(f"✅ Data exported to: {data_file.name}")
        
        # 3. Export Procedures
        logger.info("[3/7] Exporting Stored Procedures...")
        with open(procedures_file, 'w', encoding='utf-8') as f:
            f.write(f"-- ============================================\n")
            f.write(f"-- MedSync Stored Procedures Export\n")
            f.write(f"-- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"-- ============================================\n\n")
            f.write(f"USE `{database}`;\n\n")
            f.write("DELIMITER $$\n\n")
            
            cursor.execute("SHOW PROCEDURE STATUS WHERE Db = %s", (database,))
            procedures = cursor.fetchall()
            
            if procedures:
                for proc in procedures:
                    proc_name = proc['Name']
                    cursor.execute(f"SHOW CREATE PROCEDURE `{proc_name}`")
                    result = cursor.fetchone()
                    if result and 'Create Procedure' in result:
                        create_proc = result['Create Procedure']
                        f.write(f"-- Procedure: {proc_name}\n")
                        f.write(f"DROP PROCEDURE IF EXISTS `{proc_name}`$$\n\n")
                        f.write(f"{create_proc}$$\n\n")
            else:
                f.write("-- No stored procedures found\n\n")
            
            f.write("DELIMITER ;\n")
        
        logger.info(f"✅ Procedures exported to: {procedures_file.name}")
        
        # 4. Export Functions
        logger.info("[4/7] Exporting Functions...")
        export_functions_only(functions_file, timestamp)
        logger.info(f"✅ Functions exported to: {functions_file.name}")
        
        # 5. Export Triggers
        logger.info("[5/7] Exporting Triggers...")
        with open(triggers_file, 'w', encoding='utf-8') as f:
            f.write(f"-- ============================================\n")
            f.write(f"-- MedSync Triggers Export\n")
            f.write(f"-- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"-- ============================================\n\n")
            f.write(f"USE `{database}`;\n\n")
            f.write("DELIMITER $$\n\n")
            
            cursor.execute("SHOW TRIGGERS")
            triggers = cursor.fetchall()
            
            if triggers:
                for trigger in triggers:
                    trigger_name = trigger['Trigger']
                    cursor.execute(f"SHOW CREATE TRIGGER `{trigger_name}`")
                    result = cursor.fetchone()
                    if result and 'SQL Original Statement' in result:
                        create_trigger = result['SQL Original Statement']
                        f.write(f"-- Trigger: {trigger_name}\n")
                        f.write(f"DROP TRIGGER IF EXISTS `{trigger_name}`$$\n\n")
                        f.write(f"{create_trigger}$$\n\n")
            else:
                f.write("-- No triggers found\n\n")
            
            f.write("DELIMITER ;\n")
        
        logger.info(f"✅ Triggers exported to: {triggers_file.name}")
        
        # 6. Export Views
        logger.info("[6/7] Exporting Views...")
        export_views_only(views_file, timestamp)
        logger.info(f"✅ Views exported to: {views_file.name}")
        
        # 7. Create Complete Backup
        logger.info("[7/7] Creating Complete Backup...")
        with open(complete_file, 'w', encoding='utf-8') as complete:
            complete.write(f"-- ============================================\n")
            complete.write(f"-- MedSync Complete Database Backup\n")
            complete.write(f"-- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            complete.write(f"-- ============================================\n\n")
            
            for file_path in [schema_file, procedures_file, functions_file, triggers_file, views_file, data_file]:
                if file_path.exists():
                    with open(file_path, 'r', encoding='utf-8') as f:
                        complete.write(f.read())
                        complete.write("\n\n")
        
        logger.info(f"✅ Complete backup exported to: {complete_file.name}")
        
        cursor.close()
        connection.close()
        
        return {
            'success': True,
            'files': {
                'schema_ddl': str(schema_file),
                'data_dml': str(data_file),
                'procedures': str(procedures_file),
                'functions': str(functions_file),
                'triggers': str(triggers_file),
                'views': str(views_file),
                'complete_backup': str(complete_file)
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Python export error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {'success': False, 'error': str(e)}


def export_database():
    """
    Main export function - tries mysqldump first, falls back to Python method
    """
    logger.info("=" * 70)
    logger.info("MedSync Database Export Utility")
    logger.info("=" * 70)
    logger.info(f"Export directory: {EXPORT_DIR}")
    logger.info("=" * 70)
    
    result = export_using_mysqldump()
    
    if result['success']:
        logger.info("\n" + "=" * 70)
        logger.info("✅ Database export completed successfully!")
        logger.info("=" * 70)
        logger.info("Files created:")
        logger.info(f"  📄 Schema (DDL):      {Path(result['files']['schema_ddl']).name}")
        logger.info(f"  📄 Data (DML):        {Path(result['files']['data_dml']).name}")
        logger.info(f"  📄 Procedures:        {Path(result['files']['procedures']).name}")
        logger.info(f"  📄 Functions:         {Path(result['files']['functions']).name}")
        logger.info(f"  📄 Triggers:          {Path(result['files']['triggers']).name}")
        logger.info(f"  📄 Views:             {Path(result['files']['views']).name}")
        logger.info(f"  📦 Complete Backup:   {Path(result['files']['complete_backup']).name}")
        logger.info(f"\nLocation: {EXPORT_DIR}")
        logger.info("=" * 70)
    else:
        logger.error("\n" + "=" * 70)
        logger.error("❌ Database export failed!")
        if 'error' in result:
            logger.error(f"Error: {result['error']}")
        logger.error("=" * 70)
    
    return result


if __name__ == "__main__":
    # Run the export
    export_database()