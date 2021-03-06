import * as THREE from 'three';

const sphereDetailLevel = 64;
const primaryColour = 0x3571da;

const primaryColourObject = new THREE.Color( primaryColour );
const primaryColourVec3String = `vec3(${primaryColourObject.r}, ${primaryColourObject.g}, ${primaryColourObject.b})`;

const fresnelShader = {
	uniforms: {},
	vertexShader: `
varying vec3 vPositionW;
varying vec3 vNormalW;
void main() {
	vPositionW = vec3( vec4( position, 1.0 ) * modelMatrix);
  vNormalW = normalize( vec3( vec4( normal, 0.0 ) * modelMatrix ) );
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`,
	fragmentShader: `
varying vec3 vPositionW;
varying vec3 vNormalW;
void main() {
	vec3 color = ${primaryColourVec3String};
	vec3 viewDirectionW = normalize(cameraPosition - vPositionW);
	float fresnelTerm = dot(viewDirectionW, vNormalW);
	fresnelTerm = clamp(1.0 - fresnelTerm, 0., 1.);
	gl_FragColor = vec4( color, fresnelTerm * fresnelTerm * fresnelTerm * fresnelTerm);
}
`,
};

let camera, scene, renderer;
let halo, points, lines, globe;

let rotationStartTime = 0;
const rotationDurationGlobe = 2000; // ms
const rotationDurationHighlight = 2000; // ms

const rotation = { x: 0, y: 0}; // Degrees
const rotationStart = { x: 0, y: 0}; // Degrees
const rotationTarget = { x: 55.7558, y: 37.6173}; // Degrees

// Updates the rotation variable with new {x, y} values based on rotationStart,
// rotationEnd, rotationDuration, and rotationStartTime, with an easing function.
const updateGlobeRotation = () => {

  // Clamped zero-to-one value (duration)
  const time = Math.max(0, Math.min(1, (window.performance.now() - rotationStartTime) / rotationDurationGlobe));

  // Eased zero-to-one value (animation progression)
  // "easeOutQuart" (Thanks, easing.net!)
  let progress = time;
  if (time > 0 && time < 1) {
    progress = 1 - Math.pow(1 - time, 4);
  }

  rotation.x = rotationStart.x + progress * (rotationTarget.x - rotationStart.x);
  rotation.y = rotationStart.y + progress * (rotationTarget.y - rotationStart.y);

};

const init = () => {

	camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 500 );
	camera.position.z = 400;

  scene = new THREE.Scene();

  const haloGeometry = new THREE.SphereGeometry( 100, sphereDetailLevel, sphereDetailLevel );
  const haloMaterial = new THREE.ShaderMaterial( {
    vertexShader: fresnelShader.vertexShader,
    fragmentShader: fresnelShader.fragmentShader,
    transparent: true,
    depthWrite: false,
  });
  halo = new THREE.Mesh( haloGeometry, haloMaterial );
  scene.add( halo )

  // Points and lines
  // const pointsAndLinesGeometry = new THREE.SphereGeometry( 97.5, 8, 8 );
  const pointsGeometry = generatePointsGeometry();
  const linesGeometry = generateLinesGeometry(pointsGeometry);

  const circleTexture = new THREE.TextureLoader().load( 'data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAB+klEQVRo3u2aPU8bQRCGn3E6ojQUbmicdHbtEjcoPaLjDyB+gCW61LRu0/AXEDXpbDrXpgPLKI0lKIg4quRNkTUaTmck0GHfnPKWp9XePjeze/OxUBNZWRNJ+gz0gC7QAVpAE/iYhjwAc2AKTIAxMDSz67V/BUlbkvqSRnq7RmmOrXUAtCUNJN2rPN2nOdurANiQ9E3Srd5Pt+kdG+8FsSPpXKvTuaSdsiEOJM20es0kHZQFcSQp0/qUSToqA+JR69fjm2GSO2WqjrJXu1na2DNVT7NlB4AVHbHAGfC1otHID2DXzDL/sFEwsF9hCNLa+i9aJP1VR8BmxWPEO2DbzC6XWeQwAARpjYeFFklB2yXwKUjk/gtom9nPvEX2A0GQ1rpf5Fp7AfOpvWeulZKiq6DJ4Rczu15YpBc4y+151+oGBul6kE5gkI4HaQUGaXmQZmCQpj+1fi+JuyLoj5l9aFATNVzxLKoePMg8MMjcg0wDg0w9yCQwyMSDjAODjD3IMDDI8AkklfYvAkJcLNoS/j9yGhDktL6pbnpwEsgaJwsICuKr7/wrtVRdd2mtFIKkOtEgAMjA17Se7RG3V+pRMk0DjoGbCkLcAMd5iBdVi7aCg4nf6MnBxG695dwsdjPUwcRvT/ujOfyFgRxQ7CscBUCVuVTz/5pT1fQX2npk0PrxixUAAAAASUVORK5CYII=' );

	const pointsMaterial = new THREE.PointsMaterial( {
    color: primaryColour,
    opacity: 1,
    transparent: true,
    map: circleTexture,
    alphaTest: 0.75,
    size: 4,
  });
  points = new THREE.Points( pointsGeometry, pointsMaterial );
  scene.add( points );

  const linesMaterial = new THREE.LineBasicMaterial( {
    color: primaryColour,
    opacity: 0.25,
    transparent: true,
    linewidth: 3,
  });
  lines = new THREE.LineSegments( linesGeometry, linesMaterial );
  scene.add( lines );


  // Globe
	const globeGeometry = new THREE.SphereGeometry( 90, sphereDetailLevel, sphereDetailLevel );
	const globeMaterial = new THREE.MeshPhongMaterial( {
    color: primaryColourObject,
    map: new THREE.TextureLoader().load('https://1.bp.blogspot.com/-596lbFumbyA/Ukb1cHw21_I/AAAAAAAAK-U/KArMZAjbvyU/s640/water_4k.png'),
    // map: new THREE.TextureLoader().load('images/world-alpha.png'),
  } );
  globe = new THREE.Mesh( globeGeometry, globeMaterial );
  scene.add( globe );

  // Lighting

  // Ambient
  scene.add(new THREE.AmbientLight(0x222222));
  var light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.z = 100;
  light.position.y = 200;
  light.position.x = 200;
  scene.add(light);


	renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.getElementById('main').appendChild( renderer.domElement );

  renderer.render( scene, camera );

  // Add button actions
  document.querySelectorAll('[data-lat][data-lng]').forEach( (button) => {
    button.addEventListener('click', rotateToTarget);
  });
}

