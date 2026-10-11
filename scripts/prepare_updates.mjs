import sharp from 'sharp';
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const project=fileURLToPath(new URL('../',import.meta.url));
const captions=['School trip — exploring together','School trip — group memories','Graduation — celebrating achievement','Graduation — our school community','Graduation — student performance','Graduation — on stage together','Graduation — young graduates','Graduation — proud moments','Graduation — class celebration','Graduation — certificate presentation','Graduation — celebrating a milestone','School trip — garden memories','Graduation — walking together','School trip — learning outdoors','School trip — aircraft discovery','School trip — space exploration','School trip — museum visit','School trip — museum group photo','School trip — a day of discovery','School trip — Children’s Book Library','School trip — outdoor discoveries','School trip — colourful adventures','Swimming — learning and having fun'];
const photos=readdirSync(project+'..').filter(name=>/^photo_622.*\.jpg$/.test(name)).sort();
if(photos.length!==captions.length)throw new Error('Review captions for changed photo collection');
const items=[];
for(const [i,source] of photos.entries()){
 const image=`gallery-update-${source.split('_')[1]}.webp`;
 await sharp(project+'../'+source).rotate().resize({width:1400,height:1400,fit:'inside',withoutEnlargement:true}).webp({quality:82}).toFile(project+'dist/assets/'+image);
 const {width,height}=await sharp(project+'dist/assets/'+image).metadata();
 items.push({image,caption:captions[i],category:'life',width,height});
}
const escape=value=>value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const cards=items.map(({image,caption,category,width,height})=>`<button class="full-gallery-card" data-gallery-category="${category}" data-image="assets/${image}" data-caption="${escape(caption)}"><img src="assets/${image}" alt="${escape(caption)}" loading="lazy" width="${width}" height="${height}"><span>${escape(caption)} ↗︎</span></button>`).join('');
const htmlPath=project+'scripts/site-template.html';let html=readFileSync(htmlPath,'utf8');html=html.replace(/<!-- updated-photos:start -->[\s\S]*?<!-- updated-photos:end -->/,'');html=html.replace('<div class="full-gallery">',`<div class="full-gallery"><!-- updated-photos:start -->${cards}<!-- updated-photos:end -->`).replace('Photos and visuals from our school materials.','School moments, celebrations and adventures.').replace('translations.js?v=dynamic-14','translations.js?v=photos-15');writeFileSync(htmlPath,html);
const path=project+'scripts/gallery-manifest.json';let manifest=JSON.parse(readFileSync(path,'utf8')).filter(item=>!item.image.startsWith('gallery-update-'));writeFileSync(path,JSON.stringify([...items,...manifest],null,2)+'\n');
console.log(`Prepared ${items.length} updated photos.`);

await import('./build-pages.mjs');
