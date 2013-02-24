var sinaClient = 
{
	_init: function(){
		$.ajaxSetup({
						data: {
										'access_token': $("#access_token")[0].value
						},
			statusCode: {
				404: function(){
					alert("page not found");
				}
			}
		});
	},

	_getFriends: function(){
var req = $.ajax({
					url:"https://api.weibo.com/2/friendships/friends/bilateral.json",
					success:function(sp){console.log(sp.users);}
	});
console.log(req.data);
}
}
