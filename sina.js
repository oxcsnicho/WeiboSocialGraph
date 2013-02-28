var Console = {
	log: function(a) {
		console.log(a);
		jsLog.write(a);
	}
}

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
		sc._getFriends();
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
			Console.log(sp);
			if(sp.users.length==0)
			return;

			sc.users = sc.users.concat(sp.users);
			Console.log("users.length: "+sc.users.length);

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
	ssp: {},
	ajx: {},
	sec: 1,
	uidid:0,

	_getOneFriendRelations: function(uid){
		sc.page++;
		sc.uid = uid;
		sc.ajx={
			url:"https://api.weibo.com/2/friendships/friends/in_common.json",
			data: {
				'uid': uid,
			'count': 200,
			'page': sc.page
			},
			success:function(sp){
				Console.log(sp);
				ssp = sp;
				if(sp.total_number == 0)
				{
					sc.timeout_id = setTimeout(function(){
						sc._getFriendsRelations(sc.uidid+1);
					}, 1500);
					return;
				}

				if(!!sc.mapping[sc.uid])
					sc.mapping[sc.uid] = sc.mapping[sc.uid].concat(sp.users);
				else
					sc.mapping[sc.uid] = sp.users;
				Console.log("user "+uid+", page "+sc.page+", total " + sc.mapping[sc.uid].length);

				if(sp.total_number > 100)
					sc._getOneFriendRelations(uid);
				else
					sc.timeout_id = setTimeout(function(){
						sc._getFriendsRelations(sc.uidid+1);
					}, 1500);
			},
			error: function(a,b,c) {
				sc.sec*=1.5;
				Console.log("****call failed. retrying in "+sc.sec+" seconds");
			sc.timeout_id = setTimeout(function (){
				sc._getFriendsRelations(sc.uidid);
			}, sc.sec*1000);
			}
		};
		$.ajax(sc.ajx);
	},

	timeout_id: 0,

	_getFriendsRelations: function(i){
		if(!sc.users || sc.users.length == 0 || i >= sc.users.length)
			return;

		sc.uidid = i;
		Console.log("["+i+" of "+sc.users.length+"]");
		sc.page = 0;
		sc._getOneFriendRelations(sc.users[i].id);
	},

	getFriendsRelations: function(){
		sc._getFriendsRelations(0);
	},

	clearTimeout: function(){
		window.clearTimeout(sc.timeout_id);
	},

	generateXmlDocument: function(){
		var doc = document.implementation.createDocument(null, "gexf", null);
		doc.childNodes[0].setAttribute("version", "1.2");
		doc.childNodes[0].setAttribute("xmlns", "http://www.gexf.net/1.2draft");

		var graph = doc.createElement("graph");
		graph.setAttribute("mode", "static");
		graph.setAttribute("defaultedgetype", "directed");

		var nodes = doc.createElement("nodes");
		var edges = doc.createElement("edges");
		iid = 0;
		for(i=0;i<sc.users.length;i++)
		{
			p=doc.createElement("node");
			p.setAttribute("id", sc.users[i].id); // what???
			p.setAttribute("label", sc.users[i].name);
			nodes.appendChild(p);

			adj = sc.mapping[sc.users[i].id];
			if(!!adj)
			{
				for(j=0;j<adj.length; j++)
				{
					q = doc.createElement("edge");
					q.setAttribute("id", iid++);
					q.setAttribute("source", sc.users[i].id);
					q.setAttribute("target", adj[j].id);
					edges.appendChild(q);
				}
			}
		}
		graph.appendChild(nodes);
		graph.appendChild(edges);
		doc.childNodes[0].appendChild(graph);

		return doc;
	},

	generateXmlDocumentToTextarea: function(){
		$("textarea").val((new XMLSerializer()).serializeToString(sc.generateXmlDocument()));
	}

}
var sc = sinaClient;
$(function (){
	jsLog.init();
	sinaClient._init();
	document.getElementById("getUser").addEventListener('click', sc.getFriends);
	document.getElementById("getRelationships").addEventListener('click', sc.getFriendsRelations);
	document.getElementById("generateGraph").addEventListener('click', sc.generateXmlDocumentToTextarea);
});
