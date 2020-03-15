<?php
/**
 * 이 파일은 미니톡 클라이언트의 일부입니다. (https://www.minitalk.io)
 *
 * 미니톡 클라이언트 클래스를 정의한다.
 * 
 * @file /classes/Minitalk.class.php
 * @author Arzz (arzz@arzz.com)
 * @license MIT License
 * @version 7.0.0
 * @modified 2020. 3. 16.
 */
class Minitalk {
	/**
	 * DB 관련 변수정의
	 *
	 * @private DB $DB DB에 접속하고 데이터를 처리하기 위한 DB class (@see /classes/DB.class.php)
	 * @private string[] $table DB 테이블 별칭 및 원 테이블명을 정의하기 위한 변수
	 */
	private $DB = null;
	private $table;
	
	/**
	 * 미니톡 클라이언트 설정변수
	 */
	public $language;
	
	/**
	 * 각 기능별 core class 를 정의한다.
	 *
	 * @public Cache $Cache 캐싱처리를 위한 Cache class (@see /classes/Cache.class.php)
	 */
	public $Cache;
	
	/**
	 * 언어셋을 정의한다.
	 * 
	 * @private object $lang 현재 사이트주소에서 설정된 언어셋
	 * @private object $oLang package.json 에 의해 정의된 기본 언어셋
	 */
	private $lang = null;
	private $oLang = null;
	
	/**
	 * DB접근을 줄이기 위해 DB에서 불러온 데이터를 저장할 변수를 정의한다.
	 *
	 * @private $servers 서버정보
	 * @private $categories 카테고리정보
	 * @private $channels 채널정보
	 */
	private $servers = array();
	private $categories = array();
	private $channels = array();
	
	private $initTime = 0;
	private $timezone; // server timezone
	
	/**
	 * class 선언
	 */
	function __construct() {
		global $_CONFIGS;
		
		/**
		 * 페이지 로딩시간을 구하기 위한 최초 마이크로타임을 기록한다.
		 */
		$this->initTime = $this->getMicroTime();
		
		/**
		 * 미니톡 클라이언트가 설치되어 있다면 각 기능별 core class 를 호출한다.
		 * 이 클래스는 인스톨러에서도 사용되기 인스톨러에서 호출되면 에러가 발생하는 기능 class 를 비활성화 한다.
		 */
		if ($_CONFIGS->installed === true) {
			$this->Cache = new Cache($this);
		}
		
		/**
		 * 타임존 설정
		 * @todo 언젠가 사용할 예정
		 */
		$this->timezone = 'Asia/Seoul';
		date_default_timezone_set($this->timezone);
		
		/**
		 * 미니톡 클라이언트에서 사용하는 DB 테이블 별칭 정의
		 * @see package.json 의 databases 참고
		 */
		$this->table = new stdClass();
		$this->table->admin = 'admin_table';
		$this->table->server = 'server_table';
		$this->table->category = 'category_table';
		$this->table->channel = 'channel_table';
		$this->table->ipban = 'ipban_table';
	}
	
	/**
	 * 미니톡 클라이언트의 실행모드를 설정한다.
	 *
	 * @param string $mode 실행모드
	 * @return Minitalk $this
	 */
	function setMode($mode) {
		$this->mode = $mode;
		return $this;
	}
	
	/**
	 * DB클래스를 반환한다.
	 *
	 * @param string $code DB코드 (기본값 : default)
	 * @param string $prefix DB 테이블 앞에 고정적으로 사용되는 PREFIX 명 (정의되지 않을 경우 init.config.php 에서 정의된 __MINITALK_DB_PREFIX__ 상수값을 사용한다.
	 * @return DB $DB
	 */
	function db($code='default',$prefix=null) {
		if ($this->DB == null) $this->DB = new DB($this);
		
		$prefix = $prefix === null ? __MINITALK_DB_PREFIX__ : $prefix;
		return $this->DB->get($code,$prefix);
	}
	
	/**
	 * Cache 클래스를 반환한다.
	 *
	 * @return Cache $cache
	 */
	function cache() {
		return $this->Cache;
	}
	
