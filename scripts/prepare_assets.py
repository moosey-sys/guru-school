"""Extract original PDF photographs and create optimized, web-ready assets."""
from pathlib import Path
import pymupdf
from PIL import Image, ImageOps
import io
root=Path(__file__).resolve().parents[2]
out=root/'guru-school/dist/assets'
pdf=pymupdf.open(root/'Guru  School profile (Update).. (2).pdf')
assets={'hero':(21,6),'discovery':(21,3),'sports':(21,2),'classroom':(12,3),'primary':(12,5),'playground':(13,2),'outdoor':(13,4),'library':(13,5),'campus':(1,3),'principal':(10,1),'founder':(8,1),'chairman':(7,1),'ceo':(6,6),'operations':(6,8),'map':(11,0)}
for name,(page,index) in assets.items():
 xref=pdf[page-1].get_images(full=True)[index][0]
 im=Image.open(io.BytesIO(pdf.extract_image(xref)['image'])).convert('RGB')
 im=ImageOps.exif_transpose(im);im.thumbnail((1600,1600))
 im.save(out/f'{name}.webp','WEBP',quality=85,method=6)
# Preserve the school crest's original transparent background.
pix=pymupdf.Pixmap(pdf,pdf[0].get_images(full=True)[2][0]); mask=pdf[0].get_images(full=True)[2][1]
if mask: pix=pymupdf.Pixmap(pix,pymupdf.Pixmap(pdf,mask))
pix.save(str(out/'crest.png'))
