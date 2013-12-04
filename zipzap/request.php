<?php
// !!! Server timezone should be set to GMT

header('Content-Type: application/json');

require_once('config.php');

$verb = $_GET['verb'];
$URI = $_GET['uri'];

// Signature
$x_zipzap_date = date('o-m-d\TH:i:s\Z');
$stringToSign = $verb . chr(10) . $x_zipzap_date . chr(10) . $URI;
$signature = base64_encode(hash_hmac('sha1', $stringToSign, $secret));
$curl = curl_init($baseUrl.$URI);

// cURL options
$options = array(
  CURLOPT_RETURNTRANSFER => 1,
  CURLOPT_HTTPHEADER => array(
    'Content-Type: application/json',
    'x-zipzap-date: ' . $x_zipzap_date,
    'Authorization: ZIPZAP ' . $accessID . ':' . $signature
  )
);

if ($verb == 'POST') {
  $options[CURLOPT_POST] = true;
  $options[CURLOPT_POSTFIELDS] = json_encode($_POST);
}

// cURL options
curl_setopt_array($curl, $options);

// Execute
echo curl_exec($curl);
curl_close($curl);