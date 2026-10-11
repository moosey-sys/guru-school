(() => {
 let content=null;
 const local=(item,key)=>document.documentElement.lang==='my'&&item[`${key}My`]?item[`${key}My`]:item[key];
 const element=(tag,text,className)=>{const node=document.createElement(tag);if(text)node.textContent=text;if(className)node.className=className;return node;};
 function render(){
  if(!content)return;
  document.querySelector('.announcement>span').textContent=local(content,'announcement');
  const news=document.querySelector('#school-news'),list=news.querySelector('.news-grid');list.replaceChildren();news.hidden=!content.news.filter(x=>x.published).length;
  content.news.filter(x=>x.published).slice().sort((a,b)=>b.date.localeCompare(a.date)).forEach(item=>{const article=element('article',null,'news-card');const time=element('time',item.date);time.dateTime=item.date;article.append(time,element('h3',local(item,'title')),element('p',local(item,'body')));list.append(article);});
  const gallery=document.querySelector('#gallery .full-gallery-grid')||document.querySelector('#gallery [data-gallery-category]')?.parentElement;
  gallery?.querySelectorAll('[data-managed-photo]').forEach(card=>card.remove());
  content.photos.filter(x=>x.published).forEach(photo=>{const card=element('button',null,'campus-card'),image=element('img');const caption=local(photo,'caption');card.type='button';card.dataset.managedPhoto=photo.id;card.dataset.galleryCategory=photo.category==='student-life'?'life':photo.category;image.src=`/api/media?id=${photo.id}`;image.alt=caption;image.loading='lazy';card.append(image,element('span',`${caption} ↗︎`));card.addEventListener('click',()=>{const dialog=document.querySelector('#lightbox');dialog.querySelector('img').src=image.src;dialog.querySelector('img').alt=caption;dialog.querySelector('p').textContent=caption;dialog.showModal();});gallery?.prepend(card);});
  document.dispatchEvent(new CustomEvent('guru-gallery-update'));
 }
 async function load(){try{const response=await fetch('/api/content',{cache:'no-store'});if(!response.ok)return;content=(await response.json()).content;render();}catch{/* Retain the static school content if the connection is unavailable. */}}
 document.addEventListener('guru-language-change',render);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)load();});
 setInterval(()=>{if(!document.hidden)load();},60000);
 load();
})();
