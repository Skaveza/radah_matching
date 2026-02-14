<?php

return [
  "blueprint" => [
    "type" => "one_time",
    "projects_limit" => 1,
    "scenarios" => 1, // team scenarios unlocked
  ],
  "pro" => [
    "type" => "one_time",
    "projects_limit" => 1,
    "scenarios" => 2,
  ],
  "membership" => [
    "type" => "subscription",
    "projects_limit" => -1, // unlimited if membership_status active
    "scenarios" => 2,
  ],
];
