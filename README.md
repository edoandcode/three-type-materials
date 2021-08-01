# three-type-materials

Useful classes to render typography in webgl using three.js and its build-in materials.

![three-type-materials](https://raw.githubusercontent.com/edoandcode/three-type-materials/main/typeMat.jpg)  


### What it is? ###
These are six classes to easily menage typography in webgl scenes. The geometry of the text is created with [three-bmfont-text](https://github.com/Jam3/three-bmfont-text) and it is added to a WebGLRenderTarget to create the texture used as maps in the three.js materials. Different classes handles different materials. Available materials are: MeshBasicMaterial, MeshLamberMaterial, MeshPhongMaterial, MeshNormalMaterial, MeshStandardMaterial, MeshToonMaterial. 
It allow to take control of almost all the maps which can be applied to the materials, such as map, alphaMap, specularMap, bumpMap, metalnessMap... and others, if the material supports them.

## How use it? ##
A simple example using BasicType class: 

```javascript
import * as THREE from 'three';

import { 
  BasicType, 
  LambertType, 
  PhongType, 
  NormalType, 
  StandardType, 
  ToonType 
} from './components/three-type-materials/all';

const MyScene = new function(){
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, this.width/this.height, 0.1, 400);
    this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x111111);
    this.time = 0;
    this.clock = new THREE.Clock();

    this.create = async () => {

        this.typeMaterials = [];

        const fontSetting = {
            fnt: 'fonts/Montserrat-black.fnt',
            png: 'fonts/Montserrat-black.png',
        }

        this.typeBasic = new BasicType({
            ...fontSetting,
            text: 'BASIC',
            color: 0xffff00,
            background: 0x0000ff,
            useAlphaMap: true,
            alphaSpace: 'outer',
            alphaIntensity: 0.5,
        });
        this.typeBasicMat = await this.typeBasic.getMaterial({
            alphaTest: 0,
        });

        this.mesh = new THREE.Mesh(
            new THREE.BoxGeometry(10,10,10),
            this.typeBasicMat
        );
        this.scene.add(this.mesh);
    }

    this.init = () => {
        this.scene.add(this.camera);
        document.body.appendChild(this.renderer.domElement);
        this.camera.position.set(50,50,50);
        this.camera.lookAt(0,0,0);

        this.create();
        this.animate();
    }

    this.render = () => {
        this.renderer.render(this.scene, this.camera);
    }

    this.animate = () => {
        this.animationFrame = window.requestAnimationFrame(()=>this.animate());
        this.time = this.clock.getElapsedTime();
        this.render();
    }
}

MyScene.init();
```


## API ##

All the classes inherit common properties and methods from Type which is the parent class.
In order to get the material with typography we have to create a new instance of the Type, pass in it some settings and then use the `getMaterial`. Below in more detail.

### Common options ###
`fnt: [string]`  -->  must be a valid url of the .fnt file we want use. See [three-bmfont-text](https://github.com/Jam3/three-bmfont-text) for details.  
`png: [string]`   --> must be a valid url of the .png file we want use. See [three-bmfont-text](https://github.com/Jam3/three-bmfont-text) for details.  
`text: [string]`   --> this is the text that will be visualized. "TYPE" is used by default.  
`color: [CSS color value]`  -->  defines which color the displayed text will be.  
`background: [CSS color value]`  -->  defines which color will be used for the texture background   
`uniforms: [plain js obj]` --> a plain js object to set the uniforms which will be passed to the Fragment Shader. Accepted properties are:  
```javascript
   {  
      uTime: 0,  // a float animated value to perform animation
      uTimeXY: new THREE.Vector2(1,0)],  // an instance of THREE.Vector2. Is used to multiply the uTime uniform and adjust the animation in the x and y axis. Default is new THREE.Vector2(1,0)
      uRepeat: new THREE.Vector3(1,1),  // an instance of THREE.Vector2. Is used to define how many times the texture will be repeated in x and y axies. Default is new THREE.Vector2(1,1)
   }
```
> `transform: [plain js obj]` -->  a plain js object which define the trasformation that will be applid to the text. Is used to adjust how the text fits the mesh. Accepted properties are:  
```javascript
   {  
      scale:  new THREE.Vector2(1,1),  // an instance of THREE.Vector2. Define the scaling for x and y axis. Default is new THREE.Vector2(1,1)
      translate new THREE.Vector3(0,0,0),  // an instance of THREE.Vector3. Define the translation for x, y and z axis. Default is new THREE.Vector3(0,0,0)
      rotate: new THREE.Vector3(0,0,0),  // an instance of THREE.Vector3. Define the rotation angles in radians for the x, y and z axis. Default is new THREE.Vector3(0,0,0)
   }
```

### Common methods ###

The most useful method common to all the classes is the `getMaterial` method which is the one that return the material instance class, anyway there are other methods internally used by this one. (view the code for details):  


`getMaterial(materialOptions[plain js object]): [Promise]`  -->  this method return a Promise which it resolve with the instance of three.js material. The textures with the typography are applied on it according to the settings defined in the Type class instance. The materialOptions is an optional parameter defines properties which will be applied to the material, all the options accepted by the three.js material are valid options.


### BASIC TYPE ###

This class is used to create an instance of THREE.MeshBasicMaterial class.  
Available options for this class are:

`useMap: [boolean]`  -->  defines if the texture generated is appliead to the map property of the material. The looks of the text is defined by the options passed at class instancing time. Default is true.  

`useAlphaMap: [boolean]` --> defines if the texture generated is applied to alphaMap property, in that case the text is used to alter the opacity of the material. Default is false. See the official three.js documentation for details on how to properly use alphaMap.   
`alphaSpace: [String]` --> accepted value are `'inner'` or `'outer'`. If 'inner' is setted the opacity is applied to the body of the text; otherwise if 'outer' is setted the background is affected and the text will be fully opaque.   
`alphaIntensity: [float value]` --> value between 0 and 1. Determines how much the alphaMap affect the material transparency.

### LAMBERT TYPE ###

This class is used to create an instance of THREE.MeshLambertMaterial class.  
Available options for this class are:

`useMap: [boolean]`  -->  defines if the texture generated is appliead to the map property of the material. The looks of the text is defined by the options passed at class instancing time. Default is true.  

`useAlphaMap: [boolean]` --> defines if the texture generated is applied to alphaMap property, in that case the text is used to alter the opacity of the material. Default is false. See the official three.js documentation for details on how to properly use alphaMap.   
`alphaSpace: [String]` --> accepted value are `'inner'` or `'outer'`. If 'inner' is setted the opacity is applied to the body of the text; otherwise if 'outer' is setted the background is affected and the text will be fully opaque.   
`alphaIntensity: [float value]` --> value between 0 and 1. Determines how much the alphaMap affect the material transparency.  

`useEmissiveMap: [boolean]` --> defines if the texture generated is applied to emissiveMap property, in that case the text is used to alter the emissive color of the materials. Default is false. See the official three.js documentation for details on how to properly use emissiveMap.   
`emissiveColor: [CSS color value]` --> a valid CSS color value or an instance of THREE.Color. Is used to define which is the color emitted by the body of the text.  
`emissiveBackground: [CSS color value]` --> a valid CSS color value or an instance of THREE.Color. Is used to define which is the color emitted by the background of the text.  

`useSpecularMap: [boolean]` --> defines if the texture generated is used to set the specularMap of the material.  
`specularColorIntensity: [float]` --> a value between 0 and 1. Define the gray-scale color of the body of the text in the specularMap. Value of 0 correspond to '0x000000', value of 1 correspond to '0xffffff'.  
`specularBackgroundIntensity: [float]` --> a value between 0 and 1. Define the gray-scale color of the background of the texture in the specularMap. Value of 0 correspond to '0x000000', value of 1 correspond to '0xffffff'.  


### PHONG TYPE ###

This class is used to create an instance of THREE.MeshPhongMaterial class.  
Available options for this class are:


`useMap: [boolean]`  -->  defines if the texture generated is appliead to the map property of the material. The looks of the text is defined by the options passed at class instancing time. Default is true.  

`useAlphaMap: [boolean]` --> defines if the texture generated is applied to alphaMap property, in that case the text is used to alter the opacity of the material. Default is false. See the official three.js documentation for details on how to properly use alphaMap.   
`alphaSpace: [String]` --> accepted value are `'inner'` or `'outer'`. If 'inner' is setted the opacity is applied to the body of the text; otherwise if 'outer' is setted the background is affected and the text will be fully opaque.   
`alphaIntensity: [float value]` --> value between 0 and 1. Determines how much the alphaMap affect the material transparency.  

`useBumpMap: [boolean]` --> defines if the texture generated is applied to bumpMap property. Default is false. See the official three.js documentation for details on how to properly use bumpMap.   
`bumpSpace: [string]` --> accepted value are `'inner'` or `'outer'`. If 'inner' is setted the text seems to bump down from the surface, otherwise if 'outer' is setted the text seems to bump up.  
`bumpIntensity: [float]` --> value between 0 and 1. Determines how much the bumpMap affect the material. Also take a look at the bumpScale property of the three.js material in the official documentation.  

`useDisplacementMap: [boolean]` --> defines if the texture generated is applied to displacementMap property. Default is false. In order to get an acceptable results the geometry must have large number of segments. See the official three.js documentation for details on how to properly use displacementMap property.  
`displacementSpace: [string]` --> accepted value are `'inner'` or `'outer'`. If 'inner' is setted the text is used to displace the vertices of the geometry innerward the surface; otherwise if 'outer' is setted the vertices ara displaced outwards.  
`displacementIntesity: [float]` --> a value between 0 and 1. Define how much the texture affect the displacementMap. Also view the displacementScale property of the three.js material in the official documentation.  

`useEmissiveMap: [boolean]` --> defines if the texture generated is applied to emissiveMap property, in that case the text is used to alter the emissive color of the materials. Default is false. See the official three.js documentation for details on how to properly use emissiveMap.    
`emissiveColor: [CSS color value]` --> a valid CSS color value or an instance of THREE.Color. Is used to define which is the color emitted by the body of the text.  
`emissiveBackground: [CSS color value]` --> a valid CSS color value or an instance of THREE.Color. Is used to define which is the color emitted by the background of the text.  

`useSpecularMap: [boolean]` --> defines if the texture generated is used to set the specularMap of the material.  
`specularColorIntensity: [float]` --> a value between 0 and 1. Define the gray-scale color of the body of the text in the specularMap. Value of 0 correspond to '0x000000', value of 1 correspond to '0xffffff'.  
`specularBackgroundIntensity: [float]` --> a value between 0 and 1. Define the gray-scale color of the background of the texture in the specularMap. Value of 0 correspond to '0x000000', value of 1 correspond to '0xffffff'.  



### STANDARD TYPE ###

This class is used to create an instance of THREE.MeshStandardMaterial class.  
Available options for this class are:


`useMap: [boolean]`  -->  defines if the texture generated is appliead to the map property of the material. The looks of the text is defined by the options passed at class instancing time. Default is true.  

`useAlphaMap: [boolean]` --> defines if the texture generated is applied to alphaMap property, in that case the text is used to alter the opacity of the material. Default is false. See the official three.js documentation for details on how to properly use alphaMap.   
`alphaSpace: [String]` --> accepted value are `'inner'` or `'outer'`. If 'inner' is setted the opacity is applied to the body of the text; otherwise if 'outer' is setted the background is affected and the text will be fully opaque.   
`alphaIntensity: [float value]` --> value between 0 and 1. Determines how much the alphaMap affect the material transparency.  

`useBumpMap: [boolean]` --> defines if the texture generated is applied to bumpMap property. Default is false. See the official three.js documentation for details on how to properly use bumpMap.   
`bumpSpace: [string]` --> accepted value are `'inner'` or `'outer'`. If 'inner' is setted the text seems to bump down from the surface, otherwise if 'outer' is setted the text seems to bump up.  
`bumpIntensity: [float]` --> value between 0 and 1. Determines how much the bumpMap affect the material. Also take a look at the bumpScale property of the three.js material in the official documentation.  

`useDisplacementMap: [boolean]` --> defines if the texture generated is applied to displacementMap property. Default is false. In order to get an acceptable results the geometry must have large number of segments. See the official three.js documentation for details on how to properly use displacementMap.  
`displacementSpace: [string]` --> accepted value are `'inner'` or `'outer'`. If 'inner' is setted the text is used to displace the vertices of the geometry innerward the surface; otherwise if 'outer' is setted the vertices ara displaced outwards.  
`displacementIntesity: [float]` --> a value between 0 and 1. Define how much the texture affect the displacementMap. Also view the displacementScale property of the three.js material in the official documentation.  

`useEmissiveMap: [boolean]` --> defines if the texture generated is applied to emissiveMap property, in that case the text is used to alter the emissive color of the materials. Default is false. See the official three.js documentation for details on how to properly use emissiveMap.    
`emissiveColor: [CSS color value]` --> a valid CSS color value or an instance of THREE.Color. Is used to define which is the color emitted by the body of the text.  
`emissiveBackground: [CSS color value]` --> a valid CSS color value or an instance of THREE.Color. Is used to define which is the color emitted by the background of the text.  

`useMetalnessMap: [boolean]` --> defines if the texture generated is used as metalnessMap of the material.  
`metalnessSpace: [string]` --> accepted value are `'inner'` or `'outer'`. If 'inner' is setted the texture alter the metalness of the text body; otherwise if 'outer' is setted the background of the text will be altered.  
`metalnessIntensity: [float]` --> a value between 0 and 1. Define how much the generated metalnessMap affect the material. 

`useRoughnessMap: [boolean]` --> defines if the texture generated is used as roughnessMap of the material.  
`roughnessSpace: [string]` --> accepted value are `'inner'` or `'outer'`. If 'inner' is setted the texture alter the roughness of the text body; otherwise if 'outer' is setted the background of the text will be altered.  
`roughnessIntensity: [float]` --> a value between 0 and 1. Define how much the generated metalnessMap affect the material. 

### TOON TYPE ###

This class is used to create an instance of THREE.MeshToonMaterial class.  
Available options for this class are:


`useMap: [boolean]`  -->  defines if the texture generated is appliead to the map property of the material. The looks of the text is defined by the options passed at class instancing time. Default is true.  

`useAlphaMap: [boolean]` --> defines if the texture generated is applied to alphaMap property, in that case the text is used to alter the opacity of the material. Default is false. See the official three.js documentation for details on how to properly use alphaMap.   
`alphaSpace: [String]` --> accepted value are `'inner'` or `'outer'`. If 'inner' is setted the opacity is applied to the body of the text; otherwise if 'outer' is setted the background is affected and the text will be fully opaque.   
`alphaIntensity: [float value]` --> value between 0 and 1. Determines how much the alphaMap affect the material transparency.  

`useBumpMap: [boolean]` --> defines if the texture generated is applied to bumpMap property. Default is false. See the official three.js documentation for details on how to properly use bumpMap.   
`bumpSpace: [string]` --> accepted value are `'inner'` or `'outer'`. If 'inner' is setted the text seems to bump down from the surface, otherwise if 'outer' is setted the text seems to bump up.  
`bumpIntensity: [float]` --> value between 0 and 1. Determines how much the bumpMap affect the material. Also take a look at the bumpScale property of the three.js material in the official documentation.  

`useDisplacementMap: [boolean]` --> defines if the texture generated is applied to displacementMap property. Default is false. In order to get an acceptable results the geometry must have large number of segments. See the official three.js documentation for details on how to properly use displacementMap.  
`displacementSpace: [string]` --> accepted value are 'inner' or 'outer'. If 'inner' is setted the text is used to displace the vertices of the geometry innerward the surface; otherwise if 'outer' is setted the vertices ara displaced outwards.  
`displacementIntesity: [float]` --> a value between 0 and 1. Define how much the texture affect the displacementMap. Also view the displacementScale property of the three.js material in the official documentation.  

`useEmissiveMap: [boolean]` --> defines if the texture generated is applied to emissiveMap property, in that case the text is used to alter the emissive color of the materials. Default is false. See the official three.js documentation for details on how to properly use emissiveMap.    
`emissiveColor: [CSS color value]` --> a valid CSS color value or an instance of THREE.Color. Is used to define which is the color emitted by the body of the text.  
`emissiveBackground: [CSS color value]` --> a valid CSS color value or an instance of THREE.Color. Is used to define which is the color emitted by the background of the text.  



### TOON TYPE ###

This class is used to create an instance of THREE.MeshNormalMaterial class.  
Available options for this class are:

`useBumpMap: [boolean]` --> defines if the texture generated is applied to bumpMap property. Default is false. See the official three.js documentation for details on how to properly use bumpMap property.   
`bumpSpace: [string]` --> accepted value are `'inner'` or `'outer'`. If 'inner' is setted the text seems to bump down from the surface, otherwise if 'outer' is setted the text seems to bump up.  
`bumpIntensity: [float]` --> value between 0 and 1. Determines how much the bumpMap affect the material. Also take a look at the bumpScale property of the three.js material in the official documentation.  

`useDisplacementMap: [boolean]` --> defines if the texture generated is applied to displacementMap property. Default is false. In order to get an acceptable results the geometry must have large number of segments. See the official three.js documentation for details on how to properly use displacementMap.  
`displacementSpace: [string]` --> accepted value are 'inner' or 'outer'. If 'inner' is setted the text is used to displace the vertices of the geometry innerward the surface; otherwise if 'outer' is setted the vertices ara displaced outwards.  
`displacementIntesity: [float]` --> a value between 0 and 1. Define how much the texture affect the displacementMap. Also take a look the displacementScale property of the three.js material in the official documentation.  

