import {readFileSync,writeFileSync} from 'node:fs';
const source=readFileSync(new URL('./site-template.html',import.meta.url),'utf8');
const [before,rest]=source.split('<main id="main">');
const [main,after]=rest.split('</main>');
const sections=[...main.matchAll(/<section\b[\s\S]*?<\/section>/g)].map(match=>match[0]);
const section=id=>{const result=sections.find(html=>html.includes(`id="${id}"`));if(!result)throw Error(`Missing section: ${id}`);return result;};
const pages=[
 {slug:'',label:'Home',title:'Every child. Every dream.',description:'Discover Guru International School in San Chaung, Yangon. A nurturing, inquiry-based education for children ages 2–11.',image:'hero.webp'},
 {slug:'about',label:'Our story',title:'A school with heart.',description:'Get to know Guru’s story, values and approach to nurturing curious, confident children.',ids:['about','values'],image:'campus.webp'},
 {slug:'programmes',label:'Programmes',title:'Find their next adventure.',description:'Explore Guru’s early years and primary programmes, then talk with our team about the right next step for your child.',ids:['programmes'],image:'primary.webp'},
 {slug:'life',label:'Life at Guru',title:'Every day, a discovery.',description:'Explore learning, play, creativity and community in everyday life at Guru.',ids:['life'],community:true,image:'discovery.webp'},
 {slug:'campus',label:'Campus',title:'Room to learn and grow.',description:'Explore Guru’s classrooms, play spaces and facilities in San Chaung, Yangon.',ids:['campus'],image:'classroom.webp'},
 {slug:'team',label:'Our people',title:'Meet the people behind Guru.',description:'Get to know the leadership and people guiding our school community.',ids:['team'],image:'founder.webp'},
 {slug:'gallery',label:'Gallery',title:'Explore Guru in pictures.',description:'Browse school celebrations, learning spaces, graduation, trips and student activities.',ids:['gallery'],image:'gallery-update-6222095624409125897.webp'},
 {slug:'news',label:'School news',title:'Latest from Guru.',description:'Read the latest published updates and announcements from our school team.',ids:['school-news'],image:'gallery-update-6222095624409125898.webp'},
 {slug:'contact',label:'Contact us',title:'Let’s start a conversation.',description:'Ask a question, discuss a programme or request a school visit. Leave your contact details so our admissions team can reply.',ids:['visit'],image:'map.webp'}
];
const links={about:'/about',values:'/about#values',programmes:'/programmes',life:'/life',campus:'/campus',team:'/team',gallery:'/gallery',contact:'/contact',visit:'/contact#visit','school-news':'/news'};
const card=page=>`<a class="explore-card" href="/${page.slug}"><img src="assets/${page.image}" alt="" loading="lazy" width="600" height="450"><div><p class="eyebrow">${page.label}</p><h3>${page.title}</h3><p>${page.description}</p><span class="text-link">Explore ${page.label} ↗︎</span></div></a>`;
const explore=selection=>`<section class="section explore-section" id="explore"><p class="eyebrow">YOUR NEXT DISCOVERY</p><h2>There’s more to explore.</h2><div class="explore-grid">${selection.map(card).join('')}</div></section>`;
for(const page of pages){
 let head=before.replace(/<title>[\s\S]*?<\/title>/,`<title>${page.label} — Guru International School</title>`).replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${page.description}">`);
 head=head.replace('styles.css?v=dynamic-16','styles.css?v=pages-17').replace('app.js?v=dynamic-12','app.js?v=pages-13').replace('language.js?v=full-gallery-8','language.js?v=pages-9').replace('enquiry.js?v=dynamic-3','enquiry.js?v=pages-4').replace('dynamic.js?v=1','dynamic.js?v=pages-2').replace('translations.js?v=photos-15','translations.js?v=pages-16');
 head=head.replace('</head>','<script src="pages.js?v=1" defer></script></head>');
 const nav=`<nav id="nav" aria-label="Main navigation">${pages.map(item=>`<a href="/${item.slug}"${item.slug===page.slug?' aria-current="page"':''}>${item.label}</a>`).join('')}</nav>`;
 head=head.replace(/<nav\b[\s\S]*?<\/nav>/,nav);
 let body=page.slug?`<section class="page-heading section"><a class="text-link" href="/">Home ↗︎</a><p class="eyebrow">${page.label}</p><h1>${page.title}</h1><p class="large-copy">${page.description}</p></section>${page.ids.map(section).join('')}`:sections[0]+(main.match(/<div class="ticker"[\s\S]*?<\/div><\/div>/)?.[0]||'')+explore(pages.filter(item=>item.slug));
 if(page.community)body+=sections.find(html=>html.startsWith('<section class="community'));
 if(page.slug==='news')body+='<p class="section news-empty" id="news-empty">School updates will appear here when our team publishes them. Please contact us for current admissions information.</p>';
 if(page.slug)body+=`<section class="section page-cta"><div><p class="eyebrow">COME MEET GURU</p><h2>Your next chapter starts here.</h2></div><a class="button" href="/contact#visit">Visit our school ↗︎</a></section>`+explore(pages.filter(item=>item.slug&&item.slug!==page.slug).slice(page.slug==='contact'?0:2,page.slug==='contact'?3:5));
 let html=head+'<main id="main">'+body+'</main>'+after;
 html=html.replace(/href="#([\w-]+)"/g,(full,id)=>links[id]?`href="${links[id]}"`:full).replace(/(<a\b[^>]*?)href="#"([^>]*class="brand"[^>]*>)/g,'$1href="/"$2').replace('href="#" class="brand"','href="/" class="brand"').replace('class="brand" href="#"','class="brand" href="/"');
 writeFileSync(new URL(`../dist/${page.slug||'index'}.html`,import.meta.url),html);
}
console.log(`Built ${pages.length} public pages.`);
