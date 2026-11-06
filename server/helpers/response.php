<?php
/**
 * SYB Official Store - HTTP Response & Request Helpers
 */

function sendJson($data, int $statusCode = 200): void {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}

function sendSuccess($data = null, ?string $message = null, int $statusCode = 200): void {
    $res = ['status' => 'success'];
    if ($message !== null) {
        $res['message'] = $message;
    }
    if ($data !== null) {
        $res['data'] = $data;
    }
    sendJson($res, $statusCode);
}

function sendError(string $message, int $statusCode = 400, $errors = null): void {
    $res = [
        'status' => 'error',
        'message' => $message
    ];
    if ($errors !== null) {
        $res['errors'] = $errors;
    }
    sendJson($res, $statusCode);
}

function getJsonInput(): array {
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return $_POST;
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function getBearerToken(): ?string {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!$header && function_exists('getallheaders')) {
        $headers = getallheaders();
        $header = $headers['Authorization'] ?? ($headers['authorization'] ?? '');
    }
    if (!empty($header) && preg_match('/Bearer\s+(\S+)/i', $header, $matches)) {
        return $matches[1];
    }
    return null;
}

