//基本制御
/*font size*/
var fontsizeA='76%';var fontsizeB='x-small';var fontsizeC='small';
	var vNum = navigator.appVersion.charAt(0);
	var bName = navigator.appName.charAt(0);
	document.writeln('<STYLE TYPE="text/css"><!--');
	if(navigator.appVersion.indexOf('Mac') > -1){basefontsize = fontsizeA;}
	else if(navigator.userAgent.indexOf('MSIE 5')>-1){basefontsize = fontsizeB;}
	else if(navigator.userAgent.indexOf('MSIE 6')>-1){basefontsize = fontsizeB;}
	else if(navigator.userAgent.indexOf('MSIE 7')>-1){basefontsize = fontsizeC;}
	else if(navigator.userAgent.indexOf('MSIE 8')>-1){basefontsize = fontsizeA;}
	else if(navigator.userAgent.indexOf('MSIE 9')>-1){basefontsize = fontsizeA;}
	else if(navigator.userAgent.indexOf('MSIE 10')>-1){basefontsize = fontsizeA;}
	else{basefontsize = bName == "M" ? fontsizeB : fontsizeA ;}
	document.writeln('body,th,td{font-size:'+basefontsize+';}');
	document.writeln('--></STYLE>');



/*グローバルメニュー*/
var ddmenu = {
	over:function(id){
		document.getElementById("ddmenu"+id).style.display = "block";
		},
	out:function(id){
		document.getElementById("ddmenu"+id).style.display = "none";
		}
	}

/*スマホ版へリンク*/
if(window.addEventListener){window.addEventListener("load",onloadFuncs,false);}
	else{window.attachEvent("onload",onloadFuncs);}
function onloadFuncs(){
	var agent = navigator.userAgent;
	if(agent.search(/iPhone/) != -1 || agent.search(/iPod/) != -1 || agent.search(/Android/) != -1){
		if(document.cookie.indexOf('ngzk_smph_sw')>-1){
			new Insertion.Before('container', '<div id="backsmph"><a href="javascript:goSMPH();">Smart Phone版</a></div>');
			}
		}
	}
function goSMPH(){
	document.cookie='ngzk_smph_sw=1; expires=Sat, 1-Jan-2000 00:00:00 GMT; domain=nogizaka46.com; path=/;';
	window.location.href=window.location.href;
	}

/*google+1ボタン*/
  window.___gcfg = {lang: 'ja'};

  (function() {
	var po = document.createElement('script'); po.type = 'text/javascript'; po.async = true;
	po.src = 'plusone.js'/*tpa=https://apis.google.com/js/plusone.js*/;
	var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(po, s);
  })();



/*PD jump*/
function jumpPD(url){if(url!=''){location.href=url;}}


