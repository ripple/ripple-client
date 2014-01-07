<?php

// Timezone should be set to GMT
date_default_timezone_set('GMT');

header('Content-Type: application/json');

require_once('config.php');

function request($params)
{
    // Signature
    $x_zipzap_date = date('o-m-d\TH:i:s\Z');
    $stringToSign = $params['verb'] . chr(10) . $x_zipzap_date . chr(10) . $params['URI'];
    $signature = base64_encode(hash_hmac('sha1', $stringToSign, $params['secret']));
    $curl = curl_init($params['baseUrl'].$params['URI']);

    // cURL options
    $options = array(
        CURLOPT_RETURNTRANSFER => 1,
        CURLOPT_HTTPHEADER => array(
            'Content-Type: application/json',
            'x-zipzap-date: ' . $x_zipzap_date,
            'Authorization: ZIPZAP ' . $params['accessID'] . ':' . $signature
        )
    );

    if ($params['verb'] == 'POST') {
        $options[CURLOPT_POST] = true;
        $options[CURLOPT_POSTFIELDS] = json_encode($_POST);
    }

    // cURL options
    curl_setopt_array($curl, $options);

    // Execute
    $response = curl_exec($curl);

    curl_close($curl);

    return $response;
}

switch ($_GET['action']) {
    case 'signup':
        $params['verb'] = 'POST';
        $params['URI'] = '/v1/accounts';
        break;
    case 'locate':
        $params['verb'] = 'GET';
        $params['URI'] = '/v1/PayCenters?q=' . $_GET['q'];
        break;
}

$response = request($params);
$responseObj = json_decode($response);

// Account already exists, get and return it.
if ($responseObj->Code && '40901' == $responseObj->Code) {
    $params['verb'] = 'GET';
    $params['URI'] = '/v1/accounts/MerchantCustomerID/' . $_POST['MerchantCustomerID'];

    $account = request($params);
    $accountObj = json_decode($account);

    if ($responseObj->Phone == $accountObj->Phone
        && $responseObj->Email == $accountObj->Email) {
        echo $account;
    } else {
        echo $response;
    }
}
else {
    echo $response;
}