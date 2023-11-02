<?php
include('../database/ConnectionString.php');

$data = array();
$data['response'] = '';
$data['messages'] = 'error';
$data['data'] = array();


if (isset($_POST['updateCustBestTime'])) {

    // Escape special characters, if any
    $bestTime = $conn -> real_escape_string($_POST['bestTime']);
    $cookiePhoneNo = $conn -> real_escape_string($_POST['cookiePhoneNo']);

    $verify_stmt = $conn->prepare("SELECT contactNo FROM tbl_customer WHERE contactNo=?");
    $verify_stmt->bind_param("s", $cookiePhoneNo);
    $verify_result = $verify_stmt->execute();
    $verify_result_set = $verify_stmt->get_result();
    $verify_num = $verify_result_set->num_rows;
    $verify_stmt->close();

    if(!$verify_result){

        $data['messages'] = 'Query Error: Verify User Fail. Please contact system administrator.';
		$data['response'] = 'error';

    }else if ($verify_num <= 0) { //if ($verify_result->num_rows > 0)

        $data['messages'] = 'Unable to find user';
		$data['response'] = 'error';

    }else{
        // prepare and bind
        $stmt = $conn->prepare("UPDATE tbl_customer SET bestTime = ? WHERE contactNo = ?");
        $stmt->bind_param("ss", $bestTime, $cookiePhoneNo);

        $result = $stmt->execute();

        if (!$result) {
            $data['response'] = 'error';
            $data['messages'] = 'Query error: Update Result Fail. Please contact system administrator.';
        } else {
            $data['response'] = 'ok';
            $data['messages'] = 'Successfully Submit Best Result';
        }

        $stmt->close();
    }

    $conn->close();
}

echo json_encode($data, $php_version_json);