import * as THREE from 'three';

// A real centrepiece in the central clearing: no catalogue artwork is cloned.
// The enclosing scene keeps the camera and tattoo interaction separate.
export function createCampfire(scene, terrain) {
  const fire = new THREE.Group();
  fire.position.set(0, terrain(0, 0), 0);
  scene.add(fire);

  const ash = new THREE.Mesh(
    new THREE.CircleGeometry(1.78, 32),
    new THREE.MeshStandardMaterial({color:0x3c352f, roughness:1})
  );
  ash.rotation.x = -Math.PI / 2;
  ash.position.y = .035;
  fire.add(ash);

  const stones = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(1, 0),
    new THREE.MeshStandardMaterial({color:0x71675a, roughness:1, flatShading:true}), 12
  );
  const dummy = new THREE.Object3D();
  for (let i=0; i<12; i++) {
    const a=i*Math.PI*2/12, variation=.87+.13*Math.sin(i*2.4);
    dummy.position.set(Math.cos(a)*1.34,.18,Math.sin(a)*1.34);
    dummy.rotation.set(.2*Math.sin(i),a,.18*Math.cos(i*2));
    dummy.scale.set(.37*variation,.24*variation,.27*variation);
    dummy.updateMatrix(); stones.setMatrixAt(i,dummy.matrix);
  }
  stones.instanceMatrix.needsUpdate=true; fire.add(stones);

  const bark = new THREE.MeshStandardMaterial({color:0x493124,roughness:1});
  const char = new THREE.MeshStandardMaterial({color:0x211b18,roughness:1});
  const woodGeo = new THREE.CylinderGeometry(.18,.23,2.15,9);
  const endGeo = new THREE.CylinderGeometry(.17,.17,.018,9);
  for (let i=0; i<6; i++) {
    const a=i*Math.PI/3, log=new THREE.Group();
    log.position.set(Math.cos(a)*.18,.24+(i%2)*.17,Math.sin(a)*.18);
    log.rotation.set(0,a,Math.PI/2+(i%2?-.10:.10));
    log.add(new THREE.Mesh(woodGeo,bark));
    for (const end of [-1,1]) {const cap=new THREE.Mesh(endGeo,char);cap.position.y=end*1.08;log.add(cap)}
    fire.add(log);
  }

  // Lathed silhouettes remain volumetric from any camera direction.
  const flameShape = new THREE.LatheGeometry([
    new THREE.Vector2(0,0), new THREE.Vector2(.22,.10),
    new THREE.Vector2(.38,.38),new THREE.Vector2(.30,.82),
    new THREE.Vector2(.20,1.24),new THREE.Vector2(.08,1.65),
    new THREE.Vector2(0,1.95)
  ], 9);
  const materials=[
    new THREE.MeshBasicMaterial({color:0xff4b08,transparent:true,opacity:.70,depthWrite:false,side:THREE.DoubleSide}),
    new THREE.MeshBasicMaterial({color:0xff9b1c,transparent:true,opacity:.85,depthWrite:false,side:THREE.DoubleSide}),
    new THREE.MeshBasicMaterial({color:0xffe38a,transparent:true,opacity:.90,depthWrite:false,side:THREE.DoubleSide})
  ];
  const flames=[];
  for(let i=0;i<7;i++) {
    const angle=i*2.399963, radius=i===0?0:.17+(i%3)*.10;
    const mesh=new THREE.Mesh(flameShape,materials[i%3]);
    mesh.position.set(Math.cos(angle)*radius,.25,Math.sin(angle)*radius);
    const scale=i%3===2?.52:i%3===1?.73:.96;
    mesh.scale.set(scale,scale*(.7+(i%4)*.10),scale);
    fire.add(mesh);flames.push({mesh,scale,phase:i*1.73});
  }
  const glow = new THREE.PointLight(0xff8b35,42,18,2);
  glow.position.set(0,1.25,0);fire.add(glow);

  const emberCount=28, points=new Float32Array(emberCount*3);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(points,3));
  const embers=new THREE.Points(geometry,new THREE.PointsMaterial({color:0xffb852,size:.085,transparent:true,opacity:.9,depthWrite:false}));
  fire.add(embers);
  return function updateCampfire(time) {
    const t=Number.isFinite(time)?time:0;
    for(const f of flames){
      const wave=Math.sin(t*2.4+f.phase), flutter=Math.sin(t*3.7+f.phase*1.4);
      f.mesh.rotation.z=.08*wave;f.mesh.rotation.x=.05*flutter;
      f.mesh.scale.y=f.scale*(.80+.12*wave+.06*flutter);
    }
    glow.intensity=39+5*Math.sin(t*5.3)+3*Math.sin(t*8.1);
    const attr=geometry.attributes.position;
    for(let i=0;i<emberCount;i++){
      const phase=(t*.36+i*.618)%1, angle=i*2.399963+t*.17;
      const radius=.12+phase*.40;
      attr.setXYZ(i,Math.cos(angle)*radius,.55+phase*2.7,Math.sin(angle)*radius);
    }
    attr.needsUpdate=true;
  };
}
