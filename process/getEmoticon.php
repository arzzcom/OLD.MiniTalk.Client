<?php
/**
 * 이 파일은 미니톡 클라이언트의 일부입니다. (https://www.minitalk.io)
 *
 * 특정 이모티콘 그룹의 폴더를 읽어, 이모티콘을 가져온다.
 * 
 * @file /process/getEmoticon.php
 * @author Arzz (arzz@arzz.com)
 * @license MIT License
 * @version 7.0.1
 * @modified 2021. 3. 10.
 */
if (defined('__MINITALK__') == false) exit;

$category = str_replace('/','',Request('category'));
if (!$category || is_dir(__MINITALK_PATH__.'/emoticons/'.$category) == false || is_dir(__MINITALK_PATH__.'/emoticons/'.$category.'/items') == false) {
	$results->success = false;
	$results->error = $this->getErrorText('NOT_FOUND_EMOTICON');
	return;
}

$items = array();
$emoticonsPath = @opendir(__MINITALK_PATH__.'/emoticons/'.$category.'/items');
while ($emoticonName = @readdir($emoticonsPath)) {
	if ($emoticonName != '.' && $emoticonName != '..' && is_file(__MINITALK_PATH__.'/emoticons/'.$category.'/items/'.$emoticonName) == true) {
		$items[] = $category.'/'.$emoticonName;
	}
}
sort($items);

$results->success = true;
$results->items = $items;
?>