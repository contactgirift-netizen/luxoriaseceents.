<?php
declare(strict_types=1);
session_start();
$config=__DIR__.'/config.php';
$message='';
if (is_file($config)) { $message='Setup is already complete. Delete setup.php from your hosting account for security.'; }
elseif ($_SERVER['REQUEST_METHOD']==='POST') {
  $p=(string)($_POST['password']??''); $c=(string)($_POST['confirm']??'');
  if (strlen($p)<12) $message='Use an admin password with at least 12 characters.';
  elseif ($p!==$c) $message='Passwords do not match.';
  else {
    $hash=password_hash($p,PASSWORD_DEFAULT);
    $contents="<?php\n// Created by Luxoria setup. Keep this file private.\ndefine('ADMIN_PASSWORD_HASH', ".var_export($hash,true).");\n";
    if (file_put_contents($config,$contents,LOCK_EX)!==false) {
      if (!is_dir(__DIR__.'/data')) mkdir(__DIR__.'/data',0755,true);
      if (!is_file(__DIR__.'/data/store.json')) file_put_contents(__DIR__.'/data/store.json','{}');
      $message='Setup complete. Delete setup.php now, then open admin.html and sign in with your new password.';
    } else $message='Could not write config.php. Check hosting folder permissions.';
  }
}
?><!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Luxoria Admin Setup</title><style>body{margin:0;background:#111;color:#eee;font:15px Arial;display:grid;min-height:100vh;place-items:center}.box{width:min(420px,90vw);background:#1b1b1b;padding:32px;border:1px solid #b99b63}h1{color:#d5b77b;font-family:Georgia}label{display:block;margin:16px 0}input{display:block;box-sizing:border-box;width:100%;padding:13px;margin-top:7px;background:#111;color:#fff;border:1px solid #555}button{padding:13px 20px;background:#c5a46b;border:0;font-weight:bold;cursor:pointer}.msg{color:#e6c98e;line-height:1.5}</style></head><body><main class="box"><h1>Luxoria Scents</h1><p>Secure admin setup</p><?php if($message): ?><p class="msg"><?=htmlspecialchars($message,ENT_QUOTES,'UTF-8')?></p><?php endif; ?><?php if(!is_file($config)): ?><form method="post"><label>New admin password<input type="password" name="password" minlength="12" required></label><label>Confirm password<input type="password" name="confirm" minlength="12" required></label><button type="submit">Create Admin Login</button></form><?php endif; ?></main></body></html>
