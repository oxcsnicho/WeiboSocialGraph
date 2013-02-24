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
			console.log("users.length: "+sc.users.length)

			sc._getFriends();
		}
		});
	}
}
var sc = sinaClient;
$(function (){
	sinaClient._init();
});
