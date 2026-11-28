import * as THREE from 'three';

// Rounded volumetric flames for tattoo motifs; these are not part of the landscape.
function flameGeometry() {
  const profile=new THREE.SplineCurve([
    new THREE.Vector2(.04,0),new THREE.Vector2(.25,.08),new THREE.Vector2(.36,.31),
    new THREE.Vector2(.31,.59),new THREE.Vector2(.23,.87),new THREE.Vector2(.17,1.14),
    new THREE.Vector2(.10,1.48),new THREE.Vector2(0,1.92)
  ]).getPoints(24);
  for(const point of profile) point.x=Math.max(0,point.x);
  const geometry=new THREE.LatheGeometry(profile,24),pos=geometry.attributes.position;
  for(let i=0;i<pos.count;i++){
    const y=pos.getY(i),bend=Math.pow(y/1.92,2);
    pos.setX(i,pos.getX(i)+bend*.18);pos.setZ(i,pos.getZ(i)+bend*.07);
  }
  pos.needsUpdate=true;geometry.computeVertexNormals();return geometry;
}
const shape=flameGeometry();
export function buildSculpturalFlame(body){
  for(const [x,y,z,size,outer,inner] of [
    [-.43,.02,0,.67,'#ad452f','#ef8c3e'],
    [.39,0,-.03,.75,'#b95031','#f39a43'],
    [0,.01,.15,1,'#d75d2c','#ffd080']
  ]){
    body.add(shape,[x,y,z],[size,size,size],outer);
    body.add(shape,[x,y+.04,z+.18*size],[size*.49,size*.69,size*.49],inner);
  }
}
