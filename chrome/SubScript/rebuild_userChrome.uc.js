// ==UserScript==
// @name           rebuild_userChrome.uc.js
// @namespace      http://space.geocities.yahoo.co.jp/gl/alice0775
// @description    UC脚本管理器
// @charset        utf-8
// @include        main
// @compatibility  Firefox 61
// @author         Alice0775
// @version        2018/04/14 00:00 de XUL
// @version        2017/11/23 23:00 Services :(
// @version        2017/11/14 21:00 use nsIFile instead nsILocalFile
// @version        2017/11/14 21:00 use Services.jsm
// @version        2016/11/28 21:00 remove "for each"
// @version        2015/12/04 24:00 Bug 1177310 [e10s] Stop using CPOWs on application shutdow
// @version        2013/03/20 24:00 force cancel default right click action for unknown modification
// @version        2013/03/22 08:02 Added "use strict"
// @version        2013/03/22 08:01 Fixed commands to work properly, even if menus had been moved into other place
// @version        2013/03/22 08:00 Fixed dragdrop target
// @version        2013/03/20 24:00 autocheck=false for script menu
// @version        2012/11/30 22:00 ubuntu12.04.1 "chromeフォルダを開く" に失敗することがあるのを修正
// ==/UserScript==
// @version        2012/09/30 09:00 ubuntu12.04.1 "chromeフォルダを開く" に失敗することがあるのを修正
// @version        2012/02/25 23:00 restart
// @version        2010/10/25 22:00 Bug 574688 adon bar
// @version        2010/07/04 00:00 nsDragAndDrop
// @version        2009/11/14 00:00 Seamonkeyに対応
// @version        2009/08/24 00:00 Namoroka3.6a2pre で右クリックでのスクリプト編集時にコンテキストメニューが表示されるのを修正
// @version        2009/04/10 00:00 Minefield3.6a1pre での動作改善
// @version        2009/03/27 00:00 nsIProcess変更
// @version        2008/02/25 00:00 reuseのデフォルト値trueに変更
// @version        2008/01/09 02:00 スクリプト保存ファイルピッカーをキャンセル時のエラー処理追加
// @version        2008/01/04 16:00 スクリプトのドロップをstatusbar-display上に変更
// @version        2007/12/15 18:00 base64データスキームの保存に対応
// @version        2007/12/15 02:00 ttp://の保存に対応
// @version        2007/12/15 01:00 メニューが表示されない場合があるのを修正
// @version        2007/12/14 23:00 saveFolderModokiがある時スクリプトのリンクをステータスバーの左1/3にドロップすることで, chrmeホルダに保存するようにした
// @version        2007/12/14 19:00 日本語のファイル名のスクリプトの有効/無効が機能していなかったのを修正
// @version        2007/12/14 17:00 スクリプトの有効/無効/編集を設定できるようにした
// @Note           使用するエディタを編集しておくこと
// @Note           Required Sub-Script/Overlay Loader v3.0.38mod( https://github.com/alice0775/userChrome.js/blob/master/userChrome.js )


  Components.utils.import('resource://gre/modules/Services.jsm');

  // 要移动的菜单列表，移动到一起统一管理。
  var movedMenus = [
	    "anoBtn_set", // AnotherButton按钮菜单
	    "addMenu-rebuild", // addMenu 的重新载入配置	
	    "toolsbar_KeyChanger_rebuild", //KeyChanger
	    "FloatingScrollbar", //浮动滚动条
		"AwesomeBookmarkbar_set", //智能书签栏配置
        //"RefererChanger",
        //"wordhighlight-toolbar-menuitem",    // WordHighlightToolbar.uc.js
        //"sw-menuitem",    // siteinfo_write
        // "easydragMODOption",    // easydrag_customMOD.uc.js
        // "JSCSS-menuitem",    // js、css、ahk 代码着色
        // "uSuper_preloader-menuitem",
        // "GrabScroll_optionsMenu",
        // "Patch_XULrubySupportMenu",
        // "menutabTooltip",
        // "PipeliningToggle",
        // "linkInNewTabForSpecifiedPageToolMenu",
        // "ieviewModokiTool",
        // "linkloadInBackgroundToolMenu",
        // "SaveFolderToolsMenu",
        // "ucjs_copysysinfo-menu"
  ];
  var userChromejs = {
// --- config ---
    editor: "\\Local\\Notepad2\\Notepad2.exe",
    // editor: "/usr/bin/gedit",
// --- config ---
    _statusDisplay: null,

    get statusDisplay() {
      if (!this._statusDisplay)
        this._statusDisplay = document.getElementById('status-bar') ||
                              document.getElementById('statusbar-display');
      return this._statusDisplay;
    },

    _addonbar: null,
    get addonbar() {
      if (!this._addonbar)
        this._addonbar = document.getElementById('addon-bar');
      return this._addonbar;
    },

    handleEvent: function(event) {
      switch(event.type) {
        case 'dragover':
          this.dragover(event);
          break;
        case 'drop':
          this.drop(event);
          break;
        case 'unload':
          this.uninit();
          break;
      }
    },

    createElement: function(localName, arryAttribute) {
      let elm = document.createElement(localName);
      for(let i = 0; i < arryAttribute.length; i++) {
        elm.setAttribute(arryAttribute[i].attr, arryAttribute[i].value);
      }
      return elm;
    },

    init: function(){
      window.addEventListener("unload",this , false);

      let ref = document.getElementById("menu_preferences");

      let menu = ref.parentNode.insertBefore(
        this.createElement("menu",
          [{attr: "id", value:"userChrome.js_menu"},
           {attr: "label", value:"UC脚本管理"},
           {attr: "accesskey", value:"u"}
          ]), ref);

      let popup = menu.appendChild(this.createElement("menupopup",
        [{attr: "id", value:"userChromejs_options"},
         {attr: "onpopupshowing", value:"userChromejs.onpopup()"},
         {attr: "context", value:""}
        ]));
      popup.appendChild(this.createElement("menuitem",
        [{attr: "id", value:"userChrome_setting"},
         {attr: "label", value:"每个新窗口都重载脚本"},
         {attr: "accesskey", value:"u"},
         {attr: "oncommand", value:"userChromejs.setting();"},
         {attr: "type", value:"checkbox"}
        ]));
      popup.appendChild(this.createElement("menuitem",
        [{attr: "label", value:"打开新窗口并重载脚本"},
         {attr: "accesskey", value:"x"},
         {attr: "oncommand", value:"userChromejs.rebuild();"}
        ]));
      /*
	  popup.appendChild(this.createElement("menuitem",
        [{attr: "label", value:"重新启动浏览器"},
         {attr: "accesskey", value:"r"},
         {attr: "oncommand", value:"userChromejs.restartApp();"}
        ]));
	  */
      popup.appendChild(this.createElement("menuitem",
        [{attr: "label", value:"打开Chrome文件夹"},
         {attr: "accesskey", value:"h"},
		 {attr: "oncommand", value:'new Components.Constructor("@mozilla.org/file/local;1","nsIFile", "initWithPath")(Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("UChrm", Components.interfaces.nsIFile).path).reveal();'}
        ]));
	 popup.appendChild(this.createElement("menuseparator",
        [{attr: "label", value:""},
         {attr: "accesskey", value:""},
         {attr: "oncommand", value:""}
        ]));
     let menuu = popup.appendChild(this.createElement("menu",
        [{attr: "id", value:"userChromejs_script_options_Menu"},
           {attr: "label", value:"用户脚本设置"},
           {attr: "accesskey", value:"s"}
        ]));
	 let popupp = menuu.appendChild(this.createElement("menupopup",
        [{attr: "id", value:"userChromejs_script_options"}
        ]));

      if ("nsDragAndDrop" in window && this.statusDisplay) {
        this.statusDisplay.addEventListener('dragover',function(event){nsDragAndDrop.dragOver(event,userChromejs.dndObserver);},true);
        this.statusDisplay.addEventListener('dragdrop',function(event){nsDragAndDrop.drop(event,userChromejs.dndObserver);},true);
      } else if(this.addonbar) {
        this.addonbar.addEventListener('dragover', this ,true);
        this.addonbar.addEventListener('drop', this ,true);
      }
      this.addPrefListener(userChromejs.readLaterPrefListener); // 登録処理
    },
    uninit: function(){
      if ("nsDragAndDrop" in window && this.statusDisplay) {
        this.statusDisplay.removeEventListener('dragover',function(event){nsDragAndDrop.dragOver(event,userChromejs.dndObserver);},true);
        this.statusDisplay.removeEventListener('dragdrop',function(event){nsDragAndDrop.drop(event,userChromejs.dndObserver);},true);
      } else if(this.addonbar) {
        this.addonbar.removeEventListener('dragover', this ,true);
        this.addonbar.removeEventListener('drop', this ,true);
      }
      this.removePrefListener(userChromejs.readLaterPrefListener); // 登録解除
    },

    dragover: function(event) {
      var dragService = Cc["@mozilla.org/widget/dragservice;1"]
                        .getService(Ci.nsIDragService);
      var dragSession = dragService.getCurrentSession();
      var supportedTypes = ["text/x-moz-url", "text/unicode", "application/x-moz-file"];
      for (let type of supportedTypes) {
        if (event.dataTransfer.types.contains(type)) {
          var data = event.dataTransfer.getData(type);
          var url = (/^\s*(.*?)\s*$/m.test(data))
                     ? RegExp.$1 : null;
          if (/(\.uc\.js|\.uc\.xul|\.uc\.xul\.txt)$/.test(url)) {
            dragSession.canDrop = true;
            event.preventDefault();
            return;
          }
        }
      }
    },

    drop: function(event) {
      var dragService = Cc["@mozilla.org/widget/dragservice;1"]
                        .getService(Ci.nsIDragService);
      var dragSession = dragService.getCurrentSession();
      var supportedTypes = ["text/x-moz-url", "text/unicode", "application/x-moz-file"];
      for (let type of supportedTypes) {
        if (event.dataTransfer.types.contains(type)) {
          var data = event.dataTransfer.getData(type);
          this.dndObserver.onDrop(event, {data: data}, dragSession);
          return;
        }
      }
    },

    dragDropSecurityCheck: function dragDropSecurityCheck(event, dragSession, url) {
      if (!url)
        return false;

      // need to do a security check to make
      // sure the source document can load the dropped URI.
      url = url.replace(/^\s*|\s*$/g, '');

      if (url.indexOf('chrome://') == 0 || url.indexOf('file://') == 0)
        return url;

      // urlSecurityCheck
      try {
        urlSecurityCheck(url, gBrowser.contentPrincipal, Ci.nsIScriptSecurityManager.DISALLOW_INHERIT_PRINCIPAL);
      }
      catch(e) {
        event.stopPropagation();
        //throw 'Drop of ' + url + ' denied.';
        return false;
      }
      return url;
    },

    dndObserver: {
      getSupportedFlavours : function () {
        var flavours = new FlavourSet();
        flavours.appendFlavour("text/x-moz-url");
        flavours.appendFlavour("text/unicode");
        flavours.appendFlavour("application/x-moz-file");
        return flavours;
      },
      onDragOver: function (evt,flavour,session){},
      onDrop: function (evt,dropdata,session){
        var fname;
        evt.stopPropagation();
        evt.preventDefault();
        if (dropdata.data!=""){
          //ステータスバーの左1/3にドロップしたか
          var target = evt.target;
          while(target){
            if(target == userChromejs.statusDisplay ||
               target == userChromejs.addonbar)
              break;
            target = target.parentNode;
          }
          if(!target) return;
          if(evt.screenX > target.boxObject.screenX + target.boxObject.width/3) return;

          //saveFolderModokiが必要
          if(!saveFolderModoki) return;
          //ドロップしたurl
          var url = (/^\s*(.*?)\s*$/m.test(dropdata.data))?RegExp.$1:null;
          //保存ホルダ nsIFile
          var folder = Components.classes["@mozilla.org/file/directory_service;1"]
                             .getService(Components.interfaces.nsIProperties)
                             .get("UChrm", Components.interfaces.nsIFile);
          //デフォルトのファイル名
          if(/(.*)\n?(.*)?/m.test(dropdata.data) )
            fname = RegExp.$2?RegExp.$2:"";
          //データスキームか
          if(/(^data:text\/javascript(;.*)?,?)|(^data:application\/x-javascript(;.*)?,?)/.test(url)){
            // urlSecurityCheck は saveFolderModoki.directSaveLinkで実施している
            saveScript(url, fname, folder);
          }else{
            //リンクか
            if(!/(^h?ttps?:\/\/)|(^ftp:\/\/)/.test(url)) return;
            if (/^h?.?.p(s?):(.+)$/i.test(url)){
              url = "http" + RegExp.$1 + ':' + RegExp.$2;
              if(!RegExp.$2) return null;
              fname = url.match(/.+\/(.+)$/)[1];
            }
            fname = fname.replace(/\.uc\.xul\.txt$/,'.uc.xul');
            //スクリプトファイルか?
            if(/(\.uc\.js|\.uc\.xul|\.uc\.xul\.txt)$/.test(url)){
              if (typeof gBrowser.dragDropSecurityCheck == 'function')
                gBrowser.dragDropSecurityCheck(evt, session, url);
              else {
                userChromejs.dragDropSecurityCheck(evt, session, url)
              }
              saveScript(url, fname, folder);
            }
          }
        }
        function saveScript(url, fname, folder){
          //ファイルピッカによりnsIFile決定
          var aFile = getFolderPath(fname, folder)
          if(!aFile) return;
          //フォルダパス
          folder = aFile.path.replace(aFile.leafName,'');
          //nsILocalFileのフォルダ
          var aFolder = saveFolderModoki.initFileWithPath(folder);
          if(!aFolder) return;
          //リンクを保存
          saveFolderModoki.directSaveLink(null, url, aFile.leafName, gBrowser.currentURI, aFolder);
        }
        function getFolderPath(fname, folder){
          //ファイルピッカにより保存先決定
          var fp = Components.classes['@mozilla.org/filepicker;1']
                    .createInstance(Components.interfaces.nsIFilePicker);
            fp.init(window, "Save script As", fp.modeSave);
            fp.appendFilter("Script Files","*.uc.js; *.uc.xul");
          if(/\.uc\.js$/.test(fname)){
            fp.defaultExtension = "uc.js";
            fp.defaultString = fname;
          }else if(/\.uc\.xul$/.test(fname)){
            fp.defaultExtension = "uc.xul";
            fp.defaultString = fname;
          }else{
            fp.defaultExtension = "uc.js";
            fp.defaultString = fname + ".uc.js";
          }
          fp.displayDirectory = folder;
          if ( fp.show() == fp.returnCancel || !fp.file ) return;
          //nsIFile
          return fp.file;
        }
      }
    },

    rebuild: function(){
      var flag = this.getPref("userChrome.enable.reuse",'bool',true);
      this.setPref("userChrome.enable.reuse",'bool',false);
      setTimeout(function(){OpenBrowserWindow();},  0);
      setTimeout(function(self,flag){self.setPref("userChrome.enable.reuse",'bool',flag);},2000,this,flag);
    },
    setting: function(){
      var flag = this.getPref("userChrome.enable.reuse",'bool',true);
      this.setPref("userChrome.enable.reuse",'bool',!flag);
    },
    onpopup: function(){
      var menu;
      var flag = this.getPref("userChrome.enable.reuse",'bool',true);
      var menuitem = document.getElementById('userChrome_setting');
      menuitem.setAttribute('checked', !flag);

      var menupopup = document.getElementById("userChromejs_options");
      for(var i = 5, len = menupopup.childNodes.length; i < len; i++){
        menupopup.removeChild(menupopup.lastChild);
      }

      var menuseparator = document.createElement('menuseparator');
      menupopup.appendChild(menuseparator);

      menuitem = document.createElement('menuitem');
      menuitem.setAttribute('label','启用/禁用 UC脚本');
      menuitem.setAttribute('oncommand','userChromejs.chgDirStat("*");');
      menuitem.setAttribute('onclick','userChromejs.clickDirMenuitem(event,true);');
      menuitem.setAttribute('type','checkbox');
      menuitem.setAttribute('checked', !userChrome_js.dirDisable['*']);
      menuitem.dirName = '*';
      menupopup.appendChild(menuitem);

      for(var j = 0, lenj = userChrome_js.arrSubdir.length; j < lenj; j++){
        var dirName = userChrome_js.arrSubdir[j] == "" ? "root" : userChrome_js.arrSubdir[j];
        var flg = false;
        for(var i = 0, len = userChrome_js.scripts.length; i < len; i++){
          var script = userChrome_js.scripts[i];
          if(script.dir != dirName) continue;
          flg = true;
          break;
        }
        if(!flg){
          for(var i = 0, len = userChrome_js.overlays.length; i < len; i++){
            var script = userChrome_js.overlays[i];
            if(script.dir != dirName) continue;
            flg = true;
            break;
          }
        }
        if(!flg) continue;


        menu = document.createElement('menu');
        menu.setAttribute('label','chrome/' + (dirName=="root"?"":dirName) );
        menu.setAttribute('onclick','userChromejs.clickDirMenu(event);');
        if(userChrome_js.dirDisable[dirName])
          menu.setAttribute('style', 'font-style:italic;');
        menu.dirName = dirName;

        menupopup = document.createElement('menupopup');
        menupopup.setAttribute('onpopupshowing','event.stopPropagation();');

        menuitem = document.createElement('menuitem');
        menuitem.setAttribute('label','启用/禁用 ' + (dirName=="root"?"":dirName) + ' 下所有脚本');
        menuitem.setAttribute('oncommand', 'userChromejs.chgDirStat(this.dirName);');
        menuitem.setAttribute('onclick','userChromejs.clickDirMenuitem(event);');
        menuitem.setAttribute('type', 'checkbox');
        menuitem.setAttribute('checked', !userChrome_js.dirDisable[dirName]);
        menuitem.dirName = dirName;
        menupopup.appendChild(menuitem);

        menuseparator = document.createElement('menuseparator');
        menupopup.appendChild(menuseparator);

        var flg = false;
        for(var i = 0, len = userChrome_js.scripts.length; i < len; i++){
          var script = userChrome_js.scripts[i];
          if(script.dir != dirName) continue;
            flg = true;
            menuitem = document.createElement('menuitem');
            menuitem.setAttribute('label',script.filename);
            menuitem.setAttribute('oncommand','userChromejs.chgScriptStat(this.script.filename);');
            menuitem.setAttribute('onclick','userChromejs.clickScriptMenu(event);');
            menuitem.setAttribute('type','checkbox');
            menuitem.setAttribute('autocheck','false');
            menuitem.setAttribute('checked',!userChrome_js.scriptDisable[script.filename] );
            if(script.description)
              menuitem.setAttribute('tooltiptext',script.description);
            menuitem.script = script;
            menupopup.appendChild(menuitem);
        }
        for(var i = 0, len = userChrome_js.overlays.length; i < len; i++){
          var script = userChrome_js.overlays[i];
          if(script.dir != dirName) continue;
            if(flg){
              menuseparator = document.createElement('menuseparator');
              menupopup.appendChild(menuseparator);
            }
            flg = false;
            menuitem = document.createElement('menuitem');
            menuitem.setAttribute('label',script.filename);
            menuitem.setAttribute('oncommand','userChromejs.chgScriptStat(this.script.filename);');
            menuitem.setAttribute('onclick','userChromejs.clickScriptMenu(event);');
            menuitem.setAttribute('type','checkbox');
            menuitem.setAttribute('autocheck','false');
            menuitem.setAttribute('checked',!userChrome_js.scriptDisable[script.filename] );
            if(script.description)
              menuitem.setAttribute('tooltiptext',script.description);
            menuitem.script = script;
            menupopup.appendChild(menuitem);
        }
        menu.appendChild(menupopup);
        menupopup = document.getElementById("userChromejs_options");
        menupopup.appendChild(menu);
      }
    },

    clickDirMenu: function(event){
      if(event.button == 1 || event.button == 2){
        event.stopPropagation();
        event.preventDefault();
        userChromejs.chgDirStat(event.target.dirName);
        if(event.target.firstChild && event.target.firstChild.firstChild)
          event.target.firstChild.firstChild.setAttribute('checked',!userChrome_js.dirDisable[event.target.dirName] );
        if(!!userChrome_js.dirDisable[event.target.dirName])
          event.target.setAttribute('style', 'font-style:italic;');
        else
          event.target.removeAttribute('style');
      }
    },

    clickDirMenuitem: function(event,stop){
      if(event.button == 1 || event.button == 2){
        event.stopPropagation();
        event.preventDefault();
        userChromejs.chgDirStat(event.target.dirName);
        event.target.setAttribute('checked',!userChrome_js.dirDisable[event.target.dirName] );
        if(!stop && !!userChrome_js.dirDisable[event.target.dirName])
          event.target.parentNode.parentNode.setAttribute('style', 'font-style:italic;');
        else
          event.target.parentNode.parentNode.removeAttribute('style');
      }
    },

    clickScriptMenu: function(event){
      if(event.button==1){
        event.stopPropagation();
        event.preventDefault();
        userChromejs.chgScriptStat(event.target.script.filename);
        event.target.setAttribute('checked',!userChrome_js.scriptDisable[event.target.script.filename] );
      }else if(event.button==2){
        event.stopPropagation();
        event.preventDefault();
        this.launchEditor(event.target.script);
      }
    },

    launchEditor: function(aScript){
      var editor = this.editor;
      var UI = Components.classes['@mozilla.org/intl/scriptableunicodeconverter'].createInstance(Components.interfaces.nsIScriptableUnicodeConverter);

      var platform = window.navigator.platform.toLowerCase();
      if(platform.indexOf('win') > -1){
        UI.charset = 'GB2312';
      }else{
        UI.charset = 'UTF-8';
      }

      var path = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService).getProtocolHandler('file').QueryInterface(Components.interfaces.nsIFileProtocolHandler).getFileFromURLSpec(aScript.url).path
      path = UI.ConvertFromUnicode(path);

      var appfile = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsIFile);
      appfile.initWithPath(editor);
      var process = Components.classes['@mozilla.org/process/util;1'].createInstance(Components.interfaces.nsIProcess);
      process.init(appfile);
      process.run(false, [path], 1, {});
    },

    chgDirStat: function(adirName){
      var s = userChromejs.getPref("userChrome.disable.directory", "str", "");
      if(!userChrome_js.dirDisable[adirName]){
        s = (s+',').replace(adirName+',','') + adirName+',';
      }else{
        s = (s+',').replace(adirName+',','');
      }
      s = s.replace(/,,/g,',').replace(/^,/,'');
      userChromejs.setPref("userChrome.disable.directory", "str", s);
      userChrome_js.dirDisable = this.restoreState(s.split(','));
    },

    chgScriptStat: function(afilename){
      var s = userChromejs.getPref("userChrome.disable.script", "str", "");
      if(!userChrome_js.scriptDisable[afilename]){
        s = (s+',').replace(afilename+',','') + afilename+',';
      }else{
        s = (s+',').replace(afilename+',','');
      }
      s = s.replace(/,,/g,',').replace(/^,/,'');
      userChromejs.setPref("userChrome.disable.script", "str", s);
      userChrome_js.scriptDisable = this.restoreState(s.split(','));
    },

    restoreState: function (arr){
      var disable = [];
      for(var i = 0,len = arr.length; i < len; i++)
        disable[arr[i]] = true;
      return disable;
    },


    //prefを読み込み
    getPref: function(aPrefString, aPrefType, aDefault){
      var xpPref = Services.prefs;
      try {
        switch (aPrefType){
          case 'complex':
            return xpPref.getComplexValue(aPrefString, Components.interfaces.nsIFile); break;
          case 'str':
            return unescape(xpPref.getCharPref(aPrefString).toString()); break;
          case 'int':
            return xpPref.getIntPref(aPrefString); break;
          case 'bool':
          default:
            return xpPref.getBoolPref(aPrefString); break;
        }
        } catch(e) {}
      return aDefault;
    },
    //prefを書き込み
    setPref: function(aPrefString, aPrefType, aValue){
      var xpPref = Services.prefs;
      try {
        switch (aPrefType){
          case 'complex':
            return xpPref.setComplexValue(aPrefString, Components.interfaces.nsIFile, aValue); break;
          case 'str':
            return xpPref.setCharPref(aPrefString, escape(aValue)); break;
          case 'int':
            aValue = parseInt(aValue);
            return xpPref.setIntPref(aPrefString, aValue);  break;
          case 'bool':
          default:
            return xpPref.setBoolPref(aPrefString, aValue); break;
        }
        } catch(e) {}
      return null;
    },
    // 監視を開始する
    addPrefListener: function(aObserver) {
        try {
            var pbi = Services.prefs;
            pbi.addObserver(aObserver.domain, aObserver, false);
        } catch(e) {}
    },

    // 監視を終了する
    removePrefListener: function(aObserver) {
        try {
            var pbi =  Services.prefs;
            pbi.removeObserver(aObserver.domain, aObserver);
        } catch(e) {}
    },

    readLaterPrefListener:{
        domain  : 'userChrome.disable',
            //"userChrome.disable"という名前の設定が変更された場合全てで処理を行う

        observe : function(aSubject, aTopic, aPrefstring) {
            if (aTopic == 'nsPref:changed') {
                // 設定が変更された時の処理
                setTimeout(function(){
                  var s = userChromejs.getPref("userChrome.disable.directory", "str", "");
                  userChrome_js.dirDisable = userChromejs.restoreState(s.split(','));
                  s = userChromejs.getPref("userChrome.disable.script", "str", "");
                  userChrome_js.scriptDisable = userChromejs.restoreState(s.split(','));
                }, 0);
            }
        }
    },

    restartApp: function() {
      if ("BrowserUtils" in window && typeof BrowserUtils.restartApplication == "function") {
        Components.classes["@mozilla.org/xre/app-info;1"]
                  .getService(Components.interfaces.nsIXULRuntime).invalidateCachesOnRestart();
        BrowserUtils.restartApplication();
        return;
      }

      const appStartup = Components.classes["@mozilla.org/toolkit/app-startup;1"]
                        .getService(Components.interfaces.nsIAppStartup);

      // Notify all windows that an application quit has been requested.
      var os = Components.classes["@mozilla.org/observer-service;1"]
                         .getService(Components.interfaces.nsIObserverService);
      var cancelQuit = Components.classes["@mozilla.org/supports-PRBool;1"]
                                 .createInstance(Components.interfaces.nsISupportsPRBool);
      os.notifyObservers(cancelQuit, "quit-application-requested", null);

      // Something aborted the quit process.
      if (cancelQuit.data)
        return;

      // Notify all windows that an application quit has been granted.
      os.notifyObservers(null, "quit-application-granted", null);

      // Enumerate all windows and call shutdown handlers
      var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                         .getService(Components.interfaces.nsIWindowMediator);
      var windows = wm.getEnumerator(null);
      var win;
      while (windows.hasMoreElements()) {
        win = windows.getNext();
        if (("tryToClose" in win) && !win.tryToClose())
          return;
      }
      let XRE = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime);
      if (typeof XRE.invalidateCachesOnRestart == "function")
        XRE.invalidateCachesOnRestart();
      appStartup.quit(appStartup.eRestart | appStartup.eAttemptQuit);
    }
  }
  userChromejs.init();

  //メニューが長くなりすぎるので, あまり使わないメニューを"userChrome.jsの各スクリプトの設定"の下に移動させる
  var userChromejsScriptOptionsMenu = {
    //あまり使わないメニューのリスト
    menues: movedMenus,
    interval: 500, //0.5秒間隔
    maxcount: 50,   //最大50回までトライ
    count: 0,
    timer: null,

    run: function() {
      //DOMの構築が完了するのを待ってからメニューを移動させる(5秒間隔で最大50回までトライ)
      this.timer = setInterval(function(self){
        if (++self.count > self.maxcount || self.moveMenu())
          clearInterval(self.timer);
      }, this.interval, this);
    },

    moveMenu: function(){
      var menupopup = document.getElementById('userChromejs_script_options');
      if (!menupopup)
        return false;
      var i = 0;
      while (i < this.menues.length) {
        var menu = document.getElementById(this.menues[i])
        if (menu) {
          setTimeout(function(menupopup, menu){menupopup.appendChild(menu);}, 100, menupopup, menu);
          this.menues.splice(i, 1);
          continue;
        }
        i++;
      }
      return this.menues.length == 0 ? true : false;
    },
  }
  userChromejsScriptOptionsMenu.run();
