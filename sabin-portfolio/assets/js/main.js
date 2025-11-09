(function(){
  const root = document.documentElement;
  const toggle = document.getElementById('theme-toggle');
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') { root.setAttribute('data-theme','dark'); if (toggle) toggle.checked = true; }
  if (saved === 'light') { root.setAttribute('data-theme','light'); if (toggle) toggle.checked = false; }

  if (toggle) toggle.addEventListener('change', ()=>{
    const theme = toggle.checked ? 'dark' : 'light';
    root.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  });

  // mobile nav
  const navToggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (navToggle && links) {
    navToggle.addEventListener('click', ()=>{
      const open = links.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.querySelectorAll('a').forEach(a=>a.addEventListener('click', ()=> links.classList.remove('open')));
  }

  // smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      const id = a.getAttribute('href');
      const el = id && id.length > 1 ? document.querySelector(id) : null;
      if (el) { e.preventDefault(); el.scrollIntoView({behavior:'smooth'}); }
    });
  });

  // Render dynamic content from localStorage configuration
  const config = (()=>{ try { return JSON.parse(localStorage.getItem('sabin_portfolio')||'null') || null; } catch{ return null; } })();
  if (config) {
    const setText = (id, txt)=>{ const el=document.getElementById(id); if (el && txt) el.textContent = txt; };
    setText('site-name', config.name);
    setText('site-tag', config.tag);
    setText('site-lead', config.lead);
    const about = document.getElementById('about-text'); if (about && config.about) about.textContent = config.about;
    const avatar = document.getElementById('avatar-img'); if (avatar && config.avatar) avatar.src = config.avatar;
    const resume = document.getElementById('resume-link'); if (resume && config.resume) resume.href = config.resume;
    // socials
    const se = document.getElementById('social-email'); if (se && config.socials?.email) se.href = config.socials.email;
    const sl = document.getElementById('social-linkedin'); if (sl && config.socials?.linkedin) sl.href = config.socials.linkedin;
    const sg = document.getElementById('social-github'); if (sg && config.socials?.github) sg.href = config.socials.github;
    // skills
    const chips = document.getElementById('skills-chips');
    if (chips && Array.isArray(config.skills) && config.skills.length) {
      chips.innerHTML = '';
      config.skills.forEach(s=>{ const span=document.createElement('span'); span.className='chip'; span.textContent=s; chips.appendChild(span); });
    }
    // projects
    const plist = document.getElementById('projects-list');
    if (plist && Array.isArray(config.projects) && config.projects.length) {
      plist.innerHTML = '';
      config.projects.forEach(p=>{
        const art = document.createElement('article'); art.className='card';
        art.innerHTML = `
          <h3>${p.title||''}</h3>
          <p>${p.desc||''}</p>
          <p class="stack">${p.stack||''}</p>
          <div class="card-actions">
            ${p.url ? `<a class="btn small" href="${p.url}" target="_blank" rel="noopener">GitHub</a>`: ''}
          </div>`;
        plist.appendChild(art);
      });
    }
  }

  // year
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // contact form validation + submit
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      let ok = true;
      const name = form.querySelector('#name');
      const email = form.querySelector('#email');
      const message = form.querySelector('#message');
      const setErr = (id, msg)=>{ const el=form.querySelector(`.error[data-for="${id}"]`); if (el) el.textContent = msg || ''; };
      setErr('name'); setErr('email'); setErr('message');
      if (!name.value.trim()) { ok=false; setErr('name','Please enter your name'); }
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value);
      if (!emailOk) { ok=false; setErr('email','Enter a valid email'); }
      if (!message.value.trim()) { ok=false; setErr('message','Type a message'); }
      if (!ok) return;

      const cfg = config || {};
      const recipient = cfg.contact?.recipient || 'shresthasabe130@gmail.com';
      const DEFAULT_FORMSPREE = 'https://formspree.io/f/mzzypakb';
      const formspree = cfg.contact?.formspree || DEFAULT_FORMSPREE;
      const web3key = cfg.contact?.web3formsKey || '';

      try {
        let resp;
        const btn = form.querySelector('button[type="submit"]');
        if (btn) btn.classList.add('loading');
        if (formspree) {
          resp = await fetch(formspree, {
            method:'POST',
            headers:{ 'Accept':'application/json', 'Content-Type':'application/json' },
            body: JSON.stringify({ name: name.value, email: email.value, message: message.value, _subject: `Portfolio Message for ${recipient}` })
          });
        } else if (web3key) {
          const fd = new FormData();
          fd.append('access_key', web3key);
          fd.append('subject', `Portfolio Message for ${recipient}`);
          fd.append('from_name', name.value);
          fd.append('from_email', email.value);
          fd.append('message', message.value);
          resp = await fetch('https://api.web3forms.com/submit', { method:'POST', body: fd });
        } else {
          alert('Email service not configured. Open admin.html and set Formspree endpoint or Web3Forms access key.');
          return;
        }
        const alertHost = (()=>{
          let host = document.getElementById('contact-alert');
          if (!host) {
            host = document.createElement('div');
            host.id = 'contact-alert';
            form.parentElement.prepend(host);
          }
          return host;
        })();

        if (resp.ok) {
          alertHost.className = 'alert';
          alertHost.textContent = 'Thanks! Your message was sent.';
          form.reset();
          // Redirect back to contact section after brief delay
          setTimeout(()=>{ window.location.hash = '#contact'; }, 400);
        } else {
          alertHost.className = 'alert error';
          alertHost.textContent = 'Failed to send. Please try again later.';
        }
      } catch(err) {
        const host = document.getElementById('contact-alert') || document.createElement('div');
        host.id = 'contact-alert'; host.className='alert error'; host.textContent='Network error. Please try again.';
        if (!host.parentElement) form.parentElement.prepend(host);
      }
      finally { const btn = form.querySelector('button[type="submit"]'); if (btn) btn.classList.remove('loading'); }
    });
  }

  // Reflect updates if admin saves from another tab
  window.addEventListener('storage', (e)=>{
    if (e.key === 'sabin_portfolio_last_updated') {
      window.location.reload();
    }
  });
})();
