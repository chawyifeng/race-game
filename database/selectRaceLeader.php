<?php
include('../database/ConnectionString.php');

$data = array();
$data['response'] = '';
$data['messages'] = 'error';
$data['data'] = array();


if (isset($_POST['selectRaceLeader'])) {
    
    $conn->close();
}

echo json_encode($data, $php_version_json);