"""Publish the supplied folder pictures and remaining school-profile photographs."""
from pathlib import Path
from PIL import Image,ImageOps
import pymupdf,io,json
root=Path(__file__).resolve().parents[2];out=root/'guru-school/dist/assets';pdf=pymupdf.open(root/'Guru  School profile (Update).. (2).pdf')
items=[]
photos=[(1,3,'School entrance','campus'),(2,0,'Together at Guru','life'),(4,1,'School community','life'),(12,2,'Preschool learning space','campus'),(12,3,'Colourful preschool classroom','campus'),(12,4,'Primary learning space','campus'),(12,5,'Bright primary classroom','campus'),(13,2,'Indoor play area','campus'),(13,3,'Campus building','campus'),(13,4,'Outdoor play area','campus'),(13,5,'Library time','life'),(19,1,'Creative activities','learning'),(19,2,'Sports and movement','life'),(19,3,'Learning together','learning'),(20,0,'Child-centred learning','learning'),(21,2,'Outdoor student activities','life'),(21,3,'Hands-on discovery','learning'),(21,4,'Classroom moments','learning'),(21,5,'Exploring new ideas','learning'),(21,6,'Drawing and concentration','learning'),(22,6,'Parent engagement — profile image','community'),(22,7,'Community conversations — profile image','community')]
for page,index,caption,category in photos:
 name=f'gallery-p{page}-{index}.webp';data=pdf.extract_image(pdf[page-1].get_images(full=True)[index][0]);im=Image.open(io.BytesIO(data['image'])).convert('RGB');im.thumbnail((1400,1400));im.save(out/name,'WEBP',quality=84,method=6);items.append({'image':name,'caption':caption,'category':category})
folder_captions={'9260':'Primary classroom — supplied photo','9261':'School welcome area','9262':'Guru entrance — supplied photo','9263':'School information poster','9264':'Classroom facilities — supplied photo'}
for p in sorted(root.glob('*.jpg')):
 code=p.stem.split('_')[-2][-4:];name=f'gallery-folder-{code}.webp';im=ImageOps.exif_transpose(Image.open(p)).convert('RGB');im.thumbnail((1400,1400));im.save(out/name,'WEBP',quality=86,method=6);items.append({'image':name,'caption':folder_captions[code],'category':'information' if code=='9263' else 'campus'})
(root/'guru-school/scripts/gallery-manifest.json').write_text(json.dumps(items,indent=2))
print(f'Prepared {len(items)} gallery images.')
