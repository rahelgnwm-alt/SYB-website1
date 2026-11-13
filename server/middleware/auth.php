<?php
/**
 * SYB Official Store - Authentication Middleware
 */

require_once __DIR__ . '/../helpers/jwt.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../config/database.php';

function getAuthUser(): ?array {
    // Check direct admin key header from store admin dashboard
    $adminKey = $_SERVER['HTTP_X_ADMIN_KEY'] ?? ($_SERVER['HTTP_X_SYB_ADMIN'] ?? null);
    if ($adminKey && ($adminKey === 'sybadmin2026' || (defined('JWT_SECRET') && $adminKey === JWT_SECRET))) {
        return [
            'id' => 'usr-admin',
            'username' => 'admin',
            'email' => 'admin@syb.co.id',
            'full_name' => 'Administrator SYB Official',
            'role' => 'admin',
            'is_active' => 1
        ];
    }

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

