<?php
class ProjectTeam {
  public static function create($db, $projectId, $version = 1) {
    $stmt = $db->prepare(
      "INSERT INTO project_teams (project_id, version) VALUES (?, ?)"
    );
    $stmt->execute([$projectId, $version]);
    return $db->lastInsertId();
  }
}