	/**
	 * 언어셋파일에 정의된 코드를 이용하여 사이트에 설정된 언어별로 텍스트를 반환한다.
	 * 코드에 해당하는 문자열이 없을 경우 1차적으로 package.json 에 정의된 기본언어셋의 텍스트를 반환하고, 기본언어셋 텍스트도 없을 경우에는 코드를 그대로 반환한다.
	 *
	 * @param string $code 언어코드
	 * @param string $replacement 일치하는 언어코드가 없을 경우 반환될 메세지 (기본값 : null, $code 반환)
	 * @return string $language 실제 언어셋 텍스트
	 */
	function getText($code,$replacement=null) {
		if ($this->lang == null) {
			$package = json_decode(file_get_contents(__MINITALK_PATH__.'/package.json'));
			if (file_exists(__MINITALK_PATH__.'/languages/'.$this->language.'.json') == true) {
				$this->lang = json_decode(file_get_contents(__MINITALK_PATH__.'/languages/'.$this->language.'.json'));
				if ($this->language != $package->language) {
					$this->oLang = json_decode(file_get_contents(__MINITALK_PATH__.'/languages/'.$package->language.'.json'));
				}
			} else {
				$this->lang = json_decode(file_get_contents(__MINITALK_PATH__.'/languages/'.$package->language.'.json'));
				$this->oLang = null;
			}
		}
		
		$returnString = null;
		$temp = explode('/',$code);
		
		$string = $this->lang;
		$oString = $this->oLang;
		for ($i=0, $loop=count($temp);$i<$loop;$i++) {
			if (isset($string->{$temp[$i]}) == true) {
				$string = $string->{$temp[$i]};
			} else {
				$string = null;
				break;
			}
		}
		
		if ($string != null) {
			$returnString = $string;
		} elseif ($this->oLang != null) {
			if ($string == null && $this->oLang != null) {
				$string = $this->oLang;
				for ($i=0, $loop=count($temp);$i<$loop;$i++) {
					if (isset($string->{$temp[$i]}) == true) {
						$string = $string->{$temp[$i]};
					} else {
						$string = null;
						break;
					}
				}
			}
			
			if ($string != null) $returnString = $string;
		}
		
		if ($returnString == null) return $replacement === null ? $code : $replacement;
		else return $returnString;
	}
	
	/**
	 * 상황에 맞게 에러코드를 반환한다.
	 *
	 * @param string $code 에러코드
	 * @param object $value(옵션) 에러와 관련된 데이터
	 * @param string $message(옵션) 변환된 에러메세지
	 */
	function getErrorText($code,$value=null,$message=null,$isRawData=false) {
		if (is_object($code) == true) {
			$message = $code->message;
			$description = $code->description;
			$type = $code->type;
		} else {
			$message = '';
			if ($message == null) {
				$message = $this->getText('error/'.$code,$code);
			}
			
			if ($message == $code) {
				$message = $this->getText('error/UNKNOWN');
				$description = $code;
				$type = 'MAIN';
			} else {
				$description = null;
				switch ($code) {
					case 'PHP_ERROR' :
						$description = 'File : '.$value['file'].'<br>Line : '.$value['line'].'<br><br>';
						$description.= nl2br(str_replace(array('<','>'),array('&lt;','&gt;'),$value['message']));
						$type = 'MAIN';
						break;
						
					case 'NOT_FOUND_PAGE' :
						$description = $value ? $value : $this->getUrl();
						$type = 'BACK';
						break;
						
					case 'REQUIRED_LOGIN' :
						$type = 'LOGIN';
						break;
						
					default :
						if ($value != null && is_string($value) == true) $description = $value;
						$type = 'BACK';
				}
				$description = strlen($description) == 0 ? null : $description;
			}
		}
		
		if ($isRawData === true) {
			$data = new stdClass();
			$data->message = $message;
			$data->description = $description;
			$data->type = $type;
			
			return $data;
		}
		
		return $message.($description !== null ? ' ('.$description.')' : '');
	}
	
	/**
	 * 미니톡 클라이언트의 상대경로를 가져온다.
	 *
	 * @param string $dir
	 */
	function getDir() {
		return __MINITALK_DIR__;
	}
	
	/**
	 * 미니톡 클라이언트의 절대경로를 가져온다.
	 *
	 * @param string $path
	 */
	function getPath() {
		return __MINITALK_PATH__;
	}
	
	/**
	 * 함수가 호출될 시점의 microtime 을 구한다.
	 *
	 * @return double $microtime
	 */
	function getMicroTime() {
		$microtimestmp = explode(" ",microtime());
		return $microtimestmp[0]+$microtimestmp[1];
	}
	
	/**
	 * 미니톡 클라이언트가 선언되고 나서 함수가 호출되는 시점까지의 수행시간을 구한다.
	 *
	 * @return double $loadtime
	 */
	function getLoadTime() {
		return sprintf('%0.5f',$this->getMicroTime() - $this->initTime);
	}
	
