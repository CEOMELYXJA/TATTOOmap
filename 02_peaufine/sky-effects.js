import * as THREE from 'three';

// Both effects live inside the existing camera-centred sky group. They never
// intersect the playable world and stay behind opaque branches and leaves.
export function createSkyEffects(skyGroup) {
  const vertices = [], uvs = [], indices = [];
  const columns = 192, rows = 12;
  for (let band = 0; band < 2; band++) {
    const start = vertices.length / 3;
    for (let row = 0; row <= rows; row++) {
      const v = row / rows;
      for (let col = 0; col <= columns; col++) {
        const u = col / columns;
        const angle = u * Math.PI * 2;
        const radius = (band ? 438 : 399) + 17 * Math.sin(angle * 3 + band * 2);
        vertices.push(Math.cos(angle) * radius, 98 + v * 190 + band * 22, Math.sin(angle) * radius);
        uvs.push(u, v);
        if (row < rows && col < columns) {
          const a = start + row * (columns + 1) + col;
          indices.push(a, a + columns + 1, a + 1, a + 1, a + columns + 1, a + columns + 2);
        }
      }
    }
  }
  const auroraGeometry = new THREE.BufferGeometry();
  auroraGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  auroraGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  auroraGeometry.setIndex(indices);
  const auroraMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    vertexShader: `
      uniform float time;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 p = position;
        float wave = sin(uv.x * 31.4159 + time * 0.18) * 15.0
          + sin(uv.x * 69.115 + time * 0.11) * 6.0;
        p.xz *= 1.0 + wave * (0.0012 + uv.y * 0.0012);
        p.y += sin(uv.x * 18.8496 + time * 0.13) * 9.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      varying vec2 vUv;
      void main() {
        float edge = smoothstep(0.0, 0.18, vUv.y) * (1.0 - smoothstep(0.68, 1.0, vUv.y));
        float fold = 0.57 + 0.26 * sin(vUv.x * 119.38 + sin(vUv.x * 31.4 + time * 0.17) * 2.4 + time * 0.22);
        fold += 0.17 * sin(vUv.x * 245.0 - time * 0.13);
        float veil = (0.72 + 0.28 * sin(vUv.x * 12.566 + time * 0.09));
        vec3 green = vec3(0.10, 0.77, 0.43);
        vec3 blue = vec3(0.12, 0.40, 0.79);
        vec3 pink = vec3(0.65, 0.24, 0.58);
        vec3 color = mix(green, blue, smoothstep(0.32, 0.82, vUv.y));
        color = mix(color, pink, smoothstep(0.67, 1.0, vUv.y) * 0.55);
        gl_FragColor = vec4(color, edge * max(0.0, fold) * veil * 0.32);
      }
    `
  });
  const aurora = new THREE.Mesh(auroraGeometry, auroraMaterial);
  aurora.frustumCulled = false;
  skyGroup.add(aurora);

  const streakGeometry = new THREE.PlaneGeometry(55, 3.0);
  function makeMeteor() {
    const material = new THREE.ShaderMaterial({
      uniforms: { opacity: { value: 0 } },
      transparent: true,
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `
        uniform float opacity; varying vec2 vUv;
        void main(){
          float core = 1.0 - smoothstep(0.03, 0.48, abs(vUv.y - 0.5));
          float tail = pow(vUv.x, 1.7) * (1.0 - smoothstep(0.94, 1.0, vUv.x));
          float head = exp(-110.0 * pow(vUv.x - 0.94, 2.0)) * exp(-18.0 * pow(vUv.y - 0.5, 2.0));
          gl_FragColor=vec4(mix(vec3(0.55,0.75,1.0),vec3(1.0,0.96,0.82),head), opacity * max(core * tail * 0.68, head));
        }
      `
    });
    const mesh = new THREE.Mesh(streakGeometry, material);
    mesh.visible = false;
    mesh.frustumCulled = false;
    skyGroup.add(mesh);
    return mesh;
  }
  const meteors = [makeMeteor(), makeMeteor()];
  return function updateSkyEffects(time) {
    const t = Number.isFinite(time) ? Math.max(0, time) : 0;
    auroraMaterial.uniforms.time.value = t;
    for (let i = 0; i < meteors.length; i++) {
      const mesh = meteors[i];
      const cycle = t + i * 10.5;
      const period = 22;
      const elapsed = ((cycle % period) + period) % period;
      const progress = elapsed / 2.25;
      mesh.visible = progress > 0 && progress < 1;
      if (!mesh.visible) continue;
      const sequence = Math.floor(cycle / period);
      const angle = sequence * 2.399963 + i * 2.2 + progress * 0.24;
      const radius = 380;
      mesh.position.set(Math.cos(angle) * radius, 215 - progress * 50 + i * 28, Math.sin(angle) * radius);
      mesh.lookAt(skyGroup.position);
      mesh.rotateZ(-0.42);
      mesh.material.uniforms.opacity.value = Math.sin(Math.PI * progress) * 0.92;
    }
  };
}

