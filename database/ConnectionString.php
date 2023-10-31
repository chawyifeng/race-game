<?php

//Set the Connection String

$dbUsername = 'root';

$dbPassword = '';

$dbHost = 'localhost';

$dbDatabase = 'racing_game';

$dbPort = '3306';

$dbSocket = 'UNIX';



$conn = mysqli_connect($dbHost, $dbUsername, $dbPassword, $dbDatabase, $dbPort, $dbSocket);


if (mysqli_connect_error()) {

	die("Database connection error: " . mysqli_connect_error());

}

//default timezone

//date_default_timezone_set("Asia/Kuala Lumpur");



//start the session

session_start();



$header_page_type = '';

//$html_brand = '';



//setting the php version support

//$php_version_json = JSON_UNESCAPED_UNICODE; //php5.4

$php_version_json = JSON_UNESCAPED_LINE_TERMINATORS; //php7.1