	/**
	 * 모든 첨부파일이 저장되는 절대경로를 반환한다.
	 *
	 * @return string $attachment_path
	 * @see /modules/ModuleAttachment.class.php
	 * @tode 첨부파일 저장되는 경로를 변경할 수 있는 설정값 추가
	 */
	function getAttachmentPath() {
		global $_CONFIGS;
		if (isset($_CONFIGS->attachment) == true && isset($_CONFIGS->attachment->path) == true) return $_CONFIGS->attachment->path;
		return __MINITALK_PATH__.'/attachments';
	}
	
	/**
	 * 미니톡 클라이언트 관리자 로그인정보를 가져온다.
	 *
	 * @return object $logged
	 */
	function getAdminLogged() {
		$logged = Request('MINITALK_LOGGED','session') != null ? Request('MINITALK_LOGGED','session') : Request('MINITALK_LOGGED','cookie');
		$logged = $logged != null && Decoder($logged) !== false && json_decode(Decoder($logged)) !== null ? json_decode(Decoder($logged)) : null;
		if ($logged == null) return null;
		
		$logged = $this->db()->select($this->table->admin)->where('idx',$logged->idx)->getOne();
		$this->setLanguage($logged->language);
		
		return $logged;
	}
	
	/**
	 * 미니톡 클라이언트 관리자 여부를 가져온다.
	 *
	 * @return boolean $is_admin
	 */
	function isAdmin() {
		return $this->getAdminLogged() !== null;
	}
	
	/**
	 * 미니톡 클라이언트의 언어셋을 지정한다.
	 *
	 * @param string $languge
	 */
	function setLanguage($language) {
		$this->language = $language;
	}
	
	/**
	 * 서버정보를 가져온다.
	 *
	 * @param int $domain 서버도메인
	 * @return object $domain
	 */
	function getServer($domain) {
		if (isset($this->servers[$domain]) == true) return $this->servers[$domain];
		$server = $this->db()->select($this->table->server)->where('domain',$domain)->getOne();
		if ($server != null) {
			if ($server->latest_update < time() - 60) {
				$this->updateServer($domain);
				return $this->getServer($domain);
			}
			$server->connection = $server->connection ? json_decode($server->connection) : null;
		}
		
		$this->servers[$domain] = $server;
		return $this->servers[$domain];
	}
	
	/**
	 * 서버상태정보를 가져온다.
	 *
	 * @param string $domain 서버도메인
	 * @return object $status
	 */
	function getServerStatus($domain) {
		$ch = curl_init();
		curl_setopt($ch,CURLOPT_URL,$domain.'/status');
		curl_setopt($ch,CURLOPT_RETURNTRANSFER,true);
		curl_setopt($ch,CURLOPT_TIMEOUT,10);
		$result = curl_exec($ch);
		$http_code = curl_getinfo($ch,CURLINFO_HTTP_CODE);
		$content_type = explode(';',curl_getinfo($ch,CURLINFO_CONTENT_TYPE));
		$content_type = array_shift($content_type);
		curl_close($ch);
		
		if ($http_code == 200) {
			return json_decode($result);
		}
		
		return null;
	}
	
	/**
	 * 카테고리정보를 가져온다.
	 *
	 * @param int $idx 카테고리 고유값
	 * @return object $category
	 */
	function getCategory($idx) {
		if (isset($this->categories[$idx]) == true) return $this->categories[$idx];
		$this->categories[$idx] = $this->db()->select($this->table->category)->where('idx',$idx)->getOne();
		return $this->categories[$idx];
	}
	
	/**
	 * 카테고리명을 가져온다.
	 *
	 * @param int $idx 카테고리 고유값
	 * @return string $category
	 */
	function getCategoryTitle($idx) {
		$category = $this->getCategory($idx);
		return $category == null ? '' : $category->category;
	}
	
	/**
	 * 채널정보를 가져온다.
	 *
	 * @param string $name 채널명
	 * @return object $channel
	 */
	function getChannel($channel) {
		if (isset($this->channels[$channel]) == true) return $this->channels[$channel];
		$this->channels[$channel] = $this->db()->select($this->table->channel)->where('channel',$channel)->getOne();
		return $this->channels[$channel];
	}
	
	/**
	 * [DEPRECATED] 권한코드를 가져온다.
	 *
	 * @param string $opper 권한 [ NICKGUEST | MEMBER | POWERUSER | ADMIN ]
	 * @return string $opperCode 권한코드
	 */
	function getOpperCode($opper) {
		if ($opper == 'GUEST') return;
		return Encoder(json_encode(array('opper'=>$opper,'ip'=>$_SERVER['REMOTE_ADDR'])));
	}
	
