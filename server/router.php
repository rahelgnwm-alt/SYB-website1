<?php
/**
 * SYB Official Store - Local PHP Development Server Router
 * 
 * Usage:
 *   php -S localhost:8000 server/router.php
 *   (or: npm run server)
 */

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
$filePath = __DIR__ . $uri;

// If static file exists, serve it directly
if ($uri !== '/' && file_exists($filePath) && !is_dir($filePath)) {
    return false;
}

// Forward all API requests to index.php
require_once __DIR__ . '/index.php';
