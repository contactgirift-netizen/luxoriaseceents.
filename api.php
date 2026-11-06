<?php
declare(strict_types=1);
session_set_cookie_params(['httponly'=>true,'samesite'=>'Lax','secure'=>!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS']!=='off']);
session_start();
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store, no-cache, must-revalidate');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$host = parse_url('//' . ($_SERVER['HTTP_HOST'] ?? ''), PHP_URL_HOST);
if ($origin && strtolower((string)parse_url($origin, PHP_URL_HOST)) !== strtolower((string)$host)) {
  http_response_code(403); echo json_encode(['ok'=>false,'error'=>'Origin not allowed']); exit;
}
$configFile = __DIR__ . '/config.php';
$dataFile = __DIR__ . '/data/store.json';
function out($data, int $status=200): void { http_response_code($status); echo json_encode($data, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE); exit; }
function readStore(string $file): array {
  if (!is_file($file)) return [];
  $v=json_decode((string)file_get_contents($file),true);
  return is_array($v)?$v:[];
}
function writeStore(string $file,array $data): bool {
  $tmp=$file.'.tmp';
  if (file_put_contents($tmp,json_encode($data,JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE),LOCK_EX)===false) return false;
  return rename($tmp,$file);
}
if (!is_file($configFile)) out(['ok'=>false,'error'=>'Setup required. Open setup.php first.'],503);
require $configFile;
$action=$_GET['action'] ?? '';
$method=$_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method==='GET' && $action==='public') {
  $s=readStore($dataFile);
  out(['ok'=>true,'products'=>$s['products']??[],'blogs'=>$s['blogs']??[],'pages'=>$s['pages']??[],'announcement'=>$s['announcement']??'','images'=>$s['images']??[]]);
}
if ($method==='GET' && $action==='reviews') {
  $s=readStore($dataFile); $pid=(string)($_GET['product_id']??''); $all=$s['reviews']??[];
  $items=array_values(array_filter($all,fn($r)=>(string)($r['product_id']??'')===$pid));
  out(['ok'=>true,'reviews'=>$items]);
}
// Privacy-conscious visitor heartbeat: random browser ID, page and device only; no IP address stored.
if ($method==='POST' && $action==='visitor-ping') {
  $body=json_decode((string)file_get_contents('php://input'),true); if(!is_array($body)) $body=[];
  $vid=preg_replace('/[^a-zA-Z0-9_-]/','',(string)($body['id']??''));
  if(strlen($vid)<16 || strlen($vid)>80) out(['ok'=>false,'error'=>'Invalid visitor id'],422);
  $page=substr(preg_replace('/[^a-zA-Z0-9_\-\/.?=&]/','',(string)($body['page']??'/')),0,180);
  $device=substr((string)($body['device']??'desktop'),0,20);
  $file=__DIR__.'/data/visitors.json'; $s=readStore($file); $visitors=$s['visitors']??[];
  $now=time(); $found=false;
  foreach($visitors as &$v){ if(($v['id']??'')===$vid){$v['last_seen']=$now;$v['page']=$page;$v['device']=$device;$found=true;break;} } unset($v);
  if(!$found) $visitors[]=['id'=>$vid,'first_seen'=>$now,'last_seen'=>$now,'page'=>$page,'device'=>$device];
  $visitors=array_values(array_filter($visitors,fn($v)=>($v['last_seen']??0)>$now-60*60*24*90));
  if(!writeStore($file,['visitors'=>$visitors])) out(['ok'=>false],500);
  out(['ok'=>true]);
}
if ($method==='POST') {
  $body=json_decode((string)file_get_contents('php://input'),true);
  if (!is_array($body)) $body=[];
  if ($action==='review') {
    // Public product review submission. Reviews are immediately visible on the matching product page.
    $name=trim((string)($body['name']??'')); $message=trim((string)($body['message']??''));
    $productId=(string)($body['product_id']??''); $rating=(int)($body['rating']??0);
    if ($name==='' || mb_strlen($name)>70 || mb_strlen($message)<8 || mb_strlen($message)>1200 || $rating<1 || $rating>5 || $productId==='') out(['ok'=>false,'error'=>'Please enter your name, a review of at least 8 characters and a rating from 1 to 5.'],422);
    $s=readStore($dataFile); $found=false; foreach (($s['products']??[]) as $p) { if ((string)($p['id']??'')===$productId) {$found=true;break;} }
    if (!$found) out(['ok'=>false,'error'=>'Product not found. Please refresh the page.'],404);
    $reviews=$s['reviews']??[]; if (!is_array($reviews)) $reviews=[];
    array_unshift($reviews,['id'=>'REV-'.bin2hex(random_bytes(6)),'product_id'=>$productId,'name'=>$name,'rating'=>$rating,'message'=>$message,'date'=>date('Y-m-d')]);
    $s['reviews']=array_slice($reviews,0,3000);
    if (!writeStore($dataFile,$s)) out(['ok'=>false,'error'=>'Could not save review. Please try again.'],500);
    out(['ok'=>true]);
  }
  if ($action==='login') {
    $password=(string)($body['password']??'');
    if (!password_verify($password, ADMIN_PASSWORD_HASH)) out(['ok'=>false,'error'=>'Incorrect password'],401);
    session_regenerate_id(true); $_SESSION['luxoria_admin']=true;
    out(['ok'=>true]);
  }
  if ($action==='logout') { $_SESSION=[]; session_destroy(); out(['ok'=>true]); }
  if ($action==='order') {
    // Public checkout endpoint. Same-origin requests only (enforced above).
    $orderId=substr(trim((string)($body['id']??'')),0,40);
    $customer=trim((string)($body['customer']??''));
    $email=trim((string)($body['email']??''));
    $phone=trim((string)($body['phone']??''));
    $city=trim((string)($body['city']??''));
    $address=trim((string)($body['address']??''));
    $postal=trim((string)($body['postal']??''));
    $payment=trim((string)($body['payment']??''));
    $note=trim((string)($body['note']??''));
    $itemsIn=$body['items']??[];
    if ($orderId==='' || $customer==='' || !filter_var($email,FILTER_VALIDATE_EMAIL) || $phone==='' || $city==='' || $address==='' || !is_array($itemsIn) || count($itemsIn)<1 || count($itemsIn)>50) {
      out(['ok'=>false,'error'=>'Please provide complete and valid checkout details.'],422);
    }
    $s=readStore($dataFile);
    $orders=$s['orders']??[];
    foreach ($orders as $existing) {
      if (($existing['id']??'')===$orderId) out(['ok'=>true,'duplicate'=>true,'order_id'=>$orderId]);
    }
    $products=$s['products']??[];
    $orderItems=[]; $total=0; $qtyTotal=0;
    foreach ($itemsIn as $item) {
      $pid=$item['id']??null; $qty=(int)($item['qty']??0);
      if ($qty<1 || $qty>50) out(['ok'=>false,'error'=>'Invalid product quantity.'],422);
      $found=null;
      foreach ($products as $idx=>$product) {
        if ((string)($product['id']??'')===(string)$pid) { $found=$idx; break; }
      }
      if ($found===null) out(['ok'=>false,'error'=>'A product in this order is no longer available.'],409);
      $product=$products[$found];
      if ((int)($product['stock']??0)<$qty) out(['ok'=>false,'error'=>'Insufficient stock for '.$product['name'].'. Please refresh the store.'],409);
      $price=(float)($product['price']??0);
      $orderItems[]=['id'=>$product['id'],'name'=>(string)$product['name'],'qty'=>$qty,'price'=>$price];
      $total += $price*$qty; $qtyTotal += $qty;
      $products[$found]['stock']=(int)$product['stock']-$qty;
      $products[$found]['sold']=(int)($product['sold']??0)+$qty;
    }
    $order=[
      'id'=>$orderId,'customer'=>$customer,'email'=>$email,'phone'=>$phone,
      'city'=>$city,'address'=>$address,'postal'=>$postal,'payment'=>$payment,
      'note'=>$note,'date'=>date('Y-m-d H:i:s'),'items'=>$orderItems,
      'qty'=>$qtyTotal,'total'=>$total,'status'=>'New Order','source'=>'Website'
    ];
    array_unshift($orders,$order);
    $s['products']=$products; $s['orders']=$orders;
    $history=$s['history']??[];
    array_unshift($history,['action'=>'Website order received','detail'=>$orderId.' — '.$customer,'date'=>date('Y-m-d H:i:s')]);
    $s['history']=array_slice($history,0,250);
    if (!writeStore($dataFile,$s)) out(['ok'=>false,'error'=>'The order email was sent, but dashboard storage failed. Please contact the store.'],500);
    out(['ok'=>true,'order_id'=>$orderId]);
  }
  if (empty($_SESSION['luxoria_admin'])) out(['ok'=>false,'error'=>'Please log in again'],401);
  if ($action==='save') {
    $key=(string)($body['key']??''); $value=$body['value']??null;
    $allowed=['products','blogs','pages','announcement','orders','history','images'];
    if (!in_array($key,$allowed,true)) out(['ok'=>false,'error'=>'Invalid data section'],400);
    $s=readStore($dataFile); $s[$key]=$value;
    if (!writeStore($dataFile,$s)) out(['ok'=>false,'error'=>'Could not save data. Check folder permissions.'],500);
    out(['ok'=>true]);
  }
  if ($action==='admin-data') {
    $s=readStore($dataFile);
    out(['ok'=>true,'products'=>$s['products']??[],'blogs'=>$s['blogs']??[],'pages'=>$s['pages']??[],'announcement'=>$s['announcement']??'','orders'=>$s['orders']??[],'history'=>$s['history']??[],'images'=>$s['images']??[]]);
  }
}
if ($method==='POST' && $action==='upload') {
  if (empty($_SESSION['luxoria_admin'])) out(['ok'=>false,'error'=>'Please log in again'],401);
  if (empty($_FILES['image']) || $_FILES['image']['error']!==UPLOAD_ERR_OK) out(['ok'=>false,'error'=>'Image upload failed'],400);
  $f=$_FILES['image'];
  if ($f['size']>8*1024*1024) out(['ok'=>false,'error'=>'Maximum image size is 8 MB'],400);
  $mime=(new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);
  $ext=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp','image/gif'=>'gif'][$mime]??null;
  if (!$ext) out(['ok'=>false,'error'=>'Only JPG, PNG, WEBP and GIF images are allowed'],400);
  $dir=__DIR__.'/assets/uploads';
  if (!is_dir($dir) && !mkdir($dir,0755,true)) out(['ok'=>false,'error'=>'Upload folder unavailable'],500);
  $name='luxoria_'.bin2hex(random_bytes(12)).'.'.$ext;
  if (!move_uploaded_file($f['tmp_name'],$dir.'/'.$name)) out(['ok'=>false,'error'=>'Could not store image'],500);
  out(['ok'=>true,'url'=>'uploads/'.$name]);
}
if ($method==='GET' && $action==='admin-data') {
  if (empty($_SESSION['luxoria_admin'])) out(['ok'=>false,'error'=>'Please log in again'],401);
  $s=readStore($dataFile);
  out(['ok'=>true,'products'=>$s['products']??[],'blogs'=>$s['blogs']??[],'pages'=>$s['pages']??[],'announcement'=>$s['announcement']??'','orders'=>$s['orders']??[],'history'=>$s['history']??[],'images'=>$s['images']??[]]);
}
if ($method==='GET' && $action==='visitor-analytics') {
  if (empty($_SESSION['luxoria_admin'])) out(['ok'=>false,'error'=>'Please log in again'],401);
  $s=readStore(__DIR__.'/data/visitors.json'); $all=$s['visitors']??[]; $now=time();
  $today=strtotime('today'); $week=$now-7*86400; $month=$now-30*86400;
  $active=array_values(array_filter($all,fn($v)=>($v['last_seen']??0)>$now-120));
  $countSince=fn($t)=>count(array_filter($all,fn($v)=>($v['first_seen']??0)>=$t));
  $pages=[]; foreach($active as $v){$p=$v['page']??'/';$pages[$p]=($pages[$p]??0)+1;}
  arsort($pages);
  out(['ok'=>true,'total'=>count($all),'today'=>$countSince($today),'week'=>$countSince($week),'month'=>$countSince($month),
    'active'=>count($active),'devices'=>['mobile'=>count(array_filter($active,fn($v)=>($v['device']??'')==='mobile')),'desktop'=>count(array_filter($active,fn($v)=>($v['device']??'')==='desktop'))],
    'pages'=>array_slice(array_map(fn($p,$n)=>['page'=>$p,'active'=>$n],array_keys($pages),array_values($pages)),0,10),
    'recent'=>array_map(fn($v)=>['page'=>$v['page']??'/','device'=>$v['device']??'unknown','last_seen'=>$v['last_seen']??0],array_slice(array_reverse($active),0,30))]);
}
if ($method==='GET' && $action==='status') out(['ok'=>!empty($_SESSION['luxoria_admin'])]);
out(['ok'=>false,'error'=>'Unknown request'],404);
