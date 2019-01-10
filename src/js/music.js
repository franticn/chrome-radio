/**
 * 音乐电台操作相关的接口
 * author: welefen
 */
window.Music = (function(){
	var music = {
		init: function(){
			
		},
		//电台列表
		list: {
			"douban":{
				url:"http://douban.fm/radio",
				width:420,
				height:186,
				name: "豆瓣电台"
			},
			"qqmusic":{
				url:"http://music.qq.com/musicbox/player/music_player_webqq.html", 
				width:360,
				height:415,
				name: "QQ音乐"
			},
			"wangyiyunyinyue":{
				url:"http://music.1163.com/#/my/", 
				width: 1000,
				height:550,
				name: "网易云音乐"
			},
			"ximalaya":{
				url:"https://www.ximalaya.com/my/subscribed", 
				width: 1000,
				height:550,
				name: "喜马拉雅"
			}
		},
		//获取随机电台名
		getRandomMusicName: function(){
			var list = Object.getOwnPropertyNames(music.list), len = list.length;
			var r = Math.min(Math.floor(Math.random()*len), len-1);
			return list[r];
		},
		//获取电台对应的配置
		getMusic: function(){
			var name = localStorage.getItem(music.config.storageName);
			if(!(name in music.list)){
				name = "random";
			}
			if(name == 'random'){
				name = music.getRandomMusicName();
			}
			return music.list[name];
		},
		//打开一个电台
		play: function(type){
			if(type){
				localStorage.setItem(music.config.storageName, type);
			}
			var count = localStorage.getItem(music.config.sName) | 0, 
				check = localStorage.getItem(music.config.aName) | 0;
			if(count == 1){
				if(check == 0){
					localStorage.setItem(music.config.aName, 1);
					//return true;
				}else{
					localStorage.setItem(music.config.aName, 0);
					localStorage.setItem(music.config.sName, 0);
				}
			}
			music.closeOthers(function(){
				var m = music.getMusic();
				var pros = 'scrollbars=no,width='+m.width+',height='+m.height+',top=100,left=100,toolbar=no, menubar=no,scrollbars=no, resizable=no,location=no, status=no';
				localStorage.setItem(music.config.sName, 1);
				setTimeout(function(){
					window.open(m.url+'#welefen', 'popup', pros);
				}, 100)
			});
		},
		//关闭其他已经打开的电台页面
		closeOthers: function(callback){
			chrome.windows.getAll({}, function(wins){
				wins.forEach(function(win){
					var winid = win.id;
					chrome.tabs.getAllInWindow(winid, function(tabs){
						tabs.forEach(function(tab){
							chrome.tabs.sendRequest(tab.id, "close", function(response){

							});
						});
					});
				});
				callback && callback();
			});
		},
		//获取当前播放模式
		getMode: function(){
			var mode = localStorage.getItem(music.config.mName) || "play";
			return mode;
		}
	};
	var share = music.share = {
		list: {
			"weibo": {
				url: "http://service.weibo.com/share/share.php",
				name: "新浪微博",
				params: {
					pic: "",
					source: "bookmark",
					appkey: "2992571369",
					ralateUid: "",
					url: "%sourceUrl%",
					title: "%title% %sourceUrl%"
				}
			}
		},
		build: function(container, list, margin){
			list = list || Object.keys(share.list);
			margin = margin || 3;
			var html = [], i = 0;
			$.each(list, function(j, item){
				if(item in share.list){
					html[i++] = '<img style="margin-right:'+margin+'px" class="share-icon" name="'+item+'" title="分享到'+share.list[item].name+'" src="images/share/'+item+'.png"/>';
				}
			});
			$(html.join('')).appendTo($(container));
			share.delegate(container);
		},
		delegate: function(container){
			$(container).delegate('.share-icon', 'click', function(){
				share.open(this.name);
				share.imglog();
			});
		},
		imglog: function(url){
			return true;
			var iframe = document.createElement('iframe');
			url = url || "9qfce";
			iframe.style.display = 'none';
			iframe.onload = function(){
				iframe && document.body.removeChild(iframe);
				iframe = null;
			};
			iframe.src = "http://goo.gl/"+url;
			document.body.appendChild(iframe);
		},
		param: function(params){
			var result = {};
			$.each(params, function(key, value){
				result[key] = value.replace(/\%(url|title|summary|sourceUrl)\%/g, function(a, b){
					return music.config[b];
				});
			});
			return $.param(result);
		},
		open: function(name){
			var options = share.list[name];
			var url = options.url;
			if(options.params){
				url += '?' + share.param(options.params);
			}
			window.open(url);
		}
	};
	var options = music.options = {
		mode: 'play',
		init: function(){
			var mode = music.getMode();
			options.mode = mode;
			music.options.showTab(mode);
			$('.mod-options .cate li').each(function(i){
				$(this).click(function(){
					music.options.showTab(i);
					options.mode = (i == 0 ? 'play' : 'select');
					$('.pointer').animate({
						left: i === 0 ? 58 : 260
					});
				});
			});
			options.initPlayOptions();
			options.initSelectOptions();
		},
		//初始化播放模式
		initPlayOptions: function(){
			var i = 0,name, value, html = [], sname = localStorage.getItem(music.config.storageName), flag = false, checked;
			for(name in music.list){
				value = music.list[name];
				if(sname === name){
					checked = 'checked';
					flag = true;
				}else{
					checked = '';
				}
				html[i++] = ['<div class="item"><label><input type="radio" name="playMode" value="',
				             name,'"',
				             checked,
				             '/> <img src="images/icons/'+name+'.png" style="-webkit-border-radius:3px;position:relative;bottom:-2px;" /> ',
				             value.name,
				             '</label></div>'
				             ].join('');
			}
			html[i++] = ['<div class="item"><label><input type="radio" name="playMode" value="random"',
			             flag ? '' : 'checked',
			             '/> 随机播放</label></div>'
			             ].join('');
			$($('.mod-options .options')[0]).html(html.join(''));
		},
		getItemHtml: function(name, value){
			var im = ['<li name="'+name+'" class="li" style="line-height:30px;"><label><img src="images/icons/'+name+'.png" style="-webkit-border-radius:3px;position:relative;bottom:-2px;" /> ',
			             value,
			             '</label></li>'
			             ].join('');
			return im;
		},
		//初始化下拉模式
		initSelectOptions: function(){
			var ihtml = [], shtml = [], i =0, item = options.getSelectItem(), name, value;
			for(var i=0,len=item.length;i<len;i++){
				name = item[i];
				value = music.list[name];
				if (value) {
					var im = options.getItemHtml(name, value.name);
					shtml.push(im);
				}
			}
			for(var name in music.list){
				value = music.list[name];
				var im = options.getItemHtml(name, value.name);
				if(item.indexOf(name) === -1){
					ihtml.push(im);
				}
			}
			$($('.mod-options .select-mode .item')[0]).html(ihtml.join(''));
			$($('.mod-options .select-mode .item')[1]).html(shtml.join(''));
			 $(".mod-options .select-mode .item>li").wDragSort({
				 start: function(selector, li){
					 var ul = li.parent();
					 if(ul.find('>li').length === 2){
						 return false;
					 }
				 }
		            //undrager: "div#MoreDemo ul.wDragSort>li.disabled"   //不允许拖动对象
		     });
		},
		//获取已经保存的电台
		getSelectItem: function(){
			var items = localStorage.getItem(music.config.iName) || 'douban,xiami,renren,kugou,yinyue';
			items = items.split(',');
			return items;
		},
		//展现哪个模式
		showTab: function(mode){
			var d = $('.mod-options .cate li>div>div'), 
				s = $('.mod-options .cate li>span'),
				options = $('.mod-options .options'),
				i = typeof mode === 'number' ? mode : (mode === 'play' ? 0 : 1);
			$(d[i]).addClass('selected');
			$(d[1-i]).removeClass('selected');
			$(s[i]).addClass('s');
			$(s[1-i]).removeClass('s');
			$(options[i]).show();
			$(options[1-i]).hide();
			$('.pointer').animate({
				left: i === 0 ? 58 : 260
			});
		},
		//保存选项
		save: function(){
			var mode = options.mode;
			if(mode === 'play'){
				var lis = $('label>input', $('.mod-options .options')[0]);
				localStorage.setItem(music.config.mName, mode);
				lis.each(function(){
					if(this.checked){
						localStorage.setItem(music.config.storageName, this.value);
						chrome.extension.sendRequest('options', function(response) {
							//var error = chrome.extension.lastError();
							//alert(JSON.stringify(error))
							//window.open('', '_self', ''); //chrome下通过这种方式可以关闭不能关闭的窗口
							//window.close();
						});
						return false;
					}
				});
				chrome.browserAction.setPopup({popup: ""});
			}else{
				var lis = $($('.mod-options .select-mode .item')[1]).find('>li');
				var result = [];
				lis.each(function(){
					result.push($(this).attr('name'));
				});
				localStorage.setItem(music.config.iName, result.join(','));
				localStorage.setItem(music.config.mName, mode);
				chrome.browserAction.setPopup({popup: "popup.html"});
			}
			$('.message').show();
			setTimeout(function(){
				$('.message').hide();
				share.imglog("bAxkD");
			}, 1500)
		}
	};
	var background = music.background = {
		init: function(){
			//content_scripts需要musicList
			chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
				//alert(JSON.stringify(request))
				if(request == 'getMusic'){
					sendResponse(music.list);
				}else if(request == 'setItem'){
					localStorage.setItem(music.config.sName, 0);
					localStorage.setItem(music.config.aName, 0);
				}else if(request == 'options'){
					music.play();
					sendResponse({
						options: 'close'
					});
				}else if(request == 'popup'){
					music.play();
				}
			});
			//
			var type = 0;
			if(music.background.checkVersion()){
				music.background.setBadge();
				type = 1;
			}
			music.background.setClickedHandle(type);
		},
		//检测存储的版本和当前的版本关系
		checkVersion: function(){
			var cv = music.config.currentVersion | 0,
				sv = localStorage.getItem(music.config.vName) | 0;
			return cv > sv;
		},
		//在icon上添加提醒文字, 之在一级版本发生改动时添加
		setBadge: function(){
			chrome.browserAction.setBadgeText({text:"new"});
			chrome.browserAction.setBadgeBackgroundColor({color:[0, 200, 0, 100]});
		},
		//移除icon上的字体
		removeBadge: function(){
			localStorage.setItem(music.config.vName, music.config.currentVersion);
			chrome.browserAction.setBadgeText({text:""});
		},
		//设置icon点击事件
		setClickedHandle: function(type){
			var mode = music.getMode();
			if(mode != 'play'){
				if(type === 1){
					chrome.browserAction.onClicked.addListener(function(){
						if(type === 1){
							window.open("options.html");
							music.background.removeBadge();
							type = 0;
							chrome.browserAction.setPopup({popup: "popup.html"});
						}else{
							//chrome.browserAction.setPopup({popup: "popup.html"});
						}
					})
				}else{
					chrome.browserAction.setPopup({popup: "popup.html"});
				}
			}else{
				chrome.browserAction.onClicked.addListener(function(){
					if(type === 1){
						window.open("options.html");
						music.background.removeBadge();
						type = 0;
					}else{
						//music.background.removeBadge();
						music.play();
					}
				});
			}
		}
	};
	var popup = music.popup = {
		init: function(){
			var items = music.options.getSelectItem(), html = [], i = 0;
			$.each(items, function(){
				var item = music.list[this+''];
				html[i++] = '<li title="点击播放" name="'+(this+"")+'"class="diantai '+(this+'')+'"><img src="images/icons/'+this+'.png" />'+item.name+'</li>';
			})
			$('.mod-popup .list').html(html.join(''));
			$('.mod-popup .list .diantai').click(function(){
				var name = $(this).attr('name');
				Music.play(name);
			})
		}
	}
	music.config = {
		storageName: "chrome_music_name",
		sName: "chrome_music_count",
		aName: "chrome_music_check",
		vName: "chrome_music_version", //保存的版本
		mName: "chrome_music_mode", //听歌的模式
		iName: "chrome_music_select_list",
		currentVersion: 3.0, //当前版本
		
		url: "http://goo.gl/oEGAE",
		sourceUrl: "http://t.cn/aRtsS7",
		title: "Chrome音乐电台插件",
		summary: "我发现一个Chrome下一个听歌非常方便的插件，支持喜马拉雅哦，你也试试吧。"
	};
	return music;
})();