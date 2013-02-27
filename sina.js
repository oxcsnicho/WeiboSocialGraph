var sinaClient = 
{
	_init: function(){
		$.ajaxSetup({
			data:{
				'access_token': $("#access_token")[0].value
			},
		statusCode: {
			404: function(){
				alert("page not found");
			}
		}
		});
		//		$.ajaxPrefilter(function (options, originalOptions, jqXHR) {
		//			options.data = $.extend(originalOptions.data, {
		//				'access_token': $("#access_token")[0].value
		//			});
		//		});
	},

	page:0,
	users:[],

	getFriends: function(){
		sc.page = 0;
		this._getFriends();
	},

	_getFriends: function(){
		sc.page++;
		$.ajax({
			url:"https://api.weibo.com/2/friendships/friends/bilateral.json",
		data: {
			'count': 200,
		'page': sc.page
		},
		success:function(sp){
			console.log(sp);
			if(sp.users.length==0)
			return;

			sc.users = sc.users.concat(sp.users);
			console.log("users.length: "+sc.users.length);

			if(sp.total_number > 150)
			setTimeout(function (){
				sc._getFriends();
			}, 1500);
		}
		});
	},

	reset:function(){
		sc.page = 0;
	},

	mapping:{},
	uid:0,

	_getOneFriendRelations: function(uid){
		sc.page++;
		sc.uid = uid;
		$.ajax({
			url:"https://api.weibo.com/2/friendships/friends/in_common.json",
			data: {
				'uid': uid,
			'count': 200,
			'page': sc.page
			},
			success:function(sp){
				console.log(sp);
				if(sp.total_number == 0)
			return;

		if(!!sc.mapping[sc.uid])
			sc.mapping[sc.uid] = sc.mapping[sc.uid].concat(sp.users);
		else
			sc.mapping[sc.uid] = sp.users;
		console.log("user "+uid+", page "+sc.page+", total " + sc.mapping[sc.uid].length);

		if(sp.total_number > 100)
			sc._getOneFriendRelations(uid);
			}
		});
	},
	
	timeout_id: 0,

	_getFriendsRelations: function(i){
		if(!sc.users || sc.users.length == 0 || i >= sc.users.length)
			return;

		console.log("["+i+" of "+sc.users.length+"]");
		sc.page = 0;
		sc._getOneFriendRelations(sc.users[i].id);

		sc.timeout_id = setTimeout(function(){
			sc._getFriendsRelations(i+1);
		}, 1500);
	},

	getFriendsRelations: function(){
		sc._getFriendsRelations(0);
	},

	clearTimeout: function(){
		window.clearTimeout(sc.timeout_id);
	}

}
var sc = sinaClient;
$(function (){
	sinaClient._init();
});
