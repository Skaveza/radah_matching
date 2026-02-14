<?php
header("Content-Type: application/json");
echo json_encode([
  "success" => true,
  "status" => "ok",
  "timestamp" => date("c"),
], JSON_PRETTY_PRINT);
