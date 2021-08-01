/** 
 * @author Edoardo Conti <edoardoconti.com>
 * 
 * */

import * as THREE from 'three';
import Type from './Type';
import { MyShaderLib } from './_MyShaderLib';

export default class NormalType extends Type {
    constructor(options){
        super(options);
        
        this.uniforms = {
            ...this.uniforms
        }

        this.materialOptions = {
            ...this.options.materialOptions
        }

        // useBumpMap
        this.useBumpMap = this.options.useBumpMap !== undefined ? this.options.useBumpMap : false;
        this.bumpSpace = this.options.bumpSpace !== undefined ? ((this.options.bumpSpace === 'outer' || this.options.bumpSpace === 'inner') ? this.options.bumpSpace : (function(){throw new Error('Valid values for bumpSpace are: "outer" to alter the background perceived depth, either "inner" to alter the perceived depth of text.' )})() ) : 'inner';
        this.bumpIntensity = this.options.bumpIntensity !== undefined && this.useBumpMap ? this.options.bumpIntensity : 1;

        // useDisplacementMap
        this.useDisplacementMap = this.options.useDisplacementMap !== undefined ? this.options.useDisplacementMap : false;
        this.displacementSpace = this.options.displacementSpace !== undefined ? ((this.options.displacementSpace === 'outer' || this.options.displacementSpace === 'inner') ? this.options.displacementSpace : (function(){throw new Error('Valid values for bumpSpace are: "outer" to alter the background perceived depth, either "inner" to alter the perceived depth of text.' )})() ) : 'inner';
        this.displacementIntensity = this.options.displacementIntensity !== undefined && this.useDisplacementMap ? this.options.displacementIntensity : 1;

    }

    async createMaterial(materialOptions){
        const material = new THREE.MeshNormalMaterial({
            ...this.materialOptions,
            ...materialOptions
        });
     
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
       
        material.userData.uniforms =  this.uniforms;
        material.onBeforeCompile = (shader, renderer) => {
            
            const {userData: {uniforms}} = material;
    
            shader.uniforms = Type.mergeUniforms(shader.uniforms, uniforms);
            shader.fragmentShader = MyShaderLib.normal_frag;
            shader.vertexShader = MyShaderLib.normal_vert;
            
            this.renderTargets.map(({rt, rtScene, rtCamera}) => {
                this.rtRender(renderer, rt, rtScene, rtCamera);
            });       
        }
        return material;
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
}