<?php
/**
 * SYB Official Store - AI Skin Analysis & Regimen Controller
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';

class SkinAnalysisController {
    public static function analyze(): void {
        $input = getJsonInput();
        $pdo = getDbConnection();

        $user = getAuthUser();
        $userId = $user ? $user['id'] : null;
        $guestId = $input['guestId'] ?? ($input['guest_id'] ?? ('gst-' . bin2hex(random_bytes(6))));

        $answers = $input['answers'] ?? $input;
        $skinFeeling = strtolower($answers['skinFeeling'] ?? ($answers['skin_feeling'] ?? 'normal'));
        $oilLevel = strtolower($answers['oilLevel'] ?? ($answers['oil_level'] ?? 'medium'));
        $sensitivity = strtolower($answers['sensitivity'] ?? 'low');
        $concerns = (array)($answers['concerns'] ?? ['kusam']);

        // Determine Skin Type
        $skinType = 'Normal to Combination';
        if (strpos($skinFeeling, 'oily') !== false || strpos($oilLevel, 'high') !== false) {
            $skinType = 'Berminyak (Oily Skin)';
        } elseif (strpos($skinFeeling, 'dry') !== false || strpos($skinFeeling, 'tight') !== false) {
            $skinType = 'Kering & Dehidrasi (Dry Skin)';
        } elseif (strpos($sensitivity, 'high') !== false || in_array('sensitif', $concerns)) {
            $skinType = 'Sensitif & Rentan Kemerahan';
        }

        // Recommend SYB Products
        $recProducts = [];
        $amRoutine = [];
        $pmRoutine = [];

        // Fetch products catalog
        $allProducts = $pdo->query("SELECT id, title, subtitle, price, image FROM products WHERE status = 'Active'")->fetchAll();
        $prodMap = [];
        foreach ($allProducts as $p) {
            $prodMap[$p['id']] = $p;
        }

        // 1. Cleanser & Prep
        if (isset($prodMap['aha-body-toner'])) {
            $recProducts[] = 'aha-body-toner';
            $amRoutine[] = [
                'step'    => 'Pembersih & Toner',
                'action'  => 'Eksfoliasi Ringan & Hidrasi',
                'product' => $prodMap['aha-body-toner'],
                'note'    => 'Tuang ke kapas, usap lembut ke wajah dan leher'
            ];
        }

        // 2. Active Serum
        if (in_array('jerawat', $concerns) || in_array('pori', $concerns)) {
            if (isset($prodMap['peeling-serum'])) {
                $recProducts[] = 'peeling-serum';
                $pmRoutine[] = [
                    'step'    => 'Serum Eksfoliasi',
                    'action'  => 'Pembersih Pori & Anti Jerawat',
                    'product' => $prodMap['peeling-serum'],
                    'note'    => 'Gunakan 2-3 kali seminggu pada malam hari'
                ];
            }
        }

        // 3. Brightening & Glow
        if (isset($prodMap['red-jelly-serum'])) {
            $recProducts[] = 'red-jelly-serum';
            $amRoutine[] = [
                'step'    => 'Serum Pagi (Glow Booster)',
                'action'  => 'Mencerahkan & Mengunci Kelembapan',
                'product' => $prodMap['red-jelly-serum'],
                'note'    => 'Teteskan 2-3 tetes, tepuk perlahan hingga meresap'
            ];
            $pmRoutine[] = [
                'step'    => 'Serum Malam (Regenerasi)',
                'action'  => 'Memperbaiki Skin Barrier & Mencerahkan',
                'product' => $prodMap['red-jelly-serum'],
                'note'    => 'Gunakan sebelum tidur untuk hasil glowing maksimal di pagi hari'
            ];
        }

        // 4. Masker
        if (isset($prodMap['golden-egg-mask'])) {
            $recProducts[] = 'golden-egg-mask';
            $pmRoutine[] = [
                'step'    => 'Masker Perawatan',
                'action'  => 'Anti-Aging & Nutrisi DNA Salmon',
                'product' => $prodMap['golden-egg-mask'],
                'note'    => 'Oleskan merata 2x seminggu sebagai sleeping mask'
            ];
        }

        // 5. Lip care
        if (isset($prodMap['lippy-oil-serum'])) {
            $recProducts[] = 'lippy-oil-serum';
            $amRoutine[] = [
                'step'    => 'Nutrisi Bibir',
                'action'  => 'Melembapkan dengan Jojoba Oil',
                'product' => $prodMap['lippy-oil-serum'],
                'note'    => 'Oleskan tipis sebagai lip primer atau lip gloss'
            ];
        }

        $recProducts = array_values(array_unique($recProducts));

        // Format WhatsApp Prescription text
        $waText = "Halo Konsultan Kulit SYB Official! 🌸\n\nSaya telah melakukan Tes Analisis Kulit AI di website SYB:\n";
        $waText .= "• Tipe Kulit: {$skinType}\n";
        $waText .= "• Masalah Utama: " . implode(', ', array_map('ucfirst', $concerns)) . "\n";
        $waText .= "• Resep Produk yang Disarankan:\n";
        foreach ($recProducts as $idx => $pid) {
            $name = $prodMap[$pid]['title'] ?? $pid;
            $waText .= "  " . ($idx + 1) . ". {$name}\n";
        }
        $waText .= "\nMohon panduan lebih lanjut untuk memulai ritual glowing saya. Terima kasih! ✨";

        // Save Analysis Result
        $id = 'skn-' . date('Ymd') . '-' . substr(uniqid(), -4);
        $stmt = $pdo->prepare("INSERT INTO skin_analyses 
            (id, user_id, guest_id, quiz_answers, skin_type, primary_concerns, routine_am, routine_pm, recommended_product_ids, whatsapp_text) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

        $stmt->execute([
            $id,
            $userId,
            $guestId,
            json_encode($answers),
            $skinType,
            json_encode($concerns),
            json_encode($amRoutine),
            json_encode($pmRoutine),
            json_encode($recProducts),
            $waText
        ]);

        sendSuccess([
            'id'             => $id,
            'skinType'       => $skinType,
            'concerns'       => $concerns,
            'amRoutine'      => $amRoutine,
            'pmRoutine'      => $pmRoutine,
            'recommendedIds' => $recProducts,
            'whatsappText'   => $waText
        ], 'Analisis kulit berhasil dibuat!', 201);
    }

    public static function show(string $id): void {
        $pdo = getDbConnection();
        $stmt = $pdo->prepare("SELECT * FROM skin_analyses WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
        $row = $stmt->fetch();

        if (!$row) {
            sendError('Hasil analisis tidak ditemukan.', 404);
        }

        $row['quiz_answers'] = json_decode($row['quiz_answers'] ?: '{}', true);
        $row['primary_concerns'] = json_decode($row['primary_concerns'] ?: '[]', true);
        $row['routine_am'] = json_decode($row['routine_am'] ?: '[]', true);
        $row['routine_pm'] = json_decode($row['routine_pm'] ?: '[]', true);
        $row['recommended_product_ids'] = json_decode($row['recommended_product_ids'] ?: '[]', true);

        sendSuccess($row);
    }

    public static function history(): void {
        $user = getAuthUser();
        $guestId = $_GET['guest_id'] ?? '';

        if (!$user && !$guestId) {
            sendSuccess([]);
        }

        $pdo = getDbConnection();
        if ($user) {
            $stmt = $pdo->prepare("SELECT * FROM skin_analyses WHERE user_id = ? ORDER BY created_at DESC LIMIT 20");
            $stmt->execute([$user['id']]);
        } else {
            $stmt = $pdo->prepare("SELECT * FROM skin_analyses WHERE guest_id = ? ORDER BY created_at DESC LIMIT 20");
            $stmt->execute([$guestId]);
        }

        $list = $stmt->fetchAll();
        foreach ($list as &$row) {
            $row['primary_concerns'] = json_decode($row['primary_concerns'] ?: '[]', true);
            $row['routine_am'] = json_decode($row['routine_am'] ?: '[]', true);
            $row['routine_pm'] = json_decode($row['routine_pm'] ?: '[]', true);
        }

        sendSuccess($list);
    }
}

