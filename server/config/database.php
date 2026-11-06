<?php
/**
 * SYB Official Store - PDO Database Connection Manager
 */

require_once __DIR__ . '/config.php';

function getDbConnection(): PDO {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    // Try MySQL first
    if (DB_TYPE === 'mysql') {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
            ensureDatabaseTablesExist($pdo, 'mysql');
            return $pdo;
        } catch (PDOException $e) {
            // If on production live hosting, report error
            if (file_exists('/home/shevajor')) {
                http_response_code(500);
                header('Content-Type: application/json');
                echo json_encode([
                    'status' => 'error',
                    'message' => 'MySQL Connection Failed: ' . $e->getMessage()
                ]);
                exit();
            }
            // If local and MySQL is offline, fall back to SQLite
            error_log('[SYB Database] MySQL connection failed, falling back to SQLite: ' . $e->getMessage());
        }
    }

    // SQLite Fallback (Zero-configuration local testing)
    $sqlitePath = defined('SQLITE_PATH') ? SQLITE_PATH : __DIR__ . '/../data/syb_store.sqlite';
    $dir = dirname($sqlitePath);
    if (!is_dir($dir)) {
        @mkdir($dir, 0777, true);
    }

    $pdo = new PDO("sqlite:" . $sqlitePath, null, null, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    ensureDatabaseTablesExist($pdo, 'sqlite');
    return $pdo;
}

function ensureDatabaseTablesExist(PDO $pdo, string $driver): void {
    static $checked = false;
    if ($checked) return;
    $checked = true;

    try {
        $schema = file_get_contents(__DIR__ . '/schema.sql');
        if ($driver === 'sqlite') {
            // Adjust MySQL specifics for SQLite
            $schema = str_replace('AUTO_INCREMENT', 'AUTOINCREMENT', $schema);
            $schema = preg_replace('/INT NOT NULL PRIMARY KEY AUTOINCREMENT/i', 'INTEGER PRIMARY KEY AUTOINCREMENT', $schema);
            $schema = preg_replace('/INT PRIMARY KEY DEFAULT 1/i', 'INTEGER PRIMARY KEY DEFAULT 1', $schema);
            $schema = str_replace('LONGTEXT', 'TEXT', $schema);
            $schema = str_replace('ON UPDATE CURRENT_TIMESTAMP', '', $schema);
        }

        $statements = array_filter(array_map('trim', explode(';', $schema)));
        foreach ($statements as $stmt) {
            if (!empty($stmt)) {
                $pdo->exec($stmt);
            }
        }
    } catch (Exception $e) {
        error_log('[SYB Schema Init Error] ' . $e->getMessage());
    }
}

