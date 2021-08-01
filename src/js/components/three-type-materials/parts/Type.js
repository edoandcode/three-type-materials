/** 
 * @author Edoardo Conti <edoardoconti.com>
 * 
 * */

import * as THREE from 'three';

import loadFont from 'load-bmfont';
import createGeometry from 'three-bmfont-text';
import MSDFShader from 'three-bmfont-text/shaders/msdf';

export default class Type {
    constructor(options){
      this.options = options || {};
      // mandatory options
      this.fnt = this.options.fnt ? this.options.fnt : (function(){throw new Error('fnt is not defined in options. It must be a url to a .fnt file.')})();
      this.png = this.options.png ? this.options.png : (function(){throw new Error('png is not defined in options. It must be a url to a .png file.')})()
      this.GLSLversion = this.options.GLSLversion || '#version 300 es';
      // render target options [optional]
      this.text = this.options.text ? this.options.text : 'TYPE';
      this.color = this.options.color || 0x000000;
      this.background = this.options.background || 0xffffff;
      this.transform = {
          scale: new THREE.Vector2(1,1),
          translate: new THREE.Vector3(0,0,0),
          rotate: new THREE.Vector3(0,0,0),
          ...this.options.transform
      }
      this.axisHelper = this.options.axisHelper !== undefined ? this.options.axisHelper : false;
      // actual material options
      this.time = 0;
      this.uniforms = {
         ...this.uniforms,
         uTime: new THREE.Uniform(this.time),
         uRepeat: new THREE.Uniform(this.options.uniforms && this.options.uniforms.uRepeat ? this.options.uniforms.uRepeat : new THREE.Vector2(1.0,1.0)),
         uTimeXY: new THREE.Uniform(this.options.uniforms && this.options.uniforms.uTimeXY ? this.options.uniforms.uTimeXY : new THREE.Vector2(1,0))
      }
      this.materialOptions = {
        side: THREE.FrontSide,
        ...this.options.materialOptions
      }
      let _RTs = [];
      Object.defineProperty(this, 'renderTargets', {
          get(){
              return _RTs;
          },
          set(arr){
              if(arr.length !== 3){
                  throw new Error('The renderTarget array must contain [renderTarget, scene, camera]')
              }
              const c = [..._RTs];
              c.push({
                  rt: arr[0],
                  rtScene: arr[1],
                  rtCamera: arr[2]
              });
              _RTs =  c;
          }
      });
      this.vShader = this.options.MyVertexShader || `#version 300 es
            in vec2 uv;
            in vec4 position;
            uniform mat4 projectionMatrix;
            uniform mat4 modelViewMatrix;
            out vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * position;
            }
        `;
      this.fShader = this.options.MyFragmentShader || `#version 300 es
            #ifdef GL_OES_standard_derivatives
            #extension GL_OES_standard_derivatives : enable
            #endif
            precision highp float;
            uniform float opacity;
            uniform vec3 color;
            uniform sampler2D map;
            in vec2 vUv;
            out vec4 myOutputColor;
            float median(float r, float g, float b) {
                return max(min(r, g), min(max(r, g), b));
            }
            void main() {
                vec3 s = texture(map, vUv).rgb;
                float sigDist = median(s.r, s.g, s.b) - 0.5;
                float alpha = clamp(sigDist/fwidth(sigDist) + 0.5, 0.0, 1.0);
                myOutputColor = vec4(color.xyz, alpha * opacity);
                if (myOutputColor.a < 0.0001) discard;
            }
        `;
    }      
    update(time) {
        this.time = time;
        if(!this.material) return;
        if(this.material.uniforms) this.material.uniforms.uTime.value = this.time;
        if(this.material.userData.uniforms) this.material.userData.uniforms.uTime.value = this.time;
    }
    getGlyphs(){
        return new Promise((resolve, reject) => {
            loadFont(this.fnt, (err, font) => {
                this.glyphs = font;
                resolve(this.glyphs);
            })
        });
    }
    getTexture(){
        return new Promise((resolve, reject) => {
            const loader = new THREE.TextureLoader();
            loader.load(this.png, (texture) => {
                // console.log(texture)
                const t = texture;
                resolve(t);
            });
        });
    }
    async getTextGeometry(text){
        const glyphs =  await this.getGlyphs();
        return new Promise((resolve, reject) => {
            const geometry = createGeometry({
                font: glyphs,
                text: text || this.text,
            });
            //console.log(geometry);
            resolve(geometry);
        });
    }
    async getTextMaterial(color){
        const texture = await this.getTexture();
        return new Promise((resolve, reject) => {
            const material = new THREE.RawShaderMaterial(
                MSDFShader({
                    map: texture,
                    side: THREE.DoubleSide,
                    transparent: true,
                    negate: false,
                    color: color || this.color
                })
            ); 

            if(this.GLSLversion === '#version 300 es'){
                material.onBeforeCompile = (shader, renderer) => {
                    shader.vertexShader = this.vShader;
                    shader.fragmentShader = this.fShader;
                    //console.log('MSDF vertex shader\n\n',shader.vertexShader);
                    //console.log('MSDF fragment shader\n\n', shader.fragmentShader);
                }
            }            
            resolve(material);
        })
    }
    async getMesh(text, color, transform = {}){
        const txt = text || this.text;
        const col = color || this.color;
        const trs = {
            scale: this.transform.scale,
            translate: this.transform.translate,
            rotate: this.transform.rotate,
            ...transform
        }
        const geometry = await this.getTextGeometry(txt);
        const material = await this.getTextMaterial(col);
        const mesh = new THREE.Mesh(
            geometry,
            material
        );
        mesh.scale.set(trs.scale.x, trs.scale.y, 1);
        mesh.rotation.set(Math.PI + trs.rotate.x, 0 + trs.rotate.y, Math.PI*2 + trs.rotate.z);
        const box = new THREE.Box3();
        box.setFromObject(mesh);
        mesh.position.x = -box.max.x/2 - box.min.x/2 + trs.translate.x;
        mesh.position.y = -box.max.y/2 - box.min.y/2 + trs.translate.y;
        mesh.position.z =  trs.translate.z;
        return mesh;
    }
    async getRenderTarget(options = {}){
        const text = options.text || this.text;
        const color = options.color || this.color;
        const transform = options.transform || this.transform;
        const background = options.background || this.background;
        const axisHelper = options.axisHelper || this.axisHelper;

        const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
        const renderTargetCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 3000);
        renderTargetCamera.position.z = options.zoom || 200;
        const renderTargetScene = new THREE.Scene();
        renderTargetScene.background = new THREE.Color(background);

