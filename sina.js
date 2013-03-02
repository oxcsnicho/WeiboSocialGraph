var Console = {
	log: function(a) {
		console.log(a);
		if("object" != typeof a)
			$("#console").html(a.valueOf()+"<br>"+$("#console").html());
	}
}

var sinaClient = 
{
	interval: 300,
	target_uid: 0,
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
	userids:[],

	getFriends: function(){
		Console.log("开始获取用户...");
		sc.page = 0;
		sc._getFriends();
	},

	_getFriends: function(){
		sc.page++;
		$.ajax({
			url:"https://api.weibo.com/2/friendships/friends/bilateral.json",
		data: {
			'uid': sc.target_uid,
			'count': 200,
		'page': sc.page
		},
		success:function(sp){
			Console.log(sp);
			if(sp.users.length==0)
			return;

			sc.users = sc.users.concat(sp.users);
			Console.log("已获取"+sc.users.length + "人");

			if(sp.total_number > 150)
			setTimeout(function (){
				sc._getFriends();
			}, sc.interval);
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
	sec: 15,
	uidid:0,

	_getOneFriendRelations: function(uid){
		sc.page++;
		sc.uid = uid;
		sc.ajx={
			url:"https://api.weibo.com/2/friendships/friends/in_common.json",
			data: {
				'suid': sc.target_uid,
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
					}, sc.interval);
					return;
				}

				if(!!sc.mapping[sc.uid])
					sc.mapping[sc.uid] = sc.mapping[sc.uid].concat(sp.users);
				else
					sc.mapping[sc.uid] = sp.users;

				Console.log("["+Math.ceil((sc.uidid + 1)/sc.users.length*100)+"%]"
						+ sc.users[sc.uidid].name+", ta有"
						+ sc.mapping[sc.uid].length+"名好友");

				if(sp.total_number > 100)
					sc._getOneFriendRelations(uid);
				else
					sc.timeout_id = setTimeout(function(){
						sc._getFriendsRelations(sc.uidid+1);
					}, sc.interval);
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
		sc.page = 0;
		sc._getOneFriendRelations(sc.users[i].id);
	},

	getFriendsRelations: function(){
		Console.log("开始获取朋友间的关系...");
		sc._getFriendsRelations(0);
	},

	abort: function(){
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
		var userids = [];
		for(i=0;i<sc.users.length;i++)
			userids.push(sc.users[i].id);
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
					if(-1 == userids.indexOf(adj[j].id))
						continue;
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
		var gexf = sc.generateXmlDocument();
		$("textarea").val((new XMLSerializer()).serializeToString(gexf));

		if(!sigInst)
			init();

		// Parse a GEXF encoded file to fill the graph
		// (requires "sigma.parseGexf.js" to be included)
		sigInst.parseGexf(gexf);

		// Draw the graph :
		sigInst.draw();
	},

	reset: function(){
		sc.users = [];
		sc.mapping = {};
		sc.page = 0;
		sc.uid = 0;
		sc.uidid = 0;
	},

	resumeFriendsRelations: function(){
		sc._getFriendsRelations(sc.uidid);
	}

}
var sc = sinaClient;
var sigInst;
function init() {
	sigInst = sigma.init(document.getElementById('sigma-example')).drawingProperties({
		defaultLabelColor: '#fff',
			defaultLabelSize: 14,
			defaultLabelBGColor: '#fff',
			defaultLabelHoverColor: '#000',
			labelThreshold: 6
	}).graphProperties({
		minNodeSize: 0.5,
	maxNodeSize: 5,
	minEdgeSize: 1,
	maxEdgeSize: 1
	}).mouseProperties({
		maxRatio: 32
	});
}

var isRunning = false;
function start() {
	  // Start the ForceAtlas2 algorithm
  // (requires "sigma.forceatlas2.js" to be included)
  sigInst.startForceAtlas2();
  isRunning = true;
}

$(function (){
	sinaClient._init();
	$("#getUser").click(sc.getFriends);
	$("#getRelationships").click(sc.getFriendsRelations);
	$("#generateGraph").click(sc.generateXmlDocumentToTextarea);
	$("#reset").click(function(){
		sc.reset();
	});
	$("#renderGraph").click(function(){
		if(!sigInst) init();
		sigInst.parseGexf("/"+$("#graph_name").val());
		sigInst.draw();
	});
	$("#access_token").focusout(function(){sc._init();});
	$("#target_uid").focusout(function(){sc.target_uid = $("#target_uid")[0].value;});
  $("#stop-layout").click(function(){
    if(isRunning){
      isRunning = false;
      sigInst.stopForceAtlas2();
      document.getElementById('stop-layout').childNodes[0].nodeValue = 'Start Layout';
    }else{
      isRunning = true;
      sigInst.startForceAtlas2();
      document.getElementById('stop-layout').childNodes[0].nodeValue = 'Stop Layout';
    }
  });
});
