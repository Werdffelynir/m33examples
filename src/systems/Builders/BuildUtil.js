import * as THREE from "three";


export function createPointPath (pointsArr, vType = 3) {
	const vectors = []
	for (let i = 0; i < pointsArr.length; i += 2) {
		if (vType === 2) {
			const v2from = new THREE.Vector2(pointsArr[i], pointsArr[i+1])
			vectors.push(v2from)
		}
		if (vType === 3) {
			const v3from = new THREE.Vector3(pointsArr[i], 0, pointsArr[i+1])
			vectors.push(v3from)
		}
	}
	return vectors
}


/**
 * ```
 * const pointsGeo = BuildUtil.createGeometry({
 *     points: [
 *         0, 0,
 *         0, 10,
 *         10, 10,
 *         10, 0,
 *         0, 0,
 *     ],
 *     holes: [
 *         [
 *             2, 2,
 *             2, 8,
 *             8, 8,
 *             8, 2,
 *             2, 2,
 *         ],
 *     ],
 *     extrude: {
 *         depth: 1,
 *         bevelEnabled: true,
 *         bevelThickness: -1,
 *         bevelSize: 1.5,
 *         bevelOffset: -1,
 *         bevelSegments: 3,
 *     }
 * })
 * pointsGeo.rotateX(-Math.PI / 2)
 * pointsGeo.translate(-5, 0, -5)
 * const mesh = new THREE.Mesh( pointsGeo, mat ) ;
 * scene.add( mesh );
 * ```
 * @param points
 * @param hole
 * @param holes
 * @param extrude
 * @return {ShapeGeometry|ExtrudeGeometry}
 */
export function createGeometry({points, hole, holes, extrude}) {
	if (Array.isArray(points) && !points[0].isVector3)
		points = createPointPath(points)

	let geo;

	const shape = points instanceof THREE.Shape ? points : new THREE.Shape(
		points.map(p => new THREE.Vector2(p.x, p.z))
	)

	if (Array.isArray(hole) && hole.length > 0) {
		if (!Array.isArray(holes)) holes = [];
		holes.push(hole)
	}

	if (Array.isArray(holes) && holes.length > 0) {
		for (let hi = 0; hi < holes.length; hi ++) {

			if (holes[hi] instanceof THREE.Path) {

				shape.holes.push(holes[hi])

			} else {

				const hole = new THREE.Path()

				const ps = holes[hi][0].isVector3 ? holes[hi] : createPointPath(holes[hi])

				hole.moveTo(ps[0].x, ps[0].z)
				for (let i = 1; i < ps.length; i ++) {

					hole.lineTo(ps[i].x, ps[i].z)
				}

				hole.closePath()

				shape.holes.push(hole)
			}

		}


	}


	if (extrude && Object.values(extrude).length > 0) {
		/**
		 *
		 * curveSegments?: number – Number of points on the curves.
		 * steps?: number – Number of points used for subdividing segments along the depth of the extruded spline.
		 * depth?: number – Depth to extrude the shape.
		 * bevelEnabled?: boolean – Whether to beveling to the shape or not.
		 * bevelThickness?: number – How deep into the original shape the bevel goes.
		 * bevelSize?: number – Distance from the shape outline that the bevel extends.
		 * bevelOffset?: number – Distance from the shape outline that the bevel starts.
		 * bevelSegments?: number – Number of bevel layers.
		 * extrudePath?: ?Curve – A 3D spline path along which the shape should be extruded. Bevels not supported for path extrusion.
		 * UVGenerator?: Object – An object that provides UV generator functions for custom UV generation.
		 * @type {ExtrudeGeometry}
		 */
		geo = new THREE.ExtrudeGeometry(shape, {...{
				depth: 1,
				bevelEnabled: false,
			}, ...extrude})
	} else
		geo = new THREE.ShapeGeometry(shape)


	return geo
}






