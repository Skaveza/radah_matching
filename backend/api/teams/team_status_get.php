<?php
require_once '../../core/db.php';

$teamId = $_GET['project_team_id'];

$stmt = $db->prepare(
  "SELECT professional_id, role, status
   FROM project_team_members
   WHERE project_team_id = ?"
);
$stmt->execute([$teamId]);

echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));