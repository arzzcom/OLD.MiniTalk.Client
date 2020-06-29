/**
 * 이 파일은 미니톡 클라이언트의 일부입니다. (https://www.minitalk.io)
 *
 * 미니톡 채팅위젯 UI 관련 이벤트를 처리한다.
 * 
 * @file /scripts/widget.ui.js
 * @author Arzz (arzz@arzz.com)
 * @license MIT License
 * @version 7.0.0
 * @modified 2020. 6. 16.
 */
Minitalk.ui = {
	resizeTimer:null,
	/**
	 * 미니톡 채팅위젯 UI를 초기화한다.
	 */
	init:function() {
		var html = [
			/**
			 * 위젯시작
			 */
			'<div data-role="frame">',
			/**
			 * 위젯헤더
			 */
			'	<header>',
			'		<h1>connecting...</h1>', // 위젯타이틀
			'		<label data-role="count"></label>', // 접속자수
			'	</header>',
			
			/**
			 * 탭바
			 */
			'	<aside>',
			'		<ul data-role="tabs"></ul>',
			'		<ul data-role="lists"></ul>',
			'	</aside>',
			
			/**
			 * 채팅영역
			 */
			'	<main></main>',
			
			/**
			 * 위젯푸터
			 */
			'	<footer>',
			'		<div data-role="tool"></div>',
			'		<div data-role="input"><input type="text" data-role="message"><button type="button"><i class="icon"></i><span>' + Minitalk.getText("button/send") + '</button></div>',
			'	</footer>',
			
			/**
			 * 위젯 끝
			 */
			'</div>',
			
			/**
			 * 사운드파일
			 */
			'<audio data-type="call">',
				'<source src="' + Minitalk.getUrl() + '/sounds/call.ogg" type="audio/ogg">',
				'<source src="' + Minitalk.getUrl() + '/sounds/call.mp3" type="audio/mpeg">',
			'</audio>',
			
			'<audio data-type="message">',
				'<source src="' + Minitalk.getUrl() + '/sounds/message.ogg" type="audio/ogg">',
				'<source src="' + Minitalk.getUrl() + '/sounds/message.mp3" type="audio/mpeg">',
			'</audio>',
			
			'<audio data-type="query">',
				'<source src="' + Minitalk.getUrl() + '/sounds/query.ogg" type="audio/ogg">',
				'<source src="' + Minitalk.getUrl() + '/sounds/query.mp3" type="audio/mpeg">',
			'</audio>'
		];
		
		var $html = $(html.join(""));
		$("body").append($html);
		
		/**
		 * 채팅입력폼 이벤트 추가
		 */
		$("div[data-role=input] > input").on("keypress",function(e) {
			if (e.keyCode == 13) {
				Minitalk.ui.sendMessage($(this).val());
				e.stopPropagation();
				e.preventDefault();
			}
		});
		
		/**
		 * 메시지 전송버튼 이벤트 추가
		 */
		$("div[data-role=input] > button").on("click",function(e) {
			if ($("div[data-role=input] > input").val().length > 0) {
				Minitalk.ui.sendMessage($("div[data-role=input] > input").val());
			}
			e.stopPropagation();
			e.preventDefault();
		});
		
		Minitalk.ui.initFrame();
		Minitalk.ui.initSection();
		Minitalk.ui.disable();
		
		/**
		 * 리사이즈 이벤트 추가
		 */
		$(window).on("resize",function() {
			if (Minitalk.ui.resizeTimer != null) {
				clearTimeout(Minitalk.ui.resizeTimer);
				Minitalk.ui.resizeTimer = null;
			}
			
			Minitalk.ui.resizeTimer = setTimeout(Minitalk.ui.initFrame,200);
		});
		
		/**
		 * 클릭이벤트를 이용하여 특수한 DOM 객체를 초기화한다.
		 */
		$(document).on("click",function(e) {
			Minitalk.ui.initSound();
			Minitalk.ui.resetToggle();
		});
	},
	/**
	 * 브라우저 사이즈가 변경되거나, UI가 최초표시될 때 UI 요소를 초기화한다.
	 */
	initFrame:function() {
		Minitalk.ui.initTabs();
	},
	/**
	 * 탭바를 출력한다.
	 */
	initTabs:function() {
		var $frame = $("div[data-role=frame]");
		var type = Minitalk.tabType == "auto" ? ($(window).width() > 400 ? "vertical" : "horizontal") : Minitalk.tabType;
		$frame.attr("data-tab-type",type);
		
		var $aside = $("aside");
		var $tabs = $("ul[data-role=tabs]",$aside);
		var $lists = $("ul[data-role=lists]",$aside);
		$tabs.empty();
		$lists.empty();
		if (Minitalk.tabType == "none") return;
		
		var limit = type == "horizontal" ? $tabs.width() : $tabs.height();
		var limiter = 0;
		var tabCount = 0;
		
		for (var index in Minitalk.tabs) {
			var tab = Minitalk.tabs[index];
			
			if (typeof tab == "string") {
				/**
				 * 기본탭을 추가한다.
				 */
				if ($.inArray(tab,["chat","users","files","boxes","configs"]) === false) continue;
				
				var $tab = $("<li>");
				var $button = $("<button>").attr("type","button").attr("data-tab",tab);
				$button.append($("<i>").addClass("icon"));
				$button.append($("<span>").html(Minitalk.getText("button/" + tab)));
				$button.on("click",function() {
					Minitalk.ui.activeTab($(this).attr("data-tab"));
				});
				
				if ($aside.attr("data-current") == tab) {
					$button.addClass("open");
				}
				
				$tab.append($button);
				$tabs.append($tab);
			} else {
				/**
				 * 사용자정의 탭을 추가한다.
				 */
			}
			
			if (type == "horizontal") {
				limiter+= $tab.outerWidth(true);
			} else {
				limiter+= $tab.outerHeight(true);
			}
			
			tabCount++;
		}
		
		/**
		 * 탭바영역을 벗어난 탭을 탭 목록으로 이동시킨다.
		 */
		if (limit < limiter) {
			var current = 0;
			var split = 0;
			
			$("li",$tabs).each(function() {
				if (type == "horizontal") {
					if (current + $(this).width() > limit) {
						return;
					}
				}
				current+= $(this).width();
				split++;
			});
			
			for (var i=loop=$("li",$tabs).length - 1;i>=split-1;i--) {
				var $tab = $("li",$tabs).eq(i).clone(true);
				
				$lists.prepend($tab);
				$("li",$tabs).eq(i).remove();
			}
			
			var $more = $("<li>");
			var $button = $("<button>").attr("type","button").attr("data-tab","more");
			$button.append($("<i>").addClass("icon"));
			$button.append($("<span>").html(Minitalk.getText("button/more")));
			$button.on("click",function(e) {
				Minitalk.ui.toggleTabs();
				e.stopImmediatePropagation();
			});
			$more.append($button);
			$tabs.append($more);
		}
		
		/**
		 * 가로형 탭인 경우, 탭 너비를 동일하게 설정한다.
		 */
		if (type == "horizontal") {
			$("li",$tabs).outerWidth((100 / $("li",$tabs).length) + "%",true);
		}
	},
	/**
	 * 설정된 탭에 따라 메인섹션을 초기화한다.
	 */
	initSection:function() {
		var firstTab = null;
		var $main = $("main");
		for (var index in Minitalk.tabs) {
			var tab = Minitalk.tabs[index];
			
			if (typeof tab == "string") {
				/**
				 * 기본탭을 추가한다.
				 */
				if ($.inArray(tab,["chat","users","files","boxes","configs"]) === false) continue;
				$main.append($("<section>").attr("data-tab",tab));
				
				firstTab = firstTab === null ? tab : firstTab;
			} else {
				/**
				 * 사용자정의 탭을 추가한다.
				 */
				if (tab.name === undefined || typeof tab.handler === "function") continue;
				$main.append($("<section>").attr("data-tab",tab.name));
				
				firstTab = firstTab === null ? tab.name : firstTab;
			}
		}
		
		if (firstTab !== null) {
			Minitalk.ui.activeTab(firstTab);
		}
	},
	/**
	 * 변경된 브라우저의 보안규칙에 따라, 사운드파일을 초기화한다.
	 */
	initSound:function() {
		var $audios = $("audio");
		$audios.each(function() {
			var audio = $(this).get(0);
			audio.muted = true;
			var promise = audio.play();
			if (promise !== undefined) {
				promise.then(function() {
				}).catch(function(e) {
				});
			}
		});
	},
	/**
	 * 미니톡 채널설정에 따른 UI설정을 초기화한다.
	 *
	 * @param object channel 채널정보
	 */
	initChannel:function() {
		var $frame = $("div[data-role=frame]");
		var channel = Minitalk.socket.channel;
		if (channel == null) return;
		
		$frame.attr("data-userlist",channel.use_userlist == true ? "TRUE" : "FALSE");
		$frame.attr("data-box",channel.use_box == true ? "TRUE" : "FALSE");
		
		$("body > div[data-role=loading]").remove();
		
		Minitalk.fireEvent("initChannel",[channel]);
	},
	/**
	 * 미니톡 위젯 UI를 활성화한다.
	 *
	 * @param boolean inputmode 메시지 입력창만 활성화할지 여부 (기본값 : false)
	 */
	enable:function(inputmode) {
		var inputmode = inputmode === true;
		
		$("div[data-role=input] > input").enable();
		$("div[data-role=input] > button").enable();
		
		if (inputmode === false) {
			$("div[data-role=frame]").attr("disabled",null);
			$("button[data-action]").enable();
			$("div[data-role|=tool] > button").enable();
		}
	},
	/**
	 * 미니톡 위젯 UI를 비활성화한다.
	 *
	 * @param boolean inputmode 메시지 입력창만 비활성화할지 여부 (기본값 : false)
	 */
	disable:function(inputmode) {
		var inputmode = inputmode === true;
		
		if (inputmode === false) $("div[data-role=input] > input").disable();
		$("div[data-role=input] > button").disable();
		
		if (inputmode === false) {
			$("div[data-role=frame]").attr("disabled","disabled");
			$("button[data-action]").disable();
			$("div[data-role|=tool] > button").disable();
			$("div[data-role=channel]").removeClass("open");
		}
	},
	/**
	 * 채널타이틀을 출력한다.
	 *
	 * @param string title
	 */
	printTitle:function(title) {
		$("h1").html(title);
	},
	/**
	 * 활성화탭을 변경한다.
	 *
	 * @param string tab 탭
	 */
	activeTab:function(tab) {
		if (Minitalk.fireEvent("beforeChangeTab",[tab]) === false) return;
		
		var $aside = $("aside");
		var $main = $("main");
		var $tabs = $("ul[data-role]",$aside);
		if ($aside.attr("data-current") == tab) return;
		
		$("button[data-tab]",$tabs).removeClass("open");
		$("button[data-tab="+tab+"]",$tabs).addClass("open");
		$("section[data-tab]",$main).removeClass("open");
		$("section[data-tab="+tab+"]",$main).addClass("open");
		
		if ($("ul[data-role=lists] > li > button.open",$aside).length > 0) {
			$("button[data-tab=more]",$tabs).addClass("open");
		}
		
		if (tab == "chat") {
			Minitalk.ui.autoScroll(true);
		}
		
		if (tab == "users") {
		}
		
		if (tab == "boxes") {
		}
		
		if (tab == "configs") {
		}
		
		$aside.attr("data-current",tab);
		
		Minitalk.fireEvent("afterChangeTab",[tab]);
	},
	/**
	 * 탭목록을 토글한다.
	 */
	toggleTabs:function() {
		var $aside = $("aside");
		$aside.toggleClass("open");
	},
	/**
	 * 개인박스을 개설한다.
	 */
	},
	/**
	 */
	},
	/**
	 * 에러메시지를 출력한다.
	 *
	 * @param string code 에러코드
	 */
	printError:function(code) {
		Minitalk.socket.reconnectable = false;
		
		var $error = $("<div>").attr("data-role","error");
		var $errorbox = $("<section>");
		$errorbox.append($("<h2>").html(Minitalk.getText("text/error")));
		$errorbox.append($("<p>").html(Minitalk.getText("error/"+code)));
		
		if (code == "NOT_FOUND_ONLINE_SERVER") {
			var $button = $("<button>").html(Minitalk.getText("action/reconnect"));
			$button.on("click",function() {
				$("div[data-role=error]").remove();
				Minitalk.socket.connect();
			});
		} else {
			var $button = $("<a>").attr("href","https://www.minitalk.io/").attr("target","_blank").html(Minitalk.getText("text/minitalk_homepage"));
		}
		
		$errorbox.append($button);
		$error.append($("<div>").append($errorbox));
		$("body").append($error);
	},
	/**
	 * 에러코드를 출력한다.
	 *
	 * @param string code 에러코드
	 */
	printErrorCode:function(code) {
		var message = Minitalk.getText("error/code/" + code);
		Minitalk.ui.printSystemMessage("error",message + "(code : " + code + ")");
	},
	/**
	 * 시스템 메시지를 출력한다.
	 *
	 * @param string type 메시지타입 (system, error, notice)
	 * @param string message 메시지
	 */
	printSystemMessage:function(type,message) {
		var $chat = $("section[data-tab=chat]");
		if ($chat.length == 0) return;
		
		var $item = $("<div>").attr("data-role","item").addClass("system").addClass(type).html(message);
		$chat.append($item);
		Minitalk.ui.autoScroll($item);
	},
	/**
	 * 접속자 이벤트 메시지를 출력한다.
	 *
	 * @param string event 이벤트명
	 * @param object user 접속자객체
	 */
	printUserMessage:function(event,user) {
		var $chat = $("section[data-tab=chat]");
		if ($chat.length == 0) return;
		
		var $item = $("<div>").attr("data-role","user").addClass(event).data("nickname",user.nickname);
		
		var $photo = $("<div>").addClass("photo");
		if (user.photo) $photo.css("backgroundImage","url("+user.photo+")");
		$item.append($photo);
		
		var $nickname = $("<div>").addClass("nickname").append(Minitalk.user.getTag(user,false));
		$item.append($nickname);
		
		var $messageBox = $("<div>").addClass("message");
		$item.append($messageBox);
		
		var $message = $("<div>");
		var $inner = $("<div>");
		$inner.append($("<span>").addClass("text").html(Minitalk.getText("action/" + event).replace("{NICKNAME}",Minitalk.user.getNickname(user,false))));
		
		$message.append($inner);
		$messageBox.append($message);
		
		$chat.append($item);
		
		Minitalk.ui.autoScroll($item);
	},
	/**
	 * 채팅메시지를 출력한다.
	 *
	 * @param string message 메시지 객체
	 * @param boolean is_log 로그메시지 여부
	 */
	printChatMessage:function(message,is_log) {
		var $chat = $("section[data-tab=chat]");
		if ($chat.length == 0) return;
		
		var $item = null;
		
		if (message.type == "message" || message.type == "whisper") {
			if (message.type == "whisper") {
				var user = typeof message.to == "string" ? {nickname:message.to,photo:""} : message.to;
			} else {
				var user = message.user;
			}
			
			if (message.from === undefined) {
				var $item = $("div[data-role=item]:last",$chat);
				if (is_log !== true && $item.hasClass("log") == true) $item = [];
				if ($item.length > 0 && $item.hasClass("chat") == true && $item.hasClass(message.type) == true && $item.data("nickname") == user.nickname && $item.position().top > 10) {
					$messageBox = $("div.message",$item);
				} else {
					$item = $("<div>").attr("data-role","item").addClass("chat").addClass(message.type).data("nickname",user.nickname);
					if (is_log === true) $item.addClass("log");
				
					var $photo = $("<div>").addClass("photo");
					if (user.photo) $photo.css("backgroundImage","url("+user.photo+")");
					$item.append($photo);
					
					if (message.type == "message") {
						var $nickname = $("<div>").addClass("nickname").append(Minitalk.user.getTag(user,false));
						$item.append($nickname);
					} else if (message.type == "whisper") {
						if (message.to.nickname == Minitalk.user.me.nickname) {
							var $nickname = $("<div>").addClass("nickname").html(Minitalk.getText("text/whisper_from").replace("{nickname}","<b></b>"));
							$("b",$nickname).replaceWith(Minitalk.user.getTag(message.user));
						} else {
							var $nickname = $("<div>").addClass("nickname").html(Minitalk.getText("text/whisper_to").replace("{nickname}","<b></b>"));
							$("b",$nickname).replaceWith(Minitalk.user.getTag(message.to));
						}
						$item.append($nickname);
					}
				
					if (user.nickname == Minitalk.user.me.nickname) $item.addClass("me");
				
					var $messageBox = $("<div>").addClass("message");
					$item.append($messageBox);
					
					$chat.append($item);
				}
			}
			
			var $message = $("<div>").attr("data-message-id",message.id);
			var $inner = $("<div>");
			$inner.append($("<span>").addClass("text").html(message.message));
			
			if (message.time === undefined) {
				$inner.append($("<span>").addClass("time").html('<i class="sending"></i>'));
			} else {
				$inner.append($("<span>").addClass("time").html($("<time>").attr("datetime",message.time).html(moment(message.time).locale(Minitalk.language).format(Minitalk.dateFormat))));
			}
			
			$message.append($inner);
			
			if (message.from === undefined) {
				$messageBox.append($message);
			} else {
				$("div[data-message-id="+message.from+"]").replaceWith($message);
			}
		}
		
		if ($item !== null) Minitalk.ui.autoScroll($item);
	},
	},
	/**
	 * 채팅창의 스크롤을 특정위치로 이동한다.
	 *
	 * @param object $item 이동할 위치의 DOM객체
	 */
	autoScroll:function($item) {
		var $chat = $("section[data-tab=chat]");
		if ($chat.length == 0) return;
		
		var $item = $item ? $item : $("div[data-role=item]:last",$chat);
		if ($item === true || $chat.prop("scrollHeight") - $chat.scrollTop() - $chat.height() < $item.outerHeight(true) + 10) {
			$chat.scrollTop($chat.prop("scrollHeight"));
		}
	},
	/**
	 * 메시지 입력창의 내용을 수정한다.
	 *
	 * @param string message 수정할 내용
	 */
	setInputVal:function(value) {
		var $input = $("div[data-role=input] > input");
		$input.focus().val(value);
	},
	/**
	 * 사운드를 재생한다.
	 *
	 * @param string sound 사운드파일명
	 * @todo 브라우저 정책에 따른 수정필요
	 */
	playSound:function(sound) {
		var $audio = $("audio[data-type="+sound+"]");
		if ($audio.length == 0) return;
		
		var audio = $audio.get(0);
		audio.muted = false;
		var promise = audio.play();
		if (promise !== undefined) {
			promise.then(function() {
			}).catch(function(e) {
			});
		}
	},
	/**
	 * 토글된 객체를 초기화한다.
	 */
	resetToggle:function() {
		$("aside").removeClass("open");
	}
};