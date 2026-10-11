(() => {
 const system=matchMedia('(prefers-color-scheme: dark)');let preference;
 try{preference=localStorage.getItem('guru-admin-theme');}catch{}
 const apply=theme=>{document.documentElement.dataset.theme=theme;const button=document.querySelector('#admin-theme-toggle');if(button){button.textContent=theme==='dark'?'☀ Light mode':'☾ Dark mode';button.setAttribute('aria-pressed',String(theme==='dark'));}};
 apply(['light','dark'].includes(preference)?preference:system.matches?'dark':'light');
 document.addEventListener('DOMContentLoaded',()=>{apply(document.documentElement.dataset.theme);document.querySelector('#admin-theme-toggle').addEventListener('click',()=>{preference=document.documentElement.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem('guru-admin-theme',preference);}catch{}apply(preference);});});
 system.addEventListener('change',event=>{if(!['light','dark'].includes(preference))apply(event.matches?'dark':'light');});
})();
