(function(){
  var app = document.getElementById('app');
  var sbToggle = document.getElementById('sb-toggle');
  var menuBtn = document.getElementById('menu-btn');
  var themeBtn = document.getElementById('theme-btn');
  var newChatBtn = document.getElementById('new-chat');
  var content = document.getElementById('content');
  var msgInput = document.getElementById('msg');
  var composer = document.getElementById('composer');
  var convosList = document.getElementById('convos');
  var searchInput = document.getElementById('q');

  var currentConvoId = null;

  function toggleSidebar() {
    app.classList.toggle('expanded');
  }
  if (sbToggle) sbToggle.onclick = toggleSidebar;
  if (menuBtn) menuBtn.onclick = toggleSidebar;

  function toggleTheme() {
    var cur = document.documentElement.getAttribute('data-theme') || 'light';
    var next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch(e){}
  }
  if (themeBtn) themeBtn.onclick = toggleTheme;

  function renderWelcome() {
    content.innerHTML = `
      <section class="welcome">
        <h1>What would you like to explore?</h1>
        <p class="lead">Ask a question, draft something, learn a topic, or work through a problem.</p>
        <div class="bento">
          <button class="card hero" data-p="Explain [topic] in simple language, with an everyday example.">
            <div>
              <h2>Learn something</h2>
              <p>Explain a difficult topic in simple language.</p>
            </div>
            <span style="font-weight:600;font-size:14px;">Try this →</span>
          </button>
          <button class="card c2" data-p="Help me write a clear, friendly email about [subject].">
            <h2>Write better</h2>
            <p>Help draft or improve an email.</p>
          </button>
          <button class="card" data-p="Break down [task] into manageable steps I can start on today.">
            <h2>Solve a problem</h2>
            <p>Break a complex task into manageable steps.</p>
          </button>
          <button class="card" data-p="Brainstorm ten ideas for [project] and suggest which to try first.">
            <h2>Explore ideas</h2>
            <p>Brainstorm ideas for a project.</p>
          </button>
        </div>
      </section>
    `;
  }

  content.addEventListener('click', function(e){
    var card = e.target.closest('.card[data-p]');
    if (card) {
      var p = card.getAttribute('data-p');
      msgInput.value = p;
      msgInput.focus();
      var s = p.indexOf('[');
      var en = p.indexOf(']');
      if (s > -1 && en > s) {
        msgInput.setSelectionRange(s, en + 1);
      }
    }
  });

  async function loadConversations() {
    try {
      var res = await fetch('/api/conversations');
      var list = await res.json();
      var html = '';
      list.forEach(function(c) {
        html += `<div style="padding:8px 10px;border-radius:10px;font-size:13px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" data-id="${c.id}">${c.title}</div>`;
      });
      convosList.innerHTML = html || '<div style="padding:10px;font-size:12px;color:var(--text-muted);">No chats yet.</div>';
    } catch(e) {}
  }

  if (newChatBtn) {
    newChatBtn.onclick = function() {
      currentConvoId = null;
      renderWelcome();
      msgInput.focus();
    };
  }

  renderWelcome();
  loadConversations();
})();
