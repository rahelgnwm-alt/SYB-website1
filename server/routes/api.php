<?php
/**
 * SYB Official Store - Central API URL Dispatcher & Router
 */

require_once __DIR__ . '/../middleware/cors.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../controllers/AuthController.php';
require_once __DIR__ . '/../controllers/ProductController.php';
require_once __DIR__ . '/../controllers/FlashSaleController.php';
require_once __DIR__ . '/../controllers/OrderController.php';
require_once __DIR__ . '/../controllers/ResellerController.php';
require_once __DIR__ . '/../controllers/DiscountController.php';
require_once __DIR__ . '/../controllers/ShippingController.php';
require_once __DIR__ . '/../controllers/SkinAnalysisController.php';
require_once __DIR__ . '/../seed.php';

function dispatchApiRequest(string $path, string $method): void {
    handleCors();

    // Normalize path (strip prefix /api, /server/index.php, /server/api, etc.)
    $path = preg_replace('#^/+(server/)?(index\.php/)?(api/)?#i', '', $path);
    $path = trim($path, '/');

    // Health check & ping
    if ($path === '' || $path === 'health' || $path === 'ping') {
        sendSuccess([
            'service'     => 'SYB Official Store REST API',
            'company'     => 'PT Sheva Jordan Bersama',
            'version'     => '2.0.0',
            'php_version' => phpversion(),
            'status'      => 'online',
            'time'        => date('c')
        ]);
    }

    // Database Seeder
    if ($path === 'seed') {
        $result = runSeeder();
        sendSuccess($result, 'Database seeded successfully.');
    }

    // ==========================================
    // AUTHENTICATION & PROFILE
    // ==========================================
    if ($path === 'auth/login' && $method === 'POST') {
        AuthController::login();
    }
    if ($path === 'auth/register' && $method === 'POST') {
        AuthController::register();
    }
    if ($path === 'auth/me' && $method === 'GET') {
        AuthController::me();
    }
    if ($path === 'auth/profile' && in_array($method, ['PUT', 'POST'])) {
        AuthController::updateProfile();
    }
    if ($path === 'auth/addresses') {
        if ($method === 'GET') AuthController::getAddresses();
        if ($method === 'POST') AuthController::saveAddress();
    }
    if (preg_match('#^auth/addresses/([^/]+)$#', $path, $m) && $method === 'DELETE') {
        AuthController::deleteAddress($m[1]);
    }

    // ==========================================
    // PRODUCTS & REVIEWS
    // ==========================================
    if ($path === 'products/categories' && $method === 'GET') {
        ProductController::categories();
    }
    if ($path === 'products') {
        if ($method === 'GET') ProductController::index();
        if ($method === 'POST') ProductController::store();
    }
    if (preg_match('#^products/([^/]+)/reviews$#', $path, $m) && $method === 'POST') {
        ProductController::addReview($m[1]);
    }
    if (preg_match('#^products/([^/]+)$#', $path, $m)) {
        if ($method === 'GET') ProductController::show($m[1]);
        if (in_array($method, ['PUT', 'POST'])) ProductController::update($m[1]);
        if ($method === 'DELETE') ProductController::destroy($m[1]);
    }

    // ==========================================
    // FLASH SALE
    // ==========================================
    if (($path === 'flash-sale/live' || $path === 'flashsale/live') && $method === 'GET') {
        FlashSaleController::live();
    }
    if ($path === 'flash-sale/sessions' || $path === 'flashsale/sessions') {
        if ($method === 'GET') FlashSaleController::getSessions();
        if ($method === 'POST') FlashSaleController::saveSession();
    }
    if (preg_match('#^flash-?sale/sessions/([^/]+)$#', $path, $m) && $method === 'DELETE') {
        FlashSaleController::deleteSession($m[1]);
    }
    if (($path === 'flash-sale/toggle-master' || $path === 'flashsale/toggle-master') && $method === 'POST') {
        FlashSaleController::toggleMaster();
    }

    // ==========================================
    // ORDERS & CHECKOUT
    // ==========================================
    if ($path === 'orders/my-orders' && $method === 'GET') {
        OrderController::myOrders();
    }
    if ($path === 'orders') {
        if ($method === 'GET') OrderController::index();
        if ($method === 'POST') OrderController::create();
    }
    if (preg_match('#^orders/([^/]+)/status$#', $path, $m) && in_array($method, ['PUT', 'POST'])) {
        OrderController::updateStatus($m[1]);
    }
    if (preg_match('#^orders/([^/]+)$#', $path, $m) && $method === 'GET') {
        OrderController::show($m[1]);
    }

    // ==========================================
    // RESELLER & WHOLESALE
    // ==========================================
    if ($path === 'reseller/products') {
        if ($method === 'GET') ResellerController::index();
        if ($method === 'POST') ResellerController::store();
    }
    if (preg_match('#^reseller/products/([^/]+)$#', $path, $m) && $method === 'DELETE') {
        ResellerController::destroy($m[1]);
    }
    if ($path === 'reseller/register' && $method === 'POST') {
        ResellerController::register();
    }
    if ($path === 'reseller/applications' && $method === 'GET') {
        ResellerController::applications();
    }

    // ==========================================
    // DISCOUNTS & VOUCHERS
    // ==========================================
    if ($path === 'discounts/validate' && $method === 'POST') {
        DiscountController::validateCode();
    }
    if ($path === 'discounts') {
        if ($method === 'GET') DiscountController::index();
        if ($method === 'POST') DiscountController::store();
    }
    if (preg_match('#^discounts/([^/]+)$#', $path, $m) && $method === 'DELETE') {
        DiscountController::destroy($m[1]);
    }

    // ==========================================
    // SHIPPING & JNE LOGISTICS
    // ==========================================
    if ($path === 'shipping/origins' && $method === 'GET') {
        ShippingController::origins();
    }
    if ($path === 'shipping/destinations' && $method === 'GET') {
        ShippingController::destinations();
    }
    if (($path === 'shipping/tariff' || $path === 'pricedev') && in_array($method, ['POST', 'GET'])) {
        ShippingController::tariff();
    }
    if (($path === 'shipping/generate-cnote' || $path === 'generatecnote') && $method === 'POST') {
        ShippingController::generateCnote();
    }

    // ==========================================
    // AI SKIN ANALYSIS
    // ==========================================
    if (($path === 'skin-analysis/analyze' || $path === 'skinanalysis/analyze') && $method === 'POST') {
        SkinAnalysisController::analyze();
    }
    if (($path === 'skin-analysis/history' || $path === 'skinanalysis/history') && $method === 'GET') {
        SkinAnalysisController::history();
    }
    if (preg_match('#^skin-?analysis/([^/]+)$#', $path, $m) && $method === 'GET') {
        SkinAnalysisController::show($m[1]);
    }

    // If no route matches:
    sendError("Endpoint not found: [{$method}] /{$path}", 404);
}
