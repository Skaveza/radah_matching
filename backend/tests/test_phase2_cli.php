<?php
// Run: php tests/test_phase2_cli.php

$baseUrl = 'http://localhost/api/teams/';

function request($endpoint, $data) {
    $ch = curl_init($endpoint);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
    $resp = curl_exec($ch);
    curl_close($ch);
    return json_decode($resp, true);
}

echo "=== Phase 2 CLI Test ===\n";

// Step 0: Test IDs
$projectId = uniqid('proj_', true);
$teamId = uniqid('team_', true);
$professional1 = 'prof_1';
$professional2 = 'prof_2';

echo "Project: $projectId, Team: $teamId\n";

// Step 1: Invite professional 1
echo "\n[Invite Professional 1]\n";
$invite1 = request($baseUrl . 'team_invite.php', [
    'team_id' => $teamId,
    'professional_id' => $professional1,
    'entrepreneur_id' => 'ent_123'
]);
print_r($invite1);
$tm1 = $invite1['team_member_id'] ?? null;

// Step 2: Invite professional 2
echo "\n[Invite Professional 2]\n";
$invite2 = request($baseUrl . 'team_invite.php', [
    'team_id' => $teamId,
    'professional_id' => $professional2,
    'entrepreneur_id' => 'ent_123'
]);
print_r($invite2);
$tm2 = $invite2['team_member_id'] ?? null;

// Step 3: Professional 1 accepts
echo "\n[Professional 1 Accepts]\n";
$accept1 = request($baseUrl . 'team_accept.php', ['team_member_id' => $tm1]);
print_r($accept1);

// Step 4: Professional 2 declines
echo "\n[Professional 2 Declines]\n";
$decline2 = request($baseUrl . 'team_decline.php', ['team_member_id' => $tm2]);
print_r($decline2);

// Step 5: Attempt invalid accept on Professional 2 (already declined)
echo "\n[Attempt invalid accept on Professional 2]\n";
$invalid = request($baseUrl . 'team_accept.php', ['team_member_id' => $tm2]);
print_r($invalid);

echo "\n✅ CLI Phase 2 test complete.\n";
