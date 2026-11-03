<?php

$ch = curl_init('https://apiv2.jne.co.id:10202/tracing/api/generatecnote');

curl_setopt_array($ch, [
    CURLOPT_CUSTOMREQUEST  => 'POST',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/x-www-form-urlencoded',
        'Accept: application/json',
        'User-Agent: php-request',
    ],
    CURLOPT_POSTFIELDS     => http_build_query([
        'username'              => 'TESTAPI',
        'api_key'               => '25c898a9faea1a100859ecd9ef674548',
        'OLSHOP_BRANCH'         => 'CGK000',
        'OLSHOP_CUST'           => '10915700',
        'OLSHOP_ORDERID'        => 'SYB-DEMO-001',
        'OLSHOP_SHIPPER_NAME'   => 'PT SYB Official Store',
        'OLSHOP_SHIPPER_ADDR1'  => 'Kawasan Rungkut Industri C-12',
        'OLSHOP_SHIPPER_ADDR2'  => 'Kec. Rungkut',
        'OLSHOP_SHIPPER_CITY'   => 'SURABAYA',
        'OLSHOP_SHIPPER_ZIP'    => '60293',
        'OLSHOP_SHIPPER_PHONE'  => '081233336909',
        'OLSHOP_RECEIVER_NAME'  => 'Budi Santoso',
        'OLSHOP_RECEIVER_ADDR1' => 'Jl. Senopati No. 42',
        'OLSHOP_RECEIVER_ADDR2' => 'Kebayoran Baru',
        'OLSHOP_RECEIVER_CITY'  => 'JAKARTA',
        'OLSHOP_RECEIVER_ZIP'   => '12190',
        'OLSHOP_RECEIVER_PHONE' => '081298412933',
        'OLSHOP_QTY'            => '1',
        'OLSHOP_WEIGHT'         => '1',
        'OLSHOP_GOODSDESC'      => 'SYB Skincare & Body Scrub',
        'OLSHOP_GOODSVALUE'     => '50000',
        'OLSHOP_GOODSTYPE'      => '1',
        'OLSHOP_INS_FLAG'       => 'N',
        'OLSHOP_ORIG'           => 'SUB10000',
        'OLSHOP_DEST'           => 'CGK10000',
        'OLSHOP_SERVICE'        => 'REG',
        'OLSHOP_COD_FLAG'       => 'N',
        'OLSHOP_COD_AMOUNT'     => '0',
    ]),
]);

$response = curl_exec($ch);
curl_close($ch);

print_r(json_decode($response, true));