export function geometryLines({points, width, height}) {
	if (!points[0].isVector3)
		points = createPointPath(points)

    const vertices = [];
    const indices = [];
    const uvs = [];

    const halfW = width / 2;
    const h = height;
    const tileScale = 1

	const lengths = [0]
	for (let i = 1; i < points.length; i++) {
		lengths[i] =
		lengths[i - 1] + points[i].distanceTo(points[i - 1])
	}
	const totalLength = lengths.at(-1) || 1


    const _addFace = (indices, a, b, c, d) => {
        // Додаємо два трикутники для кожного сегмента стіни/підлоги
        indices.push(a, b, c);
        indices.push(a, c, d);
    }

    // 1. Генеруємо вершини для кожного "зрізу" тунелю
    points.forEach((point, i) => {
        // Визначаємо напрямок тунелю для орієнтації стінок
        const forward = new THREE.Vector3();
        if (i < points.length - 1) {
            forward.subVectors(points[i + 1], point).normalize();
        } else {
            forward.subVectors(point, points[i - 1]).normalize();
        }

        // Розраховуємо вектор "вбік" (перпендикуляр)
        const up = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(forward, up).normalize().multiplyScalar(halfW);

        // 4 точки прямокутного зрізу (підлога ліво/право, стеля право/ліво)
        const p1 = new THREE.Vector3().copy(point).sub(right); // лівий низ
        const p2 = new THREE.Vector3().copy(point).add(right); // правий низ
        const p3 = new THREE.Vector3().copy(p2).addScaledVector(up, h); // правий верх
        const p4 = new THREE.Vector3().copy(p1).addScaledVector(up, h); // лівий верх

        // vertices.push(
        // 	p1.x, p1.y, p1.z,
        //  	p2.x, p2.y, p2.z, 
        //  	p3.x, p3.y, p3.z, 
        //  	p4.x, p4.y, p4.z
        // );
        const ipx = vertices.length / 3
        vertices.push(
	    	p1.x, p1.y, p1.z,
	     	p2.x, p2.y, p2.z, 
	     	p3.x, p3.y, p3.z, 
	     	p4.x, p4.y, p4.z,
        );
        
		// indices.push(
		// 	ipx, ipx + 1, ipx + 2,
		// 	ipx, ipx + 2, ipx + 3
		// )

        // UV координати для текстур

	    const v0 = 0 //point.distanceTo(forward) //(lengths[i] / totalLength) * tileScale
	    const v1 = 1 //forward.distanceTo(points[i+2])//(lengths[i + 1] / totalLength) * tileScale
        uvs.push(
        	0, 0, 
        	1, 1, 
        	1, 0, 
        );

         // const v =  i / (points.length - 1) ;
        // uvs.push(0, v, 1, v, 1, v, 0, v)
        // points[i + 1] 
        // 0, v0
		// 1, v0
		// 1, v1
		// 0, v1


   //  const base = positions.length / 3
   //  positions.push(
   //    a.x, a.y, a.z,
   //    b.x, b.y, b.z,
   //    c.x, c.y, c.z,
   //    d.x, d.y, d.z
   //  )
   //  uvs.push(
   //    uvA[0], uvA[1],
   //    uvB[0], uvB[1],
   //    uvC[0], uvC[1],
   //    uvD[0], uvD[1]
   //  )
   //  indices.push(
   //    base, base + 1, base + 2,
   //    base, base + 2, base + 3
   //  )

    });

    // 2. З'єднуємо вершини трикутниками (Index Buffer)
    for (let i = 0; i < points.length - 1; i++) {
        const curr = i * 4;
        const next = (i + 1) * 4;
        // Підлога (p1, p2)
        _addFace(indices, curr + 0, curr + 1, next + 1, next + 0);
        // Права стіна (p2, p3)
        _addFace(indices, curr + 1, curr + 2, next + 2, next + 1);
        // Стеля (p3, p4)
        _addFace(indices, curr + 2, curr + 3, next + 3, next + 2);
        // Ліва стіна (p4, p1)
        _addFace(indices, curr + 3, curr + 0, next + 0, next + 3);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    // geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    // const material =  material ?? new THREE.MeshStandardMaterial({ 
    //     color: 0x808080, 
    //     side: THREE.DoubleSide,
    //     flatShading: true 
    // });

    // return new THREE.Mesh(geometry, material);



    return geometry
}







export function catacombs(points, width, height) {
	if (!points[0].isVector3)
		points = createPointPath(points)

	const verts = []

	for (let i = 0; i < points.length - 1; i++) {
		const a = points[i]
		const b = points[i+1]

		// const dirA =  a.clone().normalize()
		// const dirB =  b.clone().normalize()

		const dir = b.clone().sub(a).normalize()
		const side = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(width * 0.5)

// 

		// if (dir.z === 1) {
		// 	side.z += width / 2
		// }
		// if (dir.z === -1) {
		// 	side.z -= width / 2
		// }
		// if (dir.x === 1) {
		// 	side.x += width / 2
		// }
		// if (dir.x === -1) {
		// 	side.x -= width / 2
		// }

		const aOff = a.clone().add(dir)
		const bOff = b.clone().sub(dir)
		const al = aOff.clone().add(side)
		const ar = aOff.clone().sub(side)
		const bl = bOff.clone().add(side)
		const br = bOff.clone().sub(side)

		verts.push(
			// right wall
			ar.x, 0, ar.z, ar.x, height, ar.z,  br.x, height, br.z,
			ar.x, 0, ar.z, br.x, 0, 	 br.z,  br.x, height, br.z,

			// left wall
			al.x, 0, al.z, al.x, height, al.z,  bl.x, height, bl.z,
			al.x, 0, al.z, bl.x, 0, 	 bl.z,  bl.x, height, bl.z,

			// floor
			al.x, 0, al.z,  ar.x, 0, ar.z,  bl.x, 0, bl.z,
			ar.x, 0, ar.z,  br.x, 0, br.z,  bl.x, 0, bl.z,

			// roof
			al.x, height, al.z,  ar.x, height, ar.z,  bl.x, height, bl.z,
			ar.x, height, ar.z,  br.x, height, br.z,  bl.x, height, bl.z,
		)


		// elbows
		// const p1 = b.clone().sub(new THREE.Vector3(width * 0.5, 0, width * 0.5))
		// const p2 = b.clone().add(new THREE.Vector3(width * 0.5, 0, width * 0.5))

		// verts.push(
		// 	p2.x, p2.y, p2.z, p1.x, p1.y, p1.z, p1.x, p2.y, p2.z, 
		// 	p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, p2.x, p2.y, p1.z, 

		// 	p1.x, p1.y+width, p1.z, p2.x, p2.y+width, p2.z, p1.x, p2.y+width, p2.z, 
		// 	p2.x, p2.y+width, p2.z, p1.x, p1.y+width, p1.z, p2.x, p2.y+width, p1.z, 
		// )

		// const bAdded = b.clone().add(dir)
		// const h1 = bAdded.clone().sub(side)
		// const h2 = bAdded.clone().add(side)

		// verts.push(
		// 	// p1.x, p1.y, p1.z, p1.x, p1.y+height, p1.z, p2.x, p1.y, p1.z, 
		// 	// h1.x, h1.y, h1.z, h2.x, h2.y, h2.z, h2.x, h2.y+height, h1.z, 
		// 	// h1.x, h1.y, h1.z, h2.x, h2.y+height, h1.z, h1.x, h1.y+height, h1.z, 
		// )

// console.log(dir, b)
// console.log(h1, h2)
	
	}

	const geo = new THREE.BufferGeometry()
	geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
	geo.computeVertexNormals()

	geo.userData.points = points
	return geo
}



export function buildCorridorGeometry({
  points,
  width = 1,
  height = 1,
  // масштаб UV (для повтору текстури)
  tileScale = 1}) 
{

  if (!points[0].isVector3) {
    throw new Error('points must be THREE.Vector3[]')
  }

  const positions = []
  const uvs = []
  const indices = []

  const halfW = width * 0.5
  const up = new THREE.Vector3(0, 1, 0)

  // ─────────────────────────────────────────────
  // 1. ДОВЖИНА ШЛЯХУ (для V координати UV)
  // ─────────────────────────────────────────────
  const lengths = [0]
  for (let i = 1; i < points.length; i++) {
    lengths[i] =
      lengths[i - 1] + points[i].distanceTo(points[i - 1])
  }
  const totalLength = lengths.at(-1) || 1

  // ─────────────────────────────────────────────
  // 2. УТИЛІТА: додати quad (4 вершини, 2 трикутники)
  // ─────────────────────────────────────────────
  function addQuad(a, b, c, d, uvA, uvB, uvC, uvD) {
    const base = positions.length / 3

    positions.push(
      a.x, a.y, a.z,
      b.x, b.y, b.z,
      c.x, c.y, c.z,
      d.x, d.y, d.z
    )

    uvs.push(
      uvA[0], uvA[1],
      uvB[0], uvB[1],
      uvC[0], uvC[1],
      uvD[0], uvD[1]
    )

    indices.push(
      base, base + 1, base + 2,
      base, base + 2, base + 3
    )
  }

  // ─────────────────────────────────────────────
  // 3. СЕГМЕНТИ КОРИДОРУ
  // ─────────────────────────────────────────────
  for (let i = 0; i < points.length - 1; i++) {
    const pA = points[i]
    const pB = points[i + 1]

    const dir = new THREE.Vector3()
      .subVectors(pB, pA)
      .normalize()

    const right = new THREE.Vector3()
      .crossVectors(dir, up)
      .normalize()
      .multiplyScalar(halfW)

    // 4 точки перерізу A
    const A_bl = pA.clone().sub(right)              // bottom-left
    const A_br = pA.clone().add(right)              // bottom-right
    const A_tr = A_br.clone().addScaledVector(up, height)
    const A_tl = A_bl.clone().addScaledVector(up, height)

    // 4 точки перерізу B
    const B_bl = pB.clone().sub(right)
    const B_br = pB.clone().add(right)
    const B_tr = B_br.clone().addScaledVector(up, height)
    const B_tl = B_bl.clone().addScaledVector(up, height)

    // UV по довжині
    const v0 = (lengths[i] / totalLength) * tileScale
    const v1 = (lengths[i + 1] / totalLength) * tileScale

    // ───────────────── FLOOR ─────────────────
    // U = ширина, V = довжина
    addQuad(
      A_bl, A_br, B_br, B_bl,
      [0, v0],
      [1, v0],
      [1, v1],
      [0, v1]
    )

    // ───────────────── CEILING ─────────────────
    addQuad(
      A_tr, A_tl, B_tl, B_tr,
      [0, v0],
      [1, v0],
      [1, v1],
      [0, v1]
    )

    // ───────────────── LEFT WALL ─────────────────
    // U = висота, V = довжина
    addQuad(
      A_tl, A_bl, B_bl, B_tl,
      [0, v0],
      [height, v0],
      [height, v1],
      [0, v1]
    )

    // ───────────────── RIGHT WALL ─────────────────
    addQuad(
      A_br, A_tr, B_tr, B_br,
      [0, v0],
      [height, v0],
      [height, v1],
      [0, v1]
    )
  }

  // ─────────────────────────────────────────────
  // 4. BUFFER GEOMETRY
  // ─────────────────────────────────────────────
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  )
  geometry.setAttribute(
    'uv',
    new THREE.Float32BufferAttribute(uvs, 2)
  )
  geometry.setIndex(indices)
  geometry.computeVertexNormals()

  return geometry
}






class GeometryBuilder {
  constructor() {
    this.positions = []
    this.uvs = []
    this.indices = []
    this.index = 0
  }

  addVertex(x, y, z, u, v) {
    this.positions.push(x, y, z)
    this.uvs.push(u, v)
    return this.index++
  }

  addTriangle(a, b, c) {
    this.indices.push(a, b, c)
  }

  build() {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(this.positions, 3)
    )
    geo.setAttribute(
      'uv',
      new THREE.Float32BufferAttribute(this.uvs, 2)
    )
    geo.setIndex(this.indices)
    geo.computeVertexNormals()
    return geo
  }
}





export function geometryQ({points, width, height}) {



}
