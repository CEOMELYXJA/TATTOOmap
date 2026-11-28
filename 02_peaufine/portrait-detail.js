import * as THREE from 'three';

// Closed, smoothly blended portrait volumes retain the original subject's
// per-tattoo proportions. Cavities are cut into the same surface as the bone.
export function addOrganicPortrait(batch, shapes, cavities, colour, options={}) {
  const nx=25, ny=29, nz=21, margin=.12;
  const low=axis=>Math.min(...shapes.map(shape=>shape[axis]-shape[axis+3]))-margin;
  const high=axis=>Math.max(...shapes.map(shape=>shape[axis]+shape[axis+3]))+margin;
  const x0=low(0),y0=low(1),z0=low(2),dx=(high(0)-x0)/nx,dy=(high(1)-y0)/ny,dz=(high(2)-z0)/nz;
  const sx=nx+1, sy=ny+1, sz=nz+1;
  const index=(x,y,z)=>(z*sy+y)*sx+x;
  const values=new Float32Array(sx*sy*sz);
  const ellipsoid=(x,y,z,a)=>{
    const u=(x-a[0])/a[3], v=(y-a[1])/a[4], w=(z-a[2])/a[5];
    return (Math.hypot(u,v,w)-1)*Math.min(a[3],a[4],a[5]);
  };
  function field(x,y,z){
    let d=1e3;
    for(const a of shapes){
      const next=ellipsoid(x,y,z,a), k=.12, h=Math.max(k-Math.abs(d-next),0)/k;
      d=Math.min(d,next)-h*h*k*.25;
    }
    for(const cavity of cavities) d=Math.max(d,-ellipsoid(x,y,z,cavity));
    return d;
  }
  for(let z=0;z<sz;z++) for(let y=0;y<sy;y++) for(let x=0;x<sx;x++)
    values[index(x,y,z)]=field(x0+x*dx,y0+y*dy,z0+z*dz);
  const offsets=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]];
  const tetra=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
  const positions=[],normals=[];
  function vertex(x,y,z){
    const xm=Math.max(0,x-1),xp=Math.min(nx,x+1),ym=Math.max(0,y-1),yp=Math.min(ny,y+1),zm=Math.max(0,z-1),zp=Math.min(nz,z+1);
    const n=new THREE.Vector3((values[index(xp,y,z)]-values[index(xm,y,z)])/(Math.max(1,xp-xm)*dx),
      (values[index(x,yp,z)]-values[index(x,ym,z)])/(Math.max(1,yp-ym)*dy),
      (values[index(x,y,zp)]-values[index(x,y,zm)])/(Math.max(1,zp-zm)*dz)).normalize();
    return {p:new THREE.Vector3(x0+x*dx,y0+y*dy,z0+z*dz),n,d:values[index(x,y,z)]};
  }
  function crossing(a,b){const t=a.d/(a.d-b.d);return {p:a.p.clone().lerp(b.p,t),n:a.n.clone().lerp(b.n,t).normalize()};}
  function triangle(a,b,c){
    const face=b.p.clone().sub(a.p).cross(c.p.clone().sub(a.p));
    if(face.dot(a.n)<0) [b,c]=[c,b];
    for(const v of [a,b,c]) {positions.push(v.p.x,v.p.y,v.p.z);normals.push(v.n.x,v.n.y,v.n.z);}
  }
  for(let z=0;z<nz;z++) for(let y=0;y<ny;y++) for(let x=0;x<nx;x++){
    const d=offsets.map(([a,b,c])=>values[index(x+a,y+b,z+c)]);
    if(d.every(q=>q>=0)||d.every(q=>q<0)) continue;
    const v=offsets.map(([a,b,c])=>vertex(x+a,y+b,z+c));
    for(const ids of tetra){
      const inside=ids.filter(i=>d[i]<0),outside=ids.filter(i=>d[i]>=0);
      if(!inside.length||inside.length===4) continue;
      if(inside.length===1) triangle(...outside.map(i=>crossing(v[inside[0]],v[i])));
      else if(inside.length===3){const q=inside.map(i=>crossing(v[outside[0]],v[i]));triangle(q[0],q[2],q[1]);}
      else {
        const a=crossing(v[inside[0]],v[outside[0]]),b=crossing(v[inside[0]],v[outside[1]]),
          c=crossing(v[inside[1]],v[outside[0]]),e=crossing(v[inside[1]],v[outside[1]]);
        triangle(a,b,c);triangle(b,e,c);
      }
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  geometry.computeBoundingSphere();
  const first=batch.colors?.length||0;
  batch.add(geometry,[0,0,0],[1,1,1],colour);
  if(options.sideColour && Array.isArray(batch.colors)) {
    const base=new THREE.Color(colour), side=new THREE.Color(options.sideColour), shade=new THREE.Color();
    for(let i=0;i<positions.length;i+=3){
      const x=positions[i], t=Math.max(0,Math.min(1,(x+.025)/.13));
      shade.copy(base).lerp(side,t*t*(3-2*t));
      batch.colors[first+i]=shade.r;batch.colors[first+i+1]=shade.g;batch.colors[first+i+2]=shade.b;
    }
  }
  geometry.dispose();
}
