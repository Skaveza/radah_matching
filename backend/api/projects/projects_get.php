<?php
require __DIR__ . '/../../bootstrap.php';
require __DIR__ . '/../../firestore_service.php';
require __DIR__ . '/../middlewear/firebase_middlewear_v2.php';

header("Content-Type: application/json");

function json_response($data, int $code = 200) {
  http_response_code($code);
  echo json_encode($data, JSON_PRETTY_PRINT);
  exit;
}

$mw = new FirebaseMiddlewareV2();
$authUser = $mw->verifyToken(["entrepreneur"]);
$uid = $authUser["uid"];

$firestore = new FirestoreService();

$docs = $firestore->collection("projects")
  ->where("entrepreneur_id", "=", $uid)
  ->documents();

$projects = [];

foreach ($docs as $doc) {
  $projectId = $doc->id();
  $projectData = $doc->data();

  // Try load saved team blueprint for this project
  $teamSnap = $firestore->collection("project_teams")->document($projectId)->snapshot();
  $teamData = $teamSnap->exists() ? $teamSnap->data() : null;

  $projects[] = [
    "project_id" => $projectId,
    "project" => $projectData,
    "team" => $teamData, // null if not saved/purchased
  ];
}

json_response(["success" => true, "projects" => $projects]);
