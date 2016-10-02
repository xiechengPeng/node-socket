var express=require('express');
var app=express();
var http=require('http').Server(app);
var io=require('socket.io')(http);

app.get('/',function(req,res){
	res.sendFile(__dirname+'/index.html');
});

var onlineUserCount=0; //客户端连接数量
var onlineUsers={}; //统计客户端登录用户

io.on('connection',function(socket){
	socket.emit('open');  //通知客户端已连接
	
	//构造客户端对象
	var client={
		socket:socket,
		name:false
	}
	
	//监听客户端的chat message事件， 该事件由客户端触发
	//当服务端收到消息后，再把该消息播放出去，继续触发chat message事件， 然后在客户端监听chat message事件。
	socket.on('chat message',function(msg){
		console.log('chat message:'+msg);
		var obj={time:getTime()}; //构建客户端返回的对象
		
		//判断是不是第一次连接，以第一条消息作为昵称
		if(!client.name){
			onlineUserCount++;
			client.name=msg;
			obj['text']=client.name;
			obj['author']='Sys';
			obj['type']='welcome';
			obj['onlineUserCount']=onlineUserCount;	
			socket.name=client.name; //用户登录后设置socket.name， 当退出时用该标识删除该在线用户
			if(!onlineUsers.hasOwnProperty(client.name)){
				onlineUsers[client.name]=client.name;
			}
			obj['onlineUsers']=onlineUsers; //当前在线用户集合
			console.log(client.name+' login,当前在线人数:'+onlineUserCount);

			//返回欢迎语
			socket.emit('system',obj);  //发送给自己的消息
			//广播新用户已登录
			socket.broadcast.emit('system',obj); //向其他用户发送消息
		}else{
			//如果不是第一次聊天，则返回正常的聊天消息
			obj['text']=msg;
			obj['author']=client.name;
			obj['type']='message';
			console.log(client.name+' say:'+msg);

			socket.emit('chat message',obj); //发送给自己的消息 ， 如果不想打印自己发送的消息，则注释掉该句。
			socket.broadcast.emit('chat message',obj); //向其他用户发送消息 

		}
		//io.emit('chat message',msg); 
	});

	socket.on('disconnect',function(){
		onlineUserCount--;

		if(onlineUsers.hasOwnProperty(socket.name)){
			delete onlineUsers[client.name];
		}

		var obj={
			time:getTime(),
			author:'Sys',
			text:client.name,
			type:'disconnect',
			onlineUserCount:onlineUserCount,
			onlineUsers:onlineUsers
		};

		//广播用户退出
		socket.broadcast.emit('system',obj); //用户登录和退出都使用system事件播报
		console.log(client.name+' disconnect,当前在线人数:'+onlineUserCount);
	});

	
});

http.listen(3001,function(){
	console.log('server begin...');
});

var getTime=function(){
  var date = new Date();
  return date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
}

var getColor=function(){
  var colors = ['aliceblue','antiquewhite','aqua','aquamarine','pink','red','green',
                'orange','blue','blueviolet','brown','burlywood','cadetblue'];
  return colors[Math.round(Math.random() * 10000 % colors.length)];
}
