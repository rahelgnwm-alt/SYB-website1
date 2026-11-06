<?php
/**
 * SYB Official Store - Authentication Middleware
 */

require_once __DIR__ . '/../helpers/jwt.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../config/database.php';

function getAuthUser(): ?array {
    $token = getBearerToken();
    if (!$token) {
        return null;
    }

    $payload = JWT::verify($token);
    if (!$payload || !isset($payload['sub'])) {
        return null;
    }

    $pdo = getDbConnection();
    $stmt = $pdo->prepare("SELECT id, username, email, full_name, phone, role, avatar, is_active FROM users WHERE id = ? LIMIT 1");
    $stmt->execute([$payload['sub']]);
    $user = $stmt->fetch();

    if (!$user || empty($user['is_active'])) {
        return null;
    }

    return $user;
}

function requireAuth(): array {
    $user = getAuthUser();
    if (!$user) {
        sendError('Sesi login telah berakhir atau token tidak valid. Silakan masuk kembali.', 401);
    }
    return $user;
}

function requireAdmin(): array {
    $user = requireAuth();
    if (($user['role'] ?? '') !== 'admin') {
        sendError('Akses ditolak: Hanya Administrator yang berhak mengakses fitur ini.', 403);
    }
    return $user;
}