	/**
	 * 미니톡 클라이언트 API 주소를 가져온다.
	 *
	 * @return boolean $is_fullurl 전체주소포함 여부
	 */
	function getClientApiUrl($is_fullurl=false) {
		if ($is_fullurl == true) $url = (IsHttps() == true ? 'https' : 'http').'://'.$_SERVER['HTTP_HOST'];
		else $url = '';
		
		return $url.__MINITALK_DIR__.'/api/index.php';
	}
	
	/**
	 * 미니톡 호스팅 API 데이터를 가져온다.
	 *
	 * @param string $api API 명
	 * @param string $query 가져올 데이터
	 */
	function callServiceApi($protocol,$api,$data=array()) {
		global $_CONFIGS;
		
		$data['key'] = $_CONFIGS->key;
		$data['client_version'] = __MINITALK_VERSION__;
		$data['client_url'] = $this->getClientApiUrl(true);
		
		$apiUrl = 'https://api.minitalk.io';
		
		$ch = curl_init();
		if ($protocol == 'GET') {
			curl_setopt($ch,CURLOPT_URL,$apiUrl.'/'.$api.(count($data) > 0 ? '?'.http_build_query($data) : ''));
			curl_setopt($ch,CURLOPT_POST,false);
		} else {
			curl_setopt($ch,CURLOPT_URL,$apiUrl.'/'.$api);
			if ($protocol != 'POST') curl_setopt($ch,CURLOPT_CUSTOMREQUEST,$protocol);
			curl_setopt($ch,CURLOPT_POST,true);
			curl_setopt($ch,CURLOPT_POSTFIELDS,$data);
		}
		curl_setopt($ch,CURLOPT_TIMEOUT,10);
		curl_setopt($ch,CURLOPT_RETURNTRANSFER,1);
		$data = curl_exec($ch);
		$http_code = curl_getinfo($ch,CURLINFO_HTTP_CODE);
		curl_close($ch);
		
		if ($http_code == 200) {
			$results = json_decode($data);
			if ($results === null || isset($results->success) == false) {
				$results = new stdClass();
				$results->success = false;
				$results->message = 'HOSTING_API_FAIL';
			}
		} else {
			$results = new stdClass();
			$results->success = false;
			$results->message = 'HOSTING_API_FAIL';
		}
		
		return $results;
	}
	
	/**
	 * 채널의 채팅서버에 접속하기 위한 서버접속정보를 가져온다.
	 *
	 * @param string $channel 채널명
	 * @return object $connection
	 */
	function getServerConnection($channel) {
		$results = new stdClass();
		$channel = $this->getChannel($channel);
		
		if ($channel == null) {
			$results->success = false;
			$results->error = 'NOT_FOUND_CHANNEL';
			return $results;
		}
		
		/**
		 * 채널에 할당되어 있는 서버가 없을경우
		 */
		if (!$channel->server || $this->getServer($channel->server) == null || $this->getServer($channel->server)->status == 'OFFLINE') {
			$this->updateServer();
		
			/**
			 * 가용한 서버중 접속자수가 가장 작은 서버를 가져온다.
			 */
			$server = $this->db()->select($this->table->server)->where('status','ONLINE')->orderBy('user','asc')->getOne();
			
			/**
			 * 온라인인 서버가 없을 경우
			 */
			if ($server == null) {
				$results->success = false;
				$results->error = 'NOT_FOUND_ONLINE_SERVER';
				return $results;
			}
			
			$this->db()->update($this->table->channel,array('server'=>$server->domain,'user'=>0))->where('channel',$channel->channel)->execute();
			unset($this->channels[$channel->channel]);
			return $this->getServerConnection($channel->channel);
		}
		
		$this->updateServer($channel->server);
		$server = $this->getServer($channel->server);
		
		if ($server->connection == null) {
			$results->success = false;
			$results->error = 'SERVICE_TEMPORARILY_UNAVAILABLE';
		} else {
			$results->success = true;
			$results->connection = $server->connection;
			$results->connection->channel = Encoder(json_encode(array('name'=>$channel->channel,'title'=>$channel->title,'send_level_limit'=>$channel->send_level_limit,'password'=>$channel->password,'max_user'=>$channel->max_user,'guest_name'=>$channel->guest_name,'allow_nickname_edit'=>$channel->allow_nickname_edit == 'TRUE','userlist_level_limit'=>$channel->userlist_level_limit,'box_level_limit'=>$channel->box_level_limit)));
		}
		
		$results->channel = new stdClass();
		$results->channel->use_box = $channel->box_level_limit > -1;
		$results->channel->use_userlist = $channel->userlist_level_limit > -1;
		
		return $results;
	}
	
