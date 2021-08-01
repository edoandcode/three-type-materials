/** 
 * @author Edoardo Conti <edoardoconti.com>
 * 
 * */

import * as THREE from 'three';
import Type from './Type';
import { MyShaderLib } from './_MyShaderLib';

export default class LambertType extends Type {
    constructor(options){
        super(options);
        
        this.uniforms = {
            ...this.uniforms
        }

        this.materialOptions = {
            alphaTest: 1.0, // 1.0 for completly transparent background, if we want opacity backgrond accordingly with alphaColor property (grayscale) we can lower the alphaTest value. ISSUE: value lower than 1.0 causes some faces are still not transparent
            ...this.options.materialOptions
        }

        // useMAP
        this.useMap = this.options.useMap !== undefined ? this.options.useMap : true;

        // useAlphaMap
        this.useAlphaMap = this.options.useAlphaMap !== undefined ? this.options.useAlphaMap : false;
        this.alphaSpace = this.options.alphaSpace !== undefined ? ((this.options.alphaSpace === 'outer' || this.options.alphaSpace === 'inner') ? this.options.alphaSpace : (function(){throw new Error('Valid values for alphaSpace are: "outer" for text holes the surface, either "inner" for text with transparent background.' )})() ) : 'outer';
        this.alphaIntensity = this.options.alphaIntensity !== undefined ? this.options.alphaIntensity : 0;

        // useEmissiveMap
        this.useEmissiveMap = this.options.useEmissiveMap !== undefined ? this.options.useEmissiveMap : false;
        this.emissiveColor = this.options.emissiveColor  ? this.options.emissiveColor : (this.useEmissiveMap ? this.color : new THREE.Color(0x000000)); 
        this.emissiveBackground = this.options.emissiveBackground  ? this.options.emissiveBackground : (this.useEmissiveMap ? this.background : new THREE.Color(0x000000)); 

        // useSpecularMap
        this.useSpecularMap = this.options.useSpecularMap !== undefined ? this.options.useSpecularMap : false;
        this.specularColorIntensity = this.options.specularColorIntensity !== undefined ? this.options.specularColorIntensity : 0;
        this.specularBackgroundIntensity = this.options.specularBackgroundIntensity !== undefined ? this.options.specularBackgroundIntensity : 1;

    }

    async createMaterial(materialOptions){
        const material = new THREE.MeshLambertMaterial({
            ...this.materialOptions,
            ...materialOptions
        });
        if(this.useMap){
            const mapRT = await this.getMap_RT();
            const [map_rt] = mapRT;
            material.map = map_rt.texture;
            this.renderTargets = mapRT;
        }// useMap
        if(this.useAlphaMap){
            const alphaRT = await this.getAlphaMap_RT();
            const [alpha_rt] = alphaRT;
            material.alphaMap = alpha_rt.texture;
            material.transparent = true;
            this.renderTargets = alphaRT;
        }// useAlphaMap
        if(this.useEmissiveMap){
            const emissiveRT = await this.getEmissiveMap_RT();
            const [emissivemap_rt] = emissiveRT;
            material.emissiveMap = emissivemap_rt.texture;
            this.renderTargets = emissiveRT;
        }// useEmissiveMap
        if(this.useSpecularMap){
            const specularRT = await this.getSpecularMap_RT();
            const [specularmap_rt] = specularRT;
            material.specularMap = specularmap_rt.texture;
            this.renderTargets = specularRT;
        }// useSpecularMap

        material.userData.uniforms =  this.uniforms;
        material.onBeforeCompile = (shader, renderer) => {
            const {userData: {uniforms}} = material;
    
            shader.uniforms = Type.mergeUniforms(shader.uniforms, uniforms);
            shader.fragmentShader = MyShaderLib.meshlambert_frag;
            
            this.renderTargets.map(({rt, rtScene, rtCamera}) => {
                this.rtRender(renderer, rt, rtScene, rtCamera);
            });     
          
        }
        return material;
    }

    async getMap_RT(){
        const [map_rt, map_rtScene, map_rtCamera] = await this.getRenderTarget();
        return [map_rt, map_rtScene, map_rtCamera];
    }
    async getAlphaMap_RT(){
        const [alpha_rt, alpha_rtScene, alpha_rtCamera] = await this.getRenderTarget({
            color: this.alphaSpace === 'outer' ? Type.getIntensityColor(1) : Type.getIntensityColor(this.alphaIntensity),
            background: this.alphaSpace === 'outer' ? Type.getIntensityColor(this.alphaIntensity) : Type.getIntensityColor(1),
        });
        return [alpha_rt, alpha_rtScene, alpha_rtCamera];
    }
    async getEmissiveMap_RT(){
        const emissiveColor = this.emissiveColor;
        const emissiveBackground = this.emissiveBackground;
        const [emissive_rt, emissive_rtScene, emissive_rtCamera] = await this.getRenderTarget({
            color: emissiveColor,
            background: emissiveBackground,
        });
        return [emissive_rt, emissive_rtScene, emissive_rtCamera];
    }
    async getSpecularMap_RT(){
        const [specular_rt, specular_rtScene, specular_rtCamera] = await this.getRenderTarget({
            color: Type.getIntensityColor(this.specularColorIntensity),
            background: Type.getIntensityColor(this.specularBackgroundIntensity),
        });
        return [specular_rt, specular_rtScene, specular_rtCamera];
    }
}