        if(axisHelper){
            renderTargetScene.add(new THREE.AxisHelper(100));
        }
        const mesh = await this.getMesh(text, color, transform);
        renderTargetScene.add(mesh);
        return [renderTarget, renderTargetScene, renderTargetCamera];
    }
    async createMaterial(){
        const [rt, rtScene, rtCamera] = await this.getRenderTarget({
            text: this.text,
            color: this.color,
            background: this.background,
            transform: this.transform,
            axisHelper: this.axisHelper
        });
    
        
        const material = new THREE.ShaderMaterial({
            vertexShader: this.vShader,
            fragmentShader: this.fShader,
            uniforms: {
              ...this.uniforms,
              uTexture: new THREE.Uniform(rt.texture),
            },
            ...this.materialOptions
        });
        material.userData.uniforms = this.uniforms;
        material.onBeforeCompile = (shader, renderer) => {
          this.rtRender(renderer, rt, rtScene, rtCamera);
        }
        return material;
    }

    async getMaterial(materialOptions = {}){
        this.material = await this.createMaterial(materialOptions);
        return this.material;
    }

    rtRender(renderer, rt, rtScene, rtCamera){
        renderer.setRenderTarget(rt);
        renderer.render(rtScene, rtCamera);
        renderer.setRenderTarget(null);
    }



    /// Utils
    static mergeUniforms(...uniforms){
        const newUniforms = Object.assign({}, ...uniforms);
        return newUniforms;
    }

    static getIntensityColor(intensity, channels = 'rgb'){
        let hex = Math.round(THREE.MathUtils.mapLinear(intensity, 0, 1, 0, 255)).toString(16);
        //const dec = Math.round(THREE.MathUtils.mapLinear(intensity, 0, 1, 0, 255));
        const r = ~channels.indexOf('r') ? hex : '00';
        const g = ~channels.indexOf('g') ? hex : '00';
        const b = ~channels.indexOf('b') ? hex : '00';
        //console.log(new THREE.Color(r,g,b).getHex());
        //return new THREE.Color(r,g,b);
        const color = r+g+b;
        return `#${color}`;
    }

    static addHexColor(c1, c2) {
        if(c1[0] === '#'){
            c1 = c1.substring(1);
        }
        if(c2[0] === '#'){
            c2 = c2.substring(1);
        }
        var hexStr = (parseInt(c1, 16) + parseInt(c2, 16)).toString(16);
        while (hexStr.length < 6) { hexStr = '0' + hexStr; } // Zero pad.
        return `#${hexStr}`;
    }


}