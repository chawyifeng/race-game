<?php
include('../database/ConnectionString.php');

$data = array();
$data['response'] = '';
$data['messages'] = 'error';
$data['data'] = array();

if (isset($_POST['updateCustInfo'])) {
    $txtName = $_POST['txtName'];
    $txtEmail = $_POST['txtEmail'];
    $txtContact = $_POST['txtContact'];
      
    // Escape special characters, if any
    $txtName = $conn -> real_escape_string($_POST['txtName']);
    $txtEmail = $conn -> real_escape_string($_POST['txtEmail']);
    $txtContact = $conn -> real_escape_string($_POST['txtContact']);

    // prepare and bind
    $stmt = $conn->prepare("INSERT INTO tbl_customer (name, email, contactNo) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $txtName, $txtEmail, $txtContact);

    $result = $stmt->execute();

    if (!$result) {
        $data['response'] = 'error';
        $data['messages'] = 'Query error: Insert Fail, please contact system administrator.';
    } else {
        $data['response'] = 'ok';
        $data['messages'] = 'Successfully Insert';
    }
    $stmt->close();
    $conn->close();
}


echo json_encode($data, $php_version_json);
