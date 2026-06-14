export const playerTemplate = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<title>__TITLE__</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  html,body{width:100%;height:100%;background:#000;color:#fff;overflow:hidden;font-family:"PingFang SC","Microsoft YaHei",sans-serif;-webkit-tap-highlight-color:transparent;user-select:none;}
  #app{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;}

  /* 场景画面 */
  #scene{width:100%;height:100%;position:relative;background:#0B0F19;overflow:hidden;cursor:pointer;}
  #scene img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;transition:opacity 0.5s ease,transform 0.5s ease;}
  #scene img.fade-out{opacity:0;transform:scale(1.02);}

  /* 场景描述（旁白覆盖） */
  .scene-overlay{position:absolute;top:0;left:0;right:0;padding:20px 24px;background:linear-gradient(180deg,rgba(0,0,0,0.7) 0%,transparent 100%);pointer-events:none;opacity:0;transition:opacity 0.4s;}
  .scene-overlay.show{opacity:1;}
  .scene-overlay p{font-size:14px;color:#9ca3af;line-height:1.6;font-style:italic;}

  /* 对话框 */
  .dialog-wrap{position:absolute;bottom:0;left:0;right:0;padding:0 16px 16px;pointer-events:none;}
  .dialog-box{background:rgba(11,15,25,0.92);backdrop-filter:blur(12px);border:1px solid rgba(0,240,255,0.15);border-radius:12px;padding:16px 20px;max-width:720px;margin:0 auto;min-height:80px;opacity:0;transform:translateY(10px);transition:opacity 0.3s,transform 0.3s;}
  .dialog-box.show{opacity:1;transform:translateY(0);}
  .dialog-speaker{color:#00F0FF;font-weight:700;font-size:14px;margin-bottom:6px;letter-spacing:0.5px;}
  .dialog-text{color:#e5e7eb;font-size:16px;line-height:1.8;font-family:"Noto Serif SC","STSong",serif;}
  .dialog-text .char{opacity:0;transition:opacity 0.04s;}
  .dialog-text .char.visible{opacity:1;}

  /* 点击提示 */
  .click-hint{position:absolute;bottom:8px;right:24px;pointer-events:none;opacity:0;transition:opacity 0.3s;}
  .click-hint.show{opacity:1;}
  .click-hint span{display:inline-block;width:8px;height:8px;border-right:2px solid rgba(255,255,255,0.4);border-bottom:2px solid rgba(255,255,255,0.4);transform:rotate(45deg);animation:hintBlink 1.2s infinite;}
  @keyframes hintBlink{0%,100%{opacity:0.3;}50%{opacity:0.8;}}

  /* 顶部状态栏 */
  #topbar{position:absolute;top:0;left:0;right:0;height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;background:linear-gradient(180deg,rgba(0,0,0,0.5) 0%,transparent 100%);z-index:10;opacity:0;transition:opacity 0.3s;}
  #topbar.show{opacity:1;}
  #topbar .counter{font-size:12px;color:#9ca3af;font-family:monospace;}
  #topbar .title-text{font-size:13px;color:#e5e7eb;font-weight:600;max-width:60%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}

  /* 页码指示器 */
  .page-dots{position:absolute;bottom:110px;left:50%;transform:translateX(-50%);display:flex;gap:4px;pointer-events:none;opacity:0;transition:opacity 0.3s;}
  .page-dots.show{opacity:0.6;}
  .page-dots .dot{width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,0.3);transition:all 0.3s;}
  .page-dots .dot.active{background:#00F0FF;width:16px;border-radius:2px;}

  /* 菜单覆盖 */
  #menuOverlay{position:absolute;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);z-index:100;display:none;flex-direction:column;align-items:center;justify-content:center;gap:16px;}
  #menuOverlay.show{display:flex;}
  #menuOverlay h2{font-size:20px;color:#e5e7eb;margin-bottom:8px;}
  #menuOverlay button{background:transparent;border:1px solid rgba(255,255,255,0.15);color:#fff;padding:10px 32px;border-radius:6px;cursor:pointer;font-size:14px;transition:all 0.2s;min-width:180px;}
  #menuOverlay button:hover{border-color:#00F0FF;color:#00F0FF;}

  /* 结局画面 */
  #ending{position:absolute;inset:0;background:rgba(0,0,0,0.95);z-index:90;display:none;flex-direction:column;align-items:center;justify-content:center;gap:12px;}
  #ending.show{display:flex;}
  #ending h2{font-size:24px;color:#e5e7eb;font-weight:300;letter-spacing:4px;}
  #ending p{font-size:13px;color:#6b7280;}

  @media(max-width:640px){
    .dialog-box{padding:12px 16px;border-radius:8px;}
    .dialog-text{font-size:15px;}
    .scene-overlay p{font-size:13px;}
    .page-dots{bottom:100px;}
  }
</style>
</head>
<body>
<div id="app">
  <div id="scene">
    <img id="bgImg" src="" alt="" />
    <div class="scene-overlay" id="sceneOverlay"><p id="sceneDesc"></p></div>
    <div class="dialog-wrap">
      <div class="dialog-box" id="dialogBox">
        <div class="dialog-speaker" id="dialogSpeaker"></div>
        <div class="dialog-text" id="dialogText"></div>
      </div>
    </div>
    <div class="click-hint" id="clickHint"><span></span></div>
    <div class="page-dots" id="pageDots"></div>
  </div>
  <div id="topbar">
    <span class="title-text" id="titleText"></span>
    <span class="counter" id="counter"></span>
  </div>
  <div id="menuOverlay">
    <h2 id="menuTitle"></h2>
    <button id="btnResume">继续阅读</button>
    <button id="btnRestart">从头开始</button>
  </div>
  <div id="ending">
    <h2>- Fin -</h2>
    <p>故事已结束</p>
    <button id="btnReplay" style="margin-top:16px;background:transparent;border:1px solid rgba(255,255,255,0.15);color:#fff;padding:10px 32px;border-radius:6px;cursor:pointer;font-size:14px;">重新阅读</button>
  </div>
</div>
<script>
(function(){
  var DATA = __COMIC_DATA__;
  var bgImg = document.getElementById('bgImg');
  var sceneOverlay = document.getElementById('sceneOverlay');
  var sceneDesc = document.getElementById('sceneDesc');
  var dialogBox = document.getElementById('dialogBox');
  var dialogSpeaker = document.getElementById('dialogSpeaker');
  var dialogText = document.getElementById('dialogText');
  var clickHint = document.getElementById('clickHint');
  var pageDots = document.getElementById('pageDots');
  var topbar = document.getElementById('topbar');
  var counter = document.getElementById('counter');
  var titleText = document.getElementById('titleText');
  var menuOverlay = document.getElementById('menuOverlay');
  var menuTitle = document.getElementById('menuTitle');
  var ending = document.getElementById('ending');

  var idx = 0;
  var typing = false;
  var typingTimer = null;
  var currentAudio = null;
  var fallbackTimer = null;
  var topbarTimer = null;
  var transitioning = false;

  titleText.textContent = DATA.meta.title;

  // Build page dots
  function buildDots(){
    var html = '';
    for(var i=0;i<DATA.panels.length;i++){
      html += '<div class="dot'+(i===idx?' active':'')+'"></div>';
    }
    pageDots.innerHTML = html;
  }

  function updateDots(){
    var dots = pageDots.querySelectorAll('.dot');
    for(var i=0;i<dots.length;i++){
      dots[i].className = 'dot' + (i===idx?' active':'');
    }
  }

  function showTopbar(){
    topbar.classList.add('show');
    clearTimeout(topbarTimer);
    topbarTimer = setTimeout(function(){ topbar.classList.remove('show'); }, 2500);
  }

  function stopAudio(){
    if(currentAudio){ currentAudio.pause(); currentAudio.currentTime=0; currentAudio=null; }
    if(window.speechSynthesis) window.speechSynthesis.cancel();
    if(fallbackTimer){ clearTimeout(fallbackTimer); fallbackTimer=null; }
  }

  function playAudioForPanel(p){
    stopAudio();
    var text = p.subtitle || '';
    if(p.audio && p.audio !== '__BROWSER_TTS__'){
      var audio = new Audio(p.audio);
      currentAudio = audio;
      audio.onended = function(){};
      audio.onerror = function(){
        // 音频加载失败，回退到浏览器 TTS
        if(text && window.speechSynthesis){
          var u = new SpeechSynthesisUtterance(text);
          u.lang = 'zh-CN'; u.rate = 0.95;
          window.speechSynthesis.speak(u);
        }
      };
      audio.play().catch(function(){
        // 播放失败，回退到浏览器 TTS
        if(text && window.speechSynthesis){
          var u = new SpeechSynthesisUtterance(text);
          u.lang = 'zh-CN'; u.rate = 0.95;
          window.speechSynthesis.speak(u);
        }
      });
    } else if(text && window.speechSynthesis){
      var u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-CN'; u.rate = 0.95;
      window.speechSynthesis.speak(u);
    }
  }

  // Typewriter effect
  function typeText(el, text, callback){
    if(typingTimer){ clearInterval(typingTimer); }
    el.innerHTML = '';
    typing = true;
    var chars = text.split('');
    var html = '';
    for(var i=0;i<chars.length;i++){
      html += '<span class="char">'+chars[i]+'</span>';
    }
    el.innerHTML = html;
    var spans = el.querySelectorAll('.char');
    var ci = 0;
    typingTimer = setInterval(function(){
      if(ci < spans.length){
        spans[ci].classList.add('visible');
        ci++;
      } else {
        clearInterval(typingTimer);
        typingTimer = null;
        typing = false;
        clickHint.classList.add('show');
        if(callback) callback();
      }
    }, 35);
  }

  function skipTyping(el, text){
    if(typingTimer){ clearInterval(typingTimer); typingTimer=null; }
    el.textContent = text;
    typing = false;
    clickHint.classList.add('show');
  }

  function showPanel(i, skipTransition){
    if(i<0||i>=DATA.panels.length) return;
    if(transitioning && !skipTransition) return;
    var p = DATA.panels[i];
    idx = i;
    counter.textContent = (i+1)+' / '+DATA.panels.length;
    updateDots();

    // Image transition
    if(!skipTransition && bgImg.src){
      transitioning = true;
      bgImg.classList.add('fade-out');
      setTimeout(function(){
        bgImg.src = p.image;
        bgImg.onload = function(){
          bgImg.classList.remove('fade-out');
          transitioning = false;
        };
        bgImg.onerror = function(){ bgImg.classList.remove('fade-out'); transitioning=false; };
      }, 300);
    } else {
      bgImg.src = p.image;
      bgImg.classList.remove('fade-out');
      transitioning = false;
    }

    // Scene description overlay
    if(p.scene_desc){
      sceneDesc.textContent = p.scene_desc;
      sceneOverlay.classList.add('show');
      setTimeout(function(){ sceneOverlay.classList.remove('show'); }, 3000);
    } else {
      sceneOverlay.classList.remove('show');
    }

    // Dialog
    clickHint.classList.remove('show');
    dialogBox.classList.add('show');
    if(p.speaker){
      dialogSpeaker.textContent = p.speaker;
      dialogSpeaker.style.display = '';
    } else {
      dialogSpeaker.textContent = '';
      dialogSpeaker.style.display = 'none';
    }

    var text = p.subtitle || '';
    typeText(dialogText, text, function(){});

    // Audio
    playAudioForPanel(p);
  }

  // Advance logic: click = skip typing or go next
  function advance(){
    if(ending.classList.contains('show')) return;
    if(menuOverlay.classList.contains('show')) return;

    if(typing){
      // Skip typewriter, show full text
      var p = DATA.panels[idx];
      skipTyping(dialogText, p.subtitle || '');
      return;
    }

    // Go to next panel
    var next = idx + 1;
    if(next < DATA.panels.length){
      showPanel(next);
    } else {
      // Story end
      stopAudio();
      dialogBox.classList.remove('show');
      clickHint.classList.remove('show');
      ending.classList.add('show');
    }
  }

  function goBack(){
    if(ending.classList.contains('show')) return;
    if(menuOverlay.classList.contains('show')) return;
    if(idx > 0){
      showPanel(idx - 1);
    }
  }

  // Click / tap
  document.getElementById('scene').addEventListener('click', function(e){
    if(e.target.closest('#menuOverlay') || e.target.closest('#ending')) return;
    advance();
  });

  // Right-click or long-press to go back
  document.getElementById('scene').addEventListener('contextmenu', function(e){
    e.preventDefault();
    goBack();
  });

  // Keyboard
  document.addEventListener('keydown', function(e){
    if(menuOverlay.classList.contains('show')){
      if(e.code==='Escape') { menuOverlay.classList.remove('show'); }
      return;
    }
    if(e.code==='Space'||e.code==='Enter'||e.code==='ArrowRight'){ e.preventDefault(); advance(); }
    if(e.code==='ArrowLeft'){ e.preventDefault(); goBack(); }
    if(e.code==='Escape'){ menuOverlay.classList.add('show'); menuTitle.textContent=DATA.meta.title; }
  });

  // Touch swipe
  var sx=0, sy=0;
  document.addEventListener('touchstart', function(e){ sx=e.changedTouches[0].screenX; sy=e.changedTouches[0].screenY; });
  document.addEventListener('touchend', function(e){
    var ex=e.changedTouches[0].screenX;
    var ey=e.changedTouches[0].screenY;
    var dx=ex-sx, dy=ey-sy;
    if(Math.abs(dx)>Math.abs(dy)){
      if(dx<-50) advance();
      else if(dx>50) goBack();
    }
  });

  // Menu buttons
  document.getElementById('btnResume').onclick = function(){ menuOverlay.classList.remove('show'); };
  document.getElementById('btnRestart').onclick = function(){ menuOverlay.classList.remove('show'); ending.classList.remove('show'); showPanel(0, true); };
  document.getElementById('btnReplay').onclick = function(){ ending.classList.remove('show'); showPanel(0, true); };

  // Show topbar on mouse move
  document.addEventListener('mousemove', showTopbar);

  // Init
  buildDots();
  showPanel(0, true);
  showTopbar();
})();
</script>
</body>
</html>`;
