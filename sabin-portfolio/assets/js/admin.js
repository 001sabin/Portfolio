(function(){
  const $ = (s)=>document.querySelector(s);
  const root = document.documentElement;
  const tgl = $('#admin-theme');
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) { root.setAttribute('data-theme', savedTheme); if (tgl) tgl.checked = savedTheme==='dark'; }
  if (tgl) tgl.addEventListener('change', ()=>{ const th=tgl.checked?'dark':'light'; root.setAttribute('data-theme',th); localStorage.setItem('theme',th); });

  const defaults = {
    name: 'Sabin Shrestha',
    tag: 'Curious. Persistent. Code-driven.',
    lead: 'Tech enthusiast focused on building reliable, user-centric software.',
    about: 'A motivated BSc.CSIT student... ',
    avatar: './assets/img/avatar.svg',
    skills: ['C#','.NET','WPF','ASP.NET MVC','HTML','CSS','JavaScript','SQL','Git & GitHub','Visual Studio','Full‑stack basics','UI/UX Principles'],
    socials: {
      email: 'mailto:shresthasabe130@gmail.com',
      linkedin: 'https://www.linkedin.com/in/sabinshrestha001/',
      github: 'https://github.com/001sabin'
    },
    resume: './assets/resume/Sabin_Shrestha_Resume.pdf',
    projects: [
      { title:'Secure File Sharing P2P', desc:'Decentralized P2P file sharing app in WPF and .NET with manual cryptography (AES‑256, RSA).', stack:'WPF • .NET • C# • AES/RSA', url:'https://github.com/001sabin/SecureFileShareP2P' },
      { title:'Tourism Management System', desc:'Full‑stack web app using ASP.NET Core MVC with booking, CRUD, and feedback system.', stack:'ASP.NET • SQL • MVC • C#', url:'https://github.com/001sabin/TourismManagementSystem' }
    ],
    contact: { recipient: 'shresthasabe130@gmail.com', formspree: '', web3formsKey: '' }
  };

  const load = ()=>{
    const data = JSON.parse(localStorage.getItem('sabin_portfolio')||'null') || defaults;
    $('#in-name').value = data.name || '';
    $('#in-tag').value = data.tag || '';
    $('#in-lead').value = data.lead || '';
    $('#in-about').value = data.about || '';
    $('#avatar-preview').src = data.avatar || '';
    $('#in-skills').value = (data.skills||[]).join(', ');
    $('#in-social-email').value = data.socials?.email?.replace('mailto:','') || '';
    $('#in-social-linkedin').value = data.socials?.linkedin || '';
    $('#in-social-github').value = data.socials?.github || '';
    $('#in-resume').value = data.resume || '';
    $('#in-projects').value = JSON.stringify(data.projects||[], null, 2);
    $('#in-recipient').value = data.contact?.recipient || '';
    $('#in-formspree').value = data.contact?.formspree || '';
    $('#in-web3forms').value = data.contact?.web3formsKey || '';
  };

  const save = ()=>{
    let projects = [];
    try { projects = JSON.parse($('#in-projects').value||'[]'); } catch(e) { alert('Projects JSON invalid'); return; }
    const data = {
      name: $('#in-name').value.trim(),
      tag: $('#in-tag').value.trim(),
      lead: $('#in-lead').value.trim(),
      about: $('#in-about').value.trim(),
      avatar: $('#avatar-preview').src,
      skills: ($('#in-skills').value||'').split(',').map(s=>s.trim()).filter(Boolean),
      socials: {
        email: 'mailto:' + ($('#in-social-email').value.trim()||'') ,
        linkedin: $('#in-social-linkedin').value.trim(),
        github: $('#in-social-github').value.trim()
      },
      resume: $('#in-resume').value.trim(),
      projects,
      contact: {
        recipient: $('#in-recipient').value.trim(),
        formspree: $('#in-formspree').value.trim(),
        web3formsKey: $('#in-web3forms').value.trim()
      }
    };
    localStorage.setItem('sabin_portfolio', JSON.stringify(data));
    // notify other tabs
    localStorage.setItem('sabin_portfolio_last_updated', String(Date.now()));
    alert('Saved. Redirecting to preview...');
    window.location.href = './index.html#hero';
  };

  const fileToDataURL = (file)=> new Promise((res,rej)=>{
    const fr = new FileReader(); fr.onload = ()=>res(fr.result); fr.onerror = rej; fr.readAsDataURL(file);
  });

  $('#in-avatar').addEventListener('change', async (e)=>{
    const f = e.target.files?.[0]; if (!f) return;
    const url = await fileToDataURL(f);
    $('#avatar-preview').src = url;
  });

  $('#btn-save').addEventListener('click', save);
  $('#btn-reset').addEventListener('click', ()=>{ localStorage.removeItem('sabin_portfolio'); load(); alert('Reset to defaults'); });

  load();

  // Password gate
  const sha256 = async (text)=>{
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  };
  const KEY='sabin_admin_hash';
  const DEFAULT='sabin-admin';
  const overlay = $('#auth-overlay');
  const err = $('#auth-error');
  const submit = $('#auth-submit');
  const pwd = $('#auth-password');

  const ensureHash = async ()=>{
    if (!localStorage.getItem(KEY)) {
      const h = await sha256(DEFAULT);
      localStorage.setItem(KEY, h);
    }
  };
  const unlockIfValid = async ()=>{
    await ensureHash();
    const expected = localStorage.getItem(KEY);
    const entered = await sha256(pwd.value || '');
    if (entered === expected) {
      overlay.classList.add('hidden');
    } else {
      err.textContent = 'Incorrect password';
    }
  };
  submit.addEventListener('click', unlockIfValid);
  pwd.addEventListener('keydown', (e)=>{ if (e.key==='Enter') unlockIfValid(); });
  // Keep overlay until unlocked
})();