	/**
	 * 서버상태를 업데이트한다.
	 *
	 * @param string $domain 온라인여부를 확인할 도메인 (없을 경우 전체서버)
	 */
	function updateServer($domain=null) {
		global $_CONFIGS;
		
		$servers = $this->db()->select($this->table->server)->where('latest_update',time() - 60,'<');
		if ($domain != null) $servers->where('domain',$domain);
		$servers = $servers->get();
		
		foreach ($servers as $server) {
			if ($server->type == 'SERVER') {
				$status = $this->getServerStatus($server->domain);
				if ($status !== null && $status->status == 'ONLINE') {
					$connection = new stdClass();
					$connection->domain = $server->domain;
					$connection->client_id = md5($server->domain);
					$connection->connection = Encoder(json_encode(array('max_user'=>0,'client_id'=>md5($server->domain),'key'=>$_CONFIGS->key,'lifetime'=>time() + 3600)));
					$this->db()->update($this->table->server,array('status'=>'ONLINE','user'=>$status->user,'channel'=>$status->channel,'latest_update'=>time(),'connection'=>json_encode($connection)))->where('domain',$server->domain)->execute();
				} else {
					$this->db()->update($this->table->server,array('status'=>'OFFLINE','user'=>0,'channel'=>0,'connection'=>'','latest_update'=>time()))->where('domain',$server->domain)->execute();
					if (isset($this->servers[$server->domain]) == true) unset($this->servers[$server->domain]);
				}
			}
			
			if ($server->type == 'HOSTING') {
				$service = $this->callServiceApi('GET','service/'.$server->domain);
				if ($service->success == true) {
					$service = $service->service;
					if ($service->server != null && $service->server->status == 'ONLINE') {
						$connection = new stdClass();
						$connection->domain = $service->server->domain;
						$connection->connection = $service->server->connection;
						$this->db()->update($this->table->server,array('status'=>'ONLINE','user'=>$service->server->user,'channel'=>$service->server->channel,'latest_update'=>time(),'connection'=>json_encode($connection)))->where('domain',$server->domain)->execute();
						continue;
					}
				}
				
				$this->db()->update($this->table->server,array('status'=>'OFFLINE','user'=>0,'channel'=>0,'connection'=>'','latest_update'=>time()))->where('domain',$server->domain)->execute();
				if (isset($this->servers[$server->domain]) == true) unset($this->servers[$server->domain]);
			}
		}
	}
	
	/**
	 * 아이피 차단대상자인지 확인한다.
	 *
	 * @param string $ip
	 * @return boolean $isBanned
	 */
	function isBanIp($ip=null) {
		$ip = $ip == null ? $_SERVER['REMOTE_ADDR'] : $ip;
		return $this->db()->select($this->table->ipban)->where('ip',$ip)->has();
	}
	
	/**
	 * 에러메세지를 출력한다.
	 *
	 * @param string $code 에러코드
	 * @param object $value(옵션) 에러와 관련된 데이터
	 * @param string $message(옵션) 변환된 에러메세지
	 * @return null
	 */
	function printError($code=null,$value=null,$message=null) {
		$results = new stdClass();
		$results->success = false;
		$results->message = $this->getErrorText($code);
		if ($value != null) $results->message.'<br>'.$value;
		if ($message != null) $results->message.'<br>'.$message;
		
		exit(json_encode($results,JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
	}
	
	/**
	 * 미니톡 클라이언트에서 처리해야하는 요청이 들어왔을 경우 처리하여 결과를 반환한다.
	 * 소스코드 관리를 편하게 하기 위해 각 요쳥별로 별도의 PHP 파일로 관리한다.
	 * 작업코드가 '@' 로 시작할 경우 미니톡 클라이언트 관리자를 위한 작업으로 관리자 권한이 필요하다.
	 *
	 * @param string $action 작업코드
	 * @return object $results 수행결과
	 * @see /process/index.php
	 */
	function doProcess($action) {
		$results = new stdClass();
		
		/**
		 * 미니톡 클라이언트 process 폴더에 $action 에 해당하는 파일이 있을 경우 불러온다.
		 */
		if (is_file($this->getPath().'/process/'.$action.'.php') == true) {
			INCLUDE $this->getPath().'/process/'.$action.'.php';
		}
		
		return $results;
	}
}
?>