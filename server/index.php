<?php
/**
 * SYB Official Store - Central PHP REST API Gateway
 * PT Sheva Jordan Bersama
 */

require_once __DIR__ . '/routes/api.php';

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

dispatchApiRequest($uri, $method);
