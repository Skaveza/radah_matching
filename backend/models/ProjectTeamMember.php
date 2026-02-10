<?php
class ProjectTeamMember {
  public static function add($db, $teamId, $professionalId, $role) {
    $stmt = $db->prepare(
      "INSERT INTO project_team_members (project_team_id, professional_id, role)
       VALUES (?, ?, ?)"
    );
    return $stmt->execute([$teamId, $professionalId, $role]);
  }

  public static function updateStatus($db, $id, $status) {
    $stmt = $db->prepare(
      "UPDATE project_team_members SET status = ? WHERE id = ?"
    );
    return $stmt->execute([$status, $id]);
  }
}