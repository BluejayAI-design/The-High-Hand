"""Pixel-verified asset optimisation; never re-encode lossily or resize."""
from pathlib import Path
from io import BytesIO
import argparse
import hashlib
import json
from PIL import Image

parser=argparse.ArgumentParser()
parser.add_argument('--manifest',required=True)
parser.add_argument('--report',required=True)
args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
assets=root/'dist/assets'
jobs=json.loads(Path(args.manifest).read_text())
existing=list(assets.rglob('*.webp'))
baseline=sum(p.stat().st_size for p in assets.rglob('*') if p.is_file())
report={'baseline_art_bytes':baseline,'unused_bytes_removed':0,'existing_bytes_saved':0,'new_source_png_bytes':0,'new_lossless_webp_bytes':0,'assets':[]}
code='\n'.join(p.read_text() for suffix in ['*.mjs','*.html','*.css'] for p in (root/'dist').rglob(suffix))
for name in ['corvidae','elas','frostheart','rov','firebrand']:
    path=assets/(name+'.webp')
    if path.exists() and f'assets/{name}.webp' not in code and 'assets/${c.id}.webp' not in code:
        report['unused_bytes_removed']+=path.stat().st_size
        path.unlink()

def encode_lossless(path):
    with Image.open(path) as opened:
        opened.load()
        source=opened.convert('RGBA')
        info=opened.info.copy()
        image=opened.copy()
    buffer=BytesIO()
    image.save(buffer,format='WEBP',lossless=True,quality=100,method=6,exact=True,
               icc_profile=info.get('icc_profile',b''),exif=info.get('exif',b''),xmp=info.get('xmp',b''))
    encoded=buffer.getvalue()
    with Image.open(BytesIO(encoded)) as decoded:
        restored=decoded.convert('RGBA')
        if restored.size!=source.size or source.tobytes()!=restored.tobytes():
            raise ValueError(f'Pixel verification failed for {path.name}')
    return encoded,hashlib.sha256(source.tobytes()).hexdigest()

for path in existing:
    if not path.exists():continue
    before=path.stat().st_size
    encoded,digest=encode_lossless(path)
    if len(encoded)<before:
        path.write_bytes(encoded)
        report['existing_bytes_saved']+=before-len(encoded)
    report['assets'].append({'file':str(path.relative_to(root)),'source_bytes':before,'final_bytes':path.stat().st_size,'pixels_unchanged':True,'pixel_sha256':digest,'action':'lossless-reencode' if len(encoded)<before else 'retain-smaller-existing-file'})
    print('Verified existing:',path.name,flush=True)

for job in jobs:
    source=Path(job['source']);target=root/job['target'];target.parent.mkdir(parents=True,exist_ok=True)
    encoded,digest=encode_lossless(source)
    target.write_bytes(encoded)
    before=source.stat().st_size
    report['new_source_png_bytes']+=before
    report['new_lossless_webp_bytes']+=len(encoded)
    report['assets'].append({'file':str(target.relative_to(root)),'source_bytes':before,'final_bytes':len(encoded),'pixels_unchanged':True,'pixel_sha256':digest,'action':'lossless-from-generated-png'})
    print('Saved lossless:',target.name,flush=True)

report['final_art_bytes']=sum(p.stat().st_size for p in assets.rglob('*') if p.is_file())
report['expanded_before_optimisation_bytes']=baseline+report['new_source_png_bytes']
report['bytes_saved_vs_expanded_sources']=report['expanded_before_optimisation_bytes']-report['final_art_bytes']
Path(args.report).write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({key:value for key,value in report.items() if key!='assets'}),flush=True)
