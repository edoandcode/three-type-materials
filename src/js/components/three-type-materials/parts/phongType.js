/** 
 * @author Edoardo Conti <edoardoconti.com>
 * 
 * */

import * as THREE from 'three';
import Type from './Type';
import { MyShaderLib } from './_MyShaderLib';

export default class PhongType extends Type {
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

        // useBumpMap
        this.useBumpMap = this.options.useBumpMap !== undefined ? this.options.useBumpMap : false;
        this.bumpSpace = this.options.bumpSpace !== undefined ? ((this.options.bumpSpace === 'outer' || this.options.bumpSpace === 'inner') ? this.options.bumpSpace : (function(){throw new Error('Valid values for bumpSpace are: "outer" to alter the background perceived depth, either "inner" to alter the perceived depth of text.' )})() ) : 'inner';
        this.bumpIntensity = this.options.bumpIntensity !== undefined && this.useBumpMap ? this.options.bumpIntensity : 1;

        // useDisplacementMap
        this.useDisplacementMap = this.options.useDisplacementMap !== undefined ? this.options.useDisplacementMap : false;
        this.displacementSpace = this.options.displacementSpace !== undefined ? ((this.options.displacementSpace === 'outer' || this.options.displacementSpace === 'inner') ? this.options.displacementSpace : (function(){throw new Error('Valid values for bumpSpace are: "outer" to alter the background perceived depth, either "inner" to alter the perceived depth of text.' )})() ) : 'inner';
        this.displacementIntensity = this.options.displacementIntensity !== undefined && this.useDisplacementMap ? this.options.displacementIntensity : 1;

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
        const material = new THREE.MeshPhongMaterial({
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
        }// useAlpha
        if(this.useBumpMap){
            const bumpRT = await this.getBumpMap_RT();
            const [bumpmap_rt] = bumpRT;
            material.bumpMap = bumpmap_rt.texture;
            this.renderTargets = bumpRT;
        }// useBump
        if(this.useDisplacementMap){
            const displacementRT = await this.getDisplacementMap_RT();
            const [displacement_rt] = displacementRT;
            material.displacementMap = displacement_rt.texture;
           this.renderTargets = displacementRT;
        }//useDisplacement
        if(this.useEmissiveMap){
            const emissiveRT = await this.getEmissiveMap_RT();
            const [emissivemap_rt] = emissiveRT;
            material.emissiveMap = emissivemap_rt.texture;
            this.renderTargets = emissiveRT;
        }// useEmissive
        if(this.useSpecularMap){
            const specularRT = await this.getSpecularMap_RT();
            const [specularmap_rt] = specularRT;
            material.specularMap = specularmap_rt.texture;
            this.renderTargets = specularRT;
        }// useSpecular


        material.userData.uniforms =  this.uniforms;
        material.onBeforeCompile = (shader, renderer) => {
            
            const {userData: {uniforms}} = material;
    
            shader.uniforms = Type.mergeUniforms(shader.uniforms, uniforms);
            shader.fragmentShader = MyShaderLib.meshphong_frag;
            shader.vertexShader = MyShaderLib.meshphong_vert;
            
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
    async getBumpMap_RT(){
        const bumpColor = this.bumpSpace === 'outer' ? Type.getIntensityColor(0) : Type.getIntensityColor(this.bumpIntensity);
        const bumpBackground = this.bumpSpace === 'outer' ? Type.getIntensityColor(this.bumpIntensity) : Type.getIntensityColor(0);
        const [bump_rt, bump_rtScene, bump_rtCamera] = await this.getRenderTarget({
            color: bumpColor,
            background: bumpBackground,
        });
        return [bump_rt, bump_rtScene, bump_rtCamera];
    }
    async getDisplacementMap_RT(){
        const displacementColor = this.displacementSpace === 'outer' ? Type.getIntensityColor(0) : Type.getIntensityColor(this.displacementIntensity);
        const displacementBackground = this.displacementSpace === 'outer' ? Type.getIntensityColor(this.displacementIntensity) : Type.getIntensityColor(0);
        const [displacement_rt, displacement_rtScene, displacement_rtCamera] = await this.getRenderTarget({
            color: displacementColor,
            background: displacementBackground,
        });
        return [displacement_rt, displacement_rtScene, displacement_rtCamera];
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