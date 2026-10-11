const test=require('node:test'),assert=require('node:assert/strict');
test('public and admin semantic text colours meet WCAG AA contrast in both themes',async()=>{
 const {contrastPairs,contrast}=await import('../src/palette.mjs');
 for(const [theme,pairs]of Object.entries(contrastPairs))for(const [purpose,colours]of Object.entries(pairs))assert.ok(contrast(...colours)>=4.5,`${theme} ${purpose}: ${contrast(...colours).toFixed(2)}`);
 for(const background of ['#131a29','#202d48','#18243a'])assert.ok(contrast('#ffe14e',background)>=3,'Dark-mode focus visibility');
});
