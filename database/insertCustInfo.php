<?php
include('../database/ConnectionString.php');

$data = array();
$data['response'] = '';
$data['messages'] = 'error';
$data['data'] = array();

if (isset($_POST['insertCustInfo'])) {
    // Escape special characters, if any
    $txtName = $conn -> real_escape_string($_POST['txtName']);
    $txtEmail = $conn -> real_escape_string($_POST['txtEmail']);
    $txtContact = $conn -> real_escape_string($_POST['txtContact']);

    $verify_stmt = $conn->prepare("SELECT contactNo FROM tbl_customer WHERE contactNo=?");
    $verify_stmt->bind_param("s", $txtContact);
    $verify_result = $verify_stmt->execute();
    $verify_result_set = $verify_stmt->get_result();
    $verify_num = $verify_result_set->num_rows;
    $verify_stmt->close();

    if(!$verify_result){
        $data['messages'] = 'Query Error: Verify User fail. Please contact system administrator.';
		$data['response'] = 'error';

    }else if ($verify_num > 0) { //if ($verify_result->num_rows > 0)
        $data['messages'] = 'User ID exists';
		$data['response'] = 'error';

    }else{
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
    }

    $conn->close();
}


echo json_encode($data, $php_version_json);
