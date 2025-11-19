/**
 * @fileoverview Externs for Three.js
 * @externs
 */

/** @const */
var THREE = {};

/** @constructor */
THREE.Scene = function() { };

/** @constructor */
THREE.Mesh = function() { };
THREE.Mesh.prototype.position = { x: 0, y: 0, z: 0 };
THREE.Mesh.prototype.geometry = null;
THREE.Mesh.prototype.material = null;
THREE.Mesh.prototype.remove = function() { };

/** @constructor */
THREE.BoxGeometry = function() { };
THREE.BoxGeometry.prototype.dispose = function() { };

/** @constructor */
THREE.MeshPhongMaterial = function() { };
THREE.MeshPhongMaterial.prototype.color = { setHex: function() { } };
THREE.MeshPhongMaterial.prototype.emissive = { setHex: function() { } };
THREE.MeshPhongMaterial.prototype.dispose = function() { };

/** @constructor */
THREE.PerspectiveCamera = function() { };
THREE.PerspectiveCamera.prototype.position = { x: 0, y: 0, z: 0 };
THREE.PerspectiveCamera.prototype.lookAt = function() { };
THREE.PerspectiveCamera.prototype.updateProjectionMatrix = function() { };

/** @constructor */
THREE.WebGLRenderer = function() { };
THREE.WebGLRenderer.prototype.setSize = function() { };
THREE.WebGLRenderer.prototype.render = function() { };
THREE.WebGLRenderer.prototype.domElement = null;
THREE.WebGLRenderer.prototype.setClearColor = function() { };
THREE.WebGLRenderer.prototype.setPixelRatio = function() { };
THREE.WebGLRenderer.prototype.dispose = function() { };

/** @constructor */
THREE.AmbientLight = function() { };
THREE.AmbientLight.prototype.intensity = 0;

/** @constructor */
THREE.DirectionalLight = function() { };
THREE.DirectionalLight.prototype.position = { x: 0, y: 0, z: 0 };
THREE.DirectionalLight.prototype.intensity = 0;

/** @const */
THREE.DoubleSide = 2;

/** @constructor */
THREE.Color = function() { };
THREE.Color.prototype.setHex = function() { };