const rotateToTarget = (e) => {
  rotationStartTime = window.performance.now();
  rotationStart.x = rotation.x;
  rotationStart.y = rotation.y;
  rotationTarget.x = e.target.dataset.lat;
  rotationTarget.y = -e.target.dataset.lng - 90; // Adjust for projection
};

const generatePointsGeometry = (radius = 99, points = 500) => {

  const geometry = new THREE.Geometry();

  for (let i = 0; i < points; i++) {

    const x = Math.random() * 2 - 1;
    const y = Math.random() * 2 - 1;
    const z = Math.random() * 2 - 1;

    const normalizationFactor = 1 / Math.sqrt( x * x + y * y + z * z );

    const xPos = x * normalizationFactor * radius;
    const yPos = y * normalizationFactor * radius;
    const zPos = z * normalizationFactor * radius;

    geometry.vertices.push(new THREE.Vector3(xPos, yPos, zPos));

  }

  return geometry;
};

const generateLinesGeometry = (pointsGeometry, hubCount = 10, hubLineCount = 10) => {
  const geometry = new THREE.Geometry();

  const allPoints = pointsGeometry.vertices.slice(0);

  allPoints.forEach( (startingPoint, index) => {

    const points = pointsGeometry.vertices.slice(0);

    // Calculate the distance of each point to the current startingPoint
    points.forEach( (point) => {
      point.delta = Math.sqrt(Math.pow(point.x-startingPoint.x, 2) + Math.pow(point.y-startingPoint.y, 2) + Math.pow(point.z-startingPoint.z, 2));
    });

    // Sort based on distance
    points.sort( (a, b) => {
      if (a.delta > b.delta) {
        return 1;
      }
      if (a.delta < b.delta) {
        return -1;
      }
      return 0;
    });

    // Dicard the nearest point - it's the current point
    points.shift();

    // Draw a line from the startingPoint to the center of the globe
    // geometry.vertices.push(new THREE.Vector3(0, 0, 0));
    // geometry.vertices.push(startingPoint);

    // Every startingPoint gets lines to its closest X neighbours
    for (let i = 0; i < 5; i++) {
      geometry.vertices.push(startingPoint);
      geometry.vertices.push(points.shift());
    }

    // A certain number of startingPoints get a whole bunch more, acting as "hubs"
    if (index < hubCount) {
    // if (false) {

      // Truncate
      points.length = hubLineCount + 1;

      // Add lines for each point that made the cut
      points.forEach ( (point) => {
        geometry.vertices.push(startingPoint);
        geometry.vertices.push(point);
      });

    }

  });

  // TODO: De-dupe pairs before returning
  return geometry;

};

const animate = () => {

  requestAnimationFrame( animate );

  // Use an easing function to update the 'rotation' variable
  updateGlobeRotation();

  // Apply the rotation to each 3D object
  [points, lines, globe].forEach( (obj) => {
    obj.rotation.x = rotation.x * Math.PI / 180; // Convert to radians
    obj.rotation.y = rotation.y * Math.PI / 180; // Convert to radians
  });

	renderer.render( scene, camera );

}

window.addEventListener('DOMContentLoaded', () => {
  init();
  animate();
})
