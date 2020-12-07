/**
 * 이 파일은 미니톡 클라이언트의 일부입니다. (https://www.minitalk.io)
 *
 * 미니톡 서버프로그램과 소켓통신을 위한 함수를 정의한다.
 * 
 * @file /scripts/widget.socket.js
 * @author Arzz (arzz@arzz.com)
 * @license MIT License
 * @version 6.4.0
 * @modified 2020. 12. 7.
 */
Minitalk.socket = {
	io:null,
	connection:null,
	connecting:false,
	connected:false,
	joined:false,
	reconnectable:true,
	channel:null,
	/**
	 * 미니톡 채팅서버에 접속한다.
	 *
	 * @param boolean reconnect 재접속시도여부
	 */
	connect:function() {
		/**
		 * 서버접속을 시도중이면 접속시도를 중단한다.
		 */
		if (Minitalk.socket.connecting == true && Minitalk.socket.connected == true) return;
		
		Minitalk.socket.reconnectable = true;
		
		$.send(Minitalk.getProcessUrl("getServer"),{channel:Minitalk.channel},function(result) {
			if (result.success == true) {
				Minitalk.socket.channel = result.channel;
				Minitalk.ui.printMessage("system",Minitalk.getText("action/connecting"));
				Minitalk.socket.connecting = true;
				Minitalk.socket.io = io(result.connection.domain,{reconnection:false,path:"/minitalk",transports:["websocket"],secure:result.connection.domain.indexOf("https://") == 0});
				Minitalk.socket.connection = result.connection;
				
				/**
				 * 프로토콜 이벤트를 등록한다.
				 */
				for (var command in Minitalk.protocol) {
					Minitalk.socket.io.on(command,Minitalk.protocol[command]);
				}
			} else {
				Minitalk.ui.printError(result.error);
				Minitalk.socket.reconnect(60);
			}
		});
	},
	/**
	 * 미니톡 채팅서버에 재접속한다.
	 *
	 * @param int time 재접속할 시간
	 */
	reconnect:function(time) {
		/**
		 * 재접속이 허용되지 않았으면 접속시도를 중단한다.
		 */
		if (Minitalk.socket.reconnectable == false) return;
		
		if (time == 0) {
			Minitalk.socket.connect();
		} else {
			if (time == 60 || time == 30 || time == 10 || time <= 5) Minitalk.ui.printMessage("system",Minitalk.getText("action/reconnecting").replace("{SECOND}","<b>"+time+"</b>"));
			
			/**
			 * 동시에 서버재접속을 시도하지 않도록 1초 간격을 랜덤하게 조절한다.
			 */
			setTimeout(Minitalk.socket.reconnect,900 + Math.ceil(Math.random() * 300 % 300),--time);
		}
	},
	/**
	 * 미니톡 서버접속이 종료되었을 경우
	 */
	disconnected:function() {
		/**
		 * 접속자수를 초기화한다.
		 */
		Minitalk.ui.printMessage("error",Minitalk.getErrorText("DISCONNECTED"));
		Minitalk.ui.printUserCount(0);
		Minitalk.viewUserListSort = [];
		Minitalk.viewUserListStore = {};
		
		/**
		 * 소켓변수를 초기화한다.
		 */
		Minitalk.socket.io = null;
		Minitalk.socket.connected = false;
		Minitalk.socket.joined = false;
		
		/**
		 * 채팅위젯 UI를 비활성화한다.
		 */
		$(".userList").html("");
		$("input").attr("disabled",false);
	},
	/**
	 * 서버에 접속중인지 확인한다.
	 *
	 * @return boolean isConnected
	 */
	isConnected:function() {
		return Minitalk.socket.connecting !== true && Minitalk.socket.connected === true;
	},
	/**
	 * 접속코드를 전송한다.
	 */
	sendConnection:function() {
		/**
		 * 접속정보 객체를 생성한다.
		 */
		var join = {
			connection:Minitalk.socket.connection.connection,
			channel:Minitalk.socket.connection.channel,
			room:Minitalk.private != null ? Minitalk.private : Minitalk.channel,
			nickname:Minitalk.user.me.nickname,
			nickcon:Minitalk.user.me.nickcon,
			sns:Minitalk.user.me.sns,
			info:Minitalk.user.me.info,
			device:Minitalk.user.me.device,
			status:Minitalk.user.me.status,
			opperCode:Minitalk.opperCode,
			channelCode:Minitalk.channelCode,
			saveOpperCode:Minitalk.storage("opperCode"),
			uuid:Minitalk.user.getUuid()
		};
		Minitalk.socket.send("join",join);
	},
	/**
	 * 데이터를 전송한다.
	 *
	 * @param string protocol 프로토콜
	 * @param object data 전송할 데이터
	 */
	send:function(protocol,object) {
		if (protocol != "join" && Minitalk.socket.isConnected() === false) {
			return;
		}
		
		Minitalk.socket.io.emit(protocol,object);
	},
	/**
	 * 유저를 호출한다.
	 *
	 * @param string nickname 호출할 닉네임
	 */
	sendCall:function(nickname) {
		if (typeof Minitalk.listeners.beforeSendCall == "function") {
			if (Minitalk.listeners.beforeSendCall(Minitalk,nickname,Minitalk.user.me) == false) return false;
		}
		
		for (var i=0, loop=Minitalk.beforeSendCall.length;i<loop;i++) {
			if (typeof Minitalk.beforeSendCall[i] == "function") {
				if (Minitalk.beforeSendCall[i](Minitalk,nickname,Minitalk.user.me) == false) return false;
			}
		}
		
		Minitalk.socket.send("call",nickname);
		
		if (typeof Minitalk.listeners.onSendCall == "function") {
			Minitalk.listeners.onSendCall(Minitalk,nickname,Minitalk.user.me);
		}
		
		for (var i=0, loop=Minitalk.onSendCall.length;i<loop;i++) {
			if (typeof Minitalk.onSendCall[i] == "function") {
				Minitalk.onSendCall[i](Minitalk,nickname,Minitalk.user.me);
			}
		}
	},
	/**
	 * 유저를 개인채널에 초대한다.
	 *
	 * @param string nickname 초대할 닉네임
	 */
	sendInvite:function(nickname) {
		if (typeof Minitalk.listeners.beforeSendInvite == "function") {
			if (Minitalk.listeners.beforeSendInvite(Minitalk,nickname,Minitalk.user.me) == false) return false;
		}
		
		for (var i=0, loop=Minitalk.beforeSendInvite.length;i<loop;i++) {
			if (typeof Minitalk.beforeSendInvite[i] == "function") {
				if (Minitalk.beforeSendInvite[i](Minitalk,nickname,Minitalk.user.me) == false) return false;
			}
		}
		
		Minitalk.socket.send("invite",nickname);
		
		if (typeof Minitalk.listeners.onSendInvite == "function") {
			Minitalk.listeners.onSendInvite(Minitalk,nickname,Minitalk.user.me);
		}
		
		for (var i=0, loop=Minitalk.onSendInvite.length;i<loop;i++) {
			if (typeof Minitalk.onSendInvite[i] == "function") {
				Minitalk.onSendInvite[i](Minitalk,nickname,Minitalk.user.me);
			}
		}
	},
	/**
	 * 사용자정의 프로토콜을 전송한다.
	 *
	 * @param string protocol 프로토콜
	 * @param object data 전송할 데이터
	 * @param string channel 전송할 채널
	 * @param string nickname 전송할 닉네임
	 */
	sendProtocol:function(protocol,data,channel,nickname) {
		var channel = channel !== undefined && channel.length > 0 ? channel : (Minitalk.isPrivate == true ? Minitalk.private : Minitalk.channel);
		var nickname = nickname !== undefined && nickname.length > 0 ? nickname : null;
		
		if (protocol.search(/(connect|message|whisper|call|banip|showip|userinfo|users|log|change)/) >= 0) {
			Minitalk.ui.printMessage("error",Minitalk.getErrorText("RESERVED_PROTOCOL").replace("{PROTOCOL}","<b><u>"+protocol+"</u></b>"));
			return;
		}
		
		if (protocol !== undefined && typeof protocol == "string" && protocol.length > 0) {
			Minitalk.socket.send("protocol",{protocol:protocol,data:data,channel:channel,nickname:nickname});
		}
	}
};