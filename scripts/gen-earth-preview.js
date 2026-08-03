// 生成 earth-preview.html：把 v6 贴图 base64 内嵌，浏览器直接打开即可预览球体效果
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')

// 对比多个版本贴图
const versions = [
  { name: 'v7', file: 'earth_texture_cartoon_v7.jpg' },
  { name: 'v8', file: 'earth_texture_cartoon_v8.jpg' }
]
const dataUrls = versions.map((v) => ({
  name: v.name,
  url: `data:image/jpeg;base64,${fs.readFileSync(path.join(ROOT, 'resources', v.file)).toString('base64')}`
}))

const html = `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<title>Earth v6 Preview</title>
<style>
  body { margin:0; background:#0b1026; display:flex; flex-direction:column; align-items:center; font-family:sans-serif; color:#fff; }
  h3 { margin:12px; }
  canvas { border-radius:50%; box-shadow:0 0 40px rgba(90,150,255,0.4); }
  .row { display:flex; gap:24px; flex-wrap:wrap; justify-content:center; }
  .col { text-align:center; }
  .tip { margin:10px; font-size:13px; color:#90caf9; }
</style>
</head>
<body>
<h3>🌍 地球贴图对比预览（点击拖动旋转）</h3>
<div class="row">
  <div class="col"><div id="g0"></div><div class="tip">v7</div></div>
  <div class="col"><div id="g1"></div><div class="tip">v8</div></div>
</div>
<script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script>
<script>
const dataUrls = ${JSON.stringify(dataUrls)};
function makeGlobe(container, tex){
  const size = 360;
  const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
  renderer.setSize(size, size);
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0,0,3.4);
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.1);
  sun.position.set(3,2,4);
  scene.add(sun);
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1,64,64), new THREE.MeshPhongMaterial({map:tex}));
  const group = new THREE.Group();
  group.add(mesh);
  scene.add(group);
  // 云层
  const cloudC = document.createElement('canvas'); cloudC.width=512; cloudC.height=256;
  const ctx = cloudC.getContext('2d'); ctx.fillStyle='#000'; ctx.fillRect(0,0,512,256);
  for(let i=0;i<200;i++){const x=Math.random()*512, y=Math.random()*256, r=6+Math.random()*40;
    const g=ctx.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,'rgba(255,255,255,0.5)'); g.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();}
  const cloudTex = new THREE.CanvasTexture(cloudC); cloudTex.wrapS = THREE.RepeatWrapping;
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(1.015,64,64), new THREE.MeshBasicMaterial({map:cloudTex, transparent:true, opacity:0.5, depthWrite:false}));
  group.add(clouds);
  // 拖动旋转
  let dragging=false, lx=0, ly=0;
  group.rotation.x = -0.7; // 初始倾斜展示极点
  renderer.domElement.addEventListener('mousedown', e=>{dragging=true; lx=e.clientX; ly=e.clientY;});
  window.addEventListener('mousemove', e=>{ if(!dragging) return; group.rotation.y += (e.clientX-lx)*0.01; group.rotation.x += (e.clientY-ly)*0.01; lx=e.clientX; ly=e.clientY; });
  window.addEventListener('mouseup', ()=>{dragging=false;});
  function loop(){ if(!dragging) group.rotation.y += 0.005; renderer.render(scene,camera); requestAnimationFrame(loop); }
  loop();
}
function makeSeamless(img){
  const w=img.width,h=img.height;
  const canvas=document.createElement('canvas'); canvas.width=w; canvas.height=h;
  const ctx=canvas.getContext('2d'); ctx.drawImage(img,0,0);
  const data=ctx.getImageData(0,0,w,h); const d=data.data;
  // 左右边缘融合
  const band=Math.max(4, Math.floor(w*0.03));
  for(let y=0;y<h;y++){ for(let x=0;x<band;x++){ const l=(y*w+x)*4, r=(y*w+(w-1-x))*4;
    for(let c=0;c<4;c++){ const avg=(d[l+c]+d[r+c])>>1; d[l+c]=avg; d[r+c]=avg; } } }
  // 极点融合：把顶部/底部若干行模糊成平均值，消除极点畸变
  const poleBand = Math.max(4, Math.floor(h*0.03));
  for(let y=0;y<poleBand;y++){
    const row = (y*w)*4;
    for(let c=0;c<3;c++){ let s=0; for(let x=0;x<w;x++){ s+=d[(y*w+x)*4+c]; } const avg = s/w;
      for(let x=0;x<w;x++) d[(y*w+x)*4+c]=avg; }
  }
  for(let y=0;y<poleBand;y++){
    const yy = h-1-y; const row = (yy*w)*4;
    for(let c=0;c<3;c++){ let s=0; for(let x=0;x<w;x++){ s+=d[(yy*w+x)*4+c]; } const avg = s/w;
      for(let x=0;x<w;x++) d[(yy*w+x)*4+c]=avg; }
  }
  ctx.putImageData(data,0,0); return canvas;
}
dataUrls.forEach((item, i) => {
  const img = new Image();
  img.onload = () => { const t = new THREE.CanvasTexture(makeSeamless(img)); t.colorSpace = THREE.SRGBColorSpace; makeGlobe(document.getElementById('g' + i), t); };
  img.onerror = () => { document.body.innerHTML += '<p style="color:#ff6b6b">贴图加载失败: '+item.name+'</p>'; };
  img.src = item.url;
});
</script>
</body>
</html>
`
fs.writeFileSync(path.join(ROOT, 'preview', 'earth-preview.html'), html)
console.log('preview/earth-preview.html 已生成')