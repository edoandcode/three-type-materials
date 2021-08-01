import { MyShaderChunks } from './_MyShaderChunks';
import { MyUniformsLib } from './_MyUniformsLib';
export const MyShaderLib = {
    meshbasic_frag: 
    `
        uniform vec3 diffuse;
        uniform float opacity;
        #ifndef FLAT_SHADED
            varying vec3 vNormal;
        #endif
        #include <common>
        ${MyUniformsLib.my_uv}
        #include <dithering_pars_fragment>
        #include <color_pars_fragment>
        #include <uv_pars_fragment>
        #include <uv2_pars_fragment>
        #include <map_pars_fragment>
        #include <alphamap_pars_fragment>
        #include <aomap_pars_fragment>
        #include <lightmap_pars_fragment>
        #include <envmap_common_pars_fragment>
        #include <envmap_pars_fragment>
        #include <cube_uv_reflection_fragment>
        #include <fog_pars_fragment>
        #include <specularmap_pars_fragment>
        #include <logdepthbuf_pars_fragment>
        #include <clipping_planes_pars_fragment>
        void main() {
            ${MyShaderChunks.dynamic_uv}
            #include <clipping_planes_fragment>
            vec4 diffuseColor = vec4( diffuse, opacity );
            #include <logdepthbuf_fragment>
            //#include <map_fragment> 
            ${MyShaderChunks.map_fragment}
            #include <color_fragment>
            //#include <my_alphamap_fragment>
            ${MyShaderChunks.alphamap_fragment}
            #include <alphatest_fragment>
            #include <specularmap_fragment>
            ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
            // accumulation (baked indirect lighting only)
            #ifdef USE_LIGHTMAP
            
                vec4 lightMapTexel= texture2D( lightMap, vUv2 );
                reflectedLight.indirectDiffuse += lightMapTexelToLinear( lightMapTexel ).rgb * lightMapIntensity;
            #else
                reflectedLight.indirectDiffuse += vec3( 1.0 );
            #endif
            // modulation
            #include <aomap_fragment>
            reflectedLight.indirectDiffuse *= diffuseColor.rgb;
            vec3 outgoingLight = reflectedLight.indirectDiffuse;
            #include <envmap_fragment>
            gl_FragColor = vec4( outgoingLight, diffuseColor.a );
            #include <tonemapping_fragment>
            #include <encodings_fragment>
            #include <fog_fragment>
            #include <premultiplied_alpha_fragment>
            #include <dithering_fragment>
        }
    `,
    meshlambert_frag:
    `
        uniform vec3 diffuse;
        uniform vec3 emissive;
        uniform float opacity;
        varying vec3 vLightFront;
        varying vec3 vIndirectFront;
        #ifdef DOUBLE_SIDED
            varying vec3 vLightBack;
            varying vec3 vIndirectBack;
        #endif
        #include <common>
        ${MyUniformsLib.my_uv}
        #include <packing>
        #include <dithering_pars_fragment>
        #include <color_pars_fragment>
        #include <uv_pars_fragment>
        #include <uv2_pars_fragment>
        #include <map_pars_fragment>
        #include <alphamap_pars_fragment>
        #include <aomap_pars_fragment>
        #include <lightmap_pars_fragment>
        #include <emissivemap_pars_fragment>
        #include <envmap_common_pars_fragment>
        #include <envmap_pars_fragment>
        #include <cube_uv_reflection_fragment>
        #include <bsdfs>
        #include <lights_pars_begin>
        #include <fog_pars_fragment>
        #include <shadowmap_pars_fragment>
        #include <shadowmask_pars_fragment>
        #include <specularmap_pars_fragment>
        #include <logdepthbuf_pars_fragment>
        #include <clipping_planes_pars_fragment>
        void main() {
            ${MyShaderChunks.dynamic_uv}
            #include <clipping_planes_fragment>
            vec4 diffuseColor = vec4( diffuse, opacity );
            ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
            vec3 totalEmissiveRadiance = emissive;
            #include <logdepthbuf_fragment>
            //#include <map_fragment>
            ${MyShaderChunks.map_fragment}
            #include <color_fragment>
            //#include <alphamap_fragment>
            ${MyShaderChunks.alphamap_fragment}
            #include <alphatest_fragment>
            #include <specularmap_fragment>
            #include <emissivemap_fragment>
            // accumulation
            #ifdef DOUBLE_SIDED
                reflectedLight.indirectDiffuse += ( gl_FrontFacing ) ? vIndirectFront : vIndirectBack;
            #else
                reflectedLight.indirectDiffuse += vIndirectFront;
            #endif
            #include <lightmap_fragment>
            reflectedLight.indirectDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb );
            #ifdef DOUBLE_SIDED
                reflectedLight.directDiffuse = ( gl_FrontFacing ) ? vLightFront : vLightBack;
            #else
                reflectedLight.directDiffuse = vLightFront;
            #endif
            reflectedLight.directDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb ) * getShadowMask();
            // modulation
            #include <aomap_fragment>
            vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
            #include <envmap_fragment>
            gl_FragColor = vec4( outgoingLight, diffuseColor.a );
            #include <tonemapping_fragment>
            #include <encodings_fragment>
            #include <fog_fragment>
            #include <premultiplied_alpha_fragment>
            #include <dithering_fragment>
        }
    `,
    meshphong_frag: 
    `
        #define PHONG
        uniform vec3 diffuse;
        uniform vec3 emissive;
        uniform vec3 specular;
        uniform float shininess;
        uniform float opacity;
        #include <common>
        ${MyUniformsLib.my_uv}
        #include <packing>
        #include <dithering_pars_fragment>
        #include <color_pars_fragment>
        #include <uv_pars_fragment>
        #include <uv2_pars_fragment>
        #include <map_pars_fragment>
        #include <alphamap_pars_fragment>
        #include <aomap_pars_fragment>
        #include <lightmap_pars_fragment>
        #include <emissivemap_pars_fragment>
        #include <envmap_common_pars_fragment>
        #include <envmap_pars_fragment>
        #include <cube_uv_reflection_fragment>
        #include <fog_pars_fragment>
        #include <bsdfs>
        #include <lights_pars_begin>
        #include <lights_phong_pars_fragment>
        #include <shadowmap_pars_fragment>
        //#include <bumpmap_pars_fragment>
        ${MyShaderChunks.bumpmap_pars_fragment}
        #include <normalmap_pars_fragment>
        #include <specularmap_pars_fragment>
        #include <logdepthbuf_pars_fragment>
        #include <clipping_planes_pars_fragment>
        void main() {
            ${MyShaderChunks.dynamic_uv}
            #include <clipping_planes_fragment>
            vec4 diffuseColor = vec4( diffuse, opacity );
            ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
            vec3 totalEmissiveRadiance = emissive;
            #include <logdepthbuf_fragment>
            //#include <map_fragment>
            ${MyShaderChunks.map_fragment}
            #include <color_fragment>
            //#include <alphamap_fragment>
            ${MyShaderChunks.alphamap_fragment}
            #include <alphatest_fragment>
            //#include <specularmap_fragment>
            ${MyShaderChunks.specularmap_fragment}
            #include <normal_fragment_begin>
            #include <normal_fragment_maps>
            //#include <emissivemap_fragment>
            ${MyShaderChunks.emissivemap_fragment}
            // accumulation
            #include <lights_phong_fragment>
            #include <lights_fragment_begin>
            #include <lights_fragment_maps>
            #include <lights_fragment_end>
            // modulation
            #include <aomap_fragment>
            vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
            #include <envmap_fragment>
            gl_FragColor = vec4( outgoingLight, diffuseColor.a );
            #include <tonemapping_fragment>
            #include <encodings_fragment>
            #include <fog_fragment>
            #include <premultiplied_alpha_fragment>
            #include <dithering_fragment>
        }
    `,
    meshphong_vert: 
    `
        #define PHONG
        varying vec3 vViewPosition;
        #ifndef FLAT_SHADED
            varying vec3 vNormal;
        #endif
        #include <common>
        ${MyUniformsLib.my_uv}
        #include <uv_pars_vertex>
        #include <uv2_pars_vertex>
        #include <displacementmap_pars_vertex>
        #include <envmap_pars_vertex>
        #include <color_pars_vertex>
        #include <fog_pars_vertex>
        #include <morphtarget_pars_vertex>
        #include <skinning_pars_vertex>
        #include <shadowmap_pars_vertex>
        #include <logdepthbuf_pars_vertex>
        #include <clipping_planes_pars_vertex>
        void main() {
            #include <uv_vertex>
            #include <uv2_vertex>
            #include <color_vertex>
            #include <beginnormal_vertex>
            #include <morphnormal_vertex>
            #include <skinbase_vertex>
            #include <skinnormal_vertex>
            #include <defaultnormal_vertex>
        #ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED
            vNormal = normalize( transformedNormal );
        #endif
            #include <begin_vertex>
            #include <morphtarget_vertex>
            #include <skinning_vertex>
            //#include <displacementmap_vertex>
            ${MyShaderChunks.displacementmap_vertex}
            #include <project_vertex>
            #include <logdepthbuf_vertex>
            #include <clipping_planes_vertex>
            vViewPosition = - mvPosition.xyz;
            #include <worldpos_vertex>
            #include <envmap_vertex>
            #include <shadowmap_vertex>
            #include <fog_vertex>
        }
    `,
    meshstandard_frag: 
    `
        #define STANDARD
        #ifdef PHYSICAL
            #define REFLECTIVITY
            #define CLEARCOAT
            #define TRANSMISSION
        #endif
        uniform vec3 diffuse;
        uniform vec3 emissive;
        uniform float roughness;
        uniform float metalness;
        uniform float opacity;
        #ifdef TRANSMISSION
            uniform float transmission;
        #endif
        #ifdef REFLECTIVITY
            uniform float reflectivity;
        #endif
        #ifdef CLEARCOAT
            uniform float clearcoat;
            uniform float clearcoatRoughness;
        #endif
        #ifdef USE_SHEEN
            uniform vec3 sheen;
        #endif
        varying vec3 vViewPosition;
        #ifndef FLAT_SHADED
            varying vec3 vNormal;
            #ifdef USE_TANGENT
                varying vec3 vTangent;
                varying vec3 vBitangent;
            #endif
        #endif
        #include <common>
        ${MyUniformsLib.my_uv}
        #include <packing>
        #include <dithering_pars_fragment>
        #include <color_pars_fragment>
        #include <uv_pars_fragment>
        #include <uv2_pars_fragment>
        #include <map_pars_fragment>
        #include <alphamap_pars_fragment>
        #include <aomap_pars_fragment>
        #include <lightmap_pars_fragment>
        #include <emissivemap_pars_fragment>
        #include <transmissionmap_pars_fragment>
        #include <bsdfs>
        #include <cube_uv_reflection_fragment>
        #include <envmap_common_pars_fragment>
        #include <envmap_physical_pars_fragment>
        #include <fog_pars_fragment>
        #include <lights_pars_begin>
        #include <lights_physical_pars_fragment>
        #include <shadowmap_pars_fragment>
        //#include <bumpmap_pars_fragment>
        ${MyShaderChunks.bumpmap_pars_fragment}
        #include <normalmap_pars_fragment>
        #include <clearcoat_pars_fragment>
        #include <roughnessmap_pars_fragment>
        #include <metalnessmap_pars_fragment>
        #include <logdepthbuf_pars_fragment>
        #include <clipping_planes_pars_fragment>
        void main() {
            ${MyShaderChunks.dynamic_uv}
            #include <clipping_planes_fragment>
            vec4 diffuseColor = vec4( diffuse, opacity );
            ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
            vec3 totalEmissiveRadiance = emissive;
            #ifdef TRANSMISSION
                float totalTransmission = transmission;
            #endif
            #include <logdepthbuf_fragment>
            //#include <map_fragment>
            ${MyShaderChunks.map_fragment}
            #include <color_fragment>
            //#include <alphamap_fragment>
            ${MyShaderChunks.alphamap_fragment}
            #include <alphatest_fragment>
            //#include <roughnessmap_fragment>
            ${MyShaderChunks.roughnessmap_fragment}
            //#include <metalnessmap_fragment>
            ${MyShaderChunks.metalnessmap_fragment}
            #include <normal_fragment_begin>
            #include <normal_fragment_maps>
            #include <clearcoat_normal_fragment_begin>
            #include <clearcoat_normal_fragment_maps>
            //#include <emissivemap_fragment>
            ${MyShaderChunks.emissivemap_fragment}
            #include <transmissionmap_fragment>
            // accumulation
            #include <lights_physical_fragment>
            #include <lights_fragment_begin>
            #include <lights_fragment_maps>
            #include <lights_fragment_end>
            // modulation
            #include <aomap_fragment>
            vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
            // this is a stub for the transmission model
            #ifdef TRANSMISSION
                diffuseColor.a *= mix( saturate( 1. - totalTransmission + linearToRelativeLuminance( reflectedLight.directSpecular + reflectedLight.indirectSpecular ) ), 1.0, metalness );
            #endif
            gl_FragColor = vec4( outgoingLight, diffuseColor.a );
            #include <tonemapping_fragment>
            #include <encodings_fragment>
            #include <fog_fragment>
            #include <premultiplied_alpha_fragment>
            #include <dithering_fragment>
        }
    `,
    meshstandard_vert: 
    `
        #define STANDARD
        varying vec3 vViewPosition;
        #ifndef FLAT_SHADED
            varying vec3 vNormal;
            #ifdef USE_TANGENT
                varying vec3 vTangent;
                varying vec3 vBitangent;
            #endif
        #endif
        #include <common>
        ${MyUniformsLib.my_uv}
        #include <uv_pars_vertex>
        #include <uv2_pars_vertex>
        #include <displacementmap_pars_vertex>
        #include <color_pars_vertex>
        #include <fog_pars_vertex>
        #include <morphtarget_pars_vertex>
        #include <skinning_pars_vertex>
        #include <shadowmap_pars_vertex>
        #include <logdepthbuf_pars_vertex>
        #include <clipping_planes_pars_vertex>
        void main() {
            #include <uv_vertex>
            #include <uv2_vertex>
            #include <color_vertex>
            #include <beginnormal_vertex>
            #include <morphnormal_vertex>
            #include <skinbase_vertex>
            #include <skinnormal_vertex>
            #include <defaultnormal_vertex>
        #ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED
            vNormal = normalize( transformedNormal );
            #ifdef USE_TANGENT
                vTangent = normalize( transformedTangent );
                vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
            #endif
        #endif
            #include <begin_vertex>
            #include <morphtarget_vertex>
            #include <skinning_vertex>
            //#include <displacementmap_vertex>
            ${MyShaderChunks.displacementmap_vertex}
            #include <project_vertex>
            #include <logdepthbuf_vertex>
            #include <clipping_planes_vertex>
            vViewPosition = - mvPosition.xyz;
            #include <worldpos_vertex>
            #include <shadowmap_vertex>
            #include <fog_vertex>
        }
    `,
    meshtoon_frag: 
    `
        #define TOON
        uniform vec3 diffuse;
        uniform vec3 emissive;
        uniform float opacity;
        #include <common>
        ${MyUniformsLib.my_uv}
        #include <packing>
        #include <dithering_pars_fragment>
        #include <color_pars_fragment>
        #include <uv_pars_fragment>
        #include <uv2_pars_fragment>
        #include <map_pars_fragment>
        #include <alphamap_pars_fragment>
        #include <aomap_pars_fragment>
        #include <lightmap_pars_fragment>
        #include <emissivemap_pars_fragment>
        #include <gradientmap_pars_fragment>
        #include <fog_pars_fragment>
        #include <bsdfs>
        #include <lights_pars_begin>
        #include <lights_toon_pars_fragment>
        #include <shadowmap_pars_fragment>
        //#include <bumpmap_pars_fragment>
        ${MyShaderChunks.bumpmap_pars_fragment}
        #include <normalmap_pars_fragment>
        #include <logdepthbuf_pars_fragment>
        #include <clipping_planes_pars_fragment>
        void main() {
            ${MyShaderChunks.dynamic_uv}
            #include <clipping_planes_fragment>
            vec4 diffuseColor = vec4( diffuse, opacity );
            ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
            vec3 totalEmissiveRadiance = emissive;
            #include <logdepthbuf_fragment>
            //#include <map_fragment>
            ${MyShaderChunks.map_fragment}
            #include <color_fragment>
            //#include <alphamap_fragment>
            ${MyShaderChunks.alphamap_fragment}
            #include <alphatest_fragment>
            #include <normal_fragment_begin>
            #include <normal_fragment_maps>
            //#include <emissivemap_fragment>
            ${MyShaderChunks.emissivemap_fragment}
            // accumulation
            #include <lights_toon_fragment>
            #include <lights_fragment_begin>
            #include <lights_fragment_maps>
            #include <lights_fragment_end>
            // modulation
            #include <aomap_fragment>
            vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
            gl_FragColor = vec4( outgoingLight, diffuseColor.a );
            #include <tonemapping_fragment>
            #include <encodings_fragment>
            #include <fog_fragment>
            #include <premultiplied_alpha_fragment>
            #include <dithering_fragment>
        }
    `,
    meshtoon_vert: 
    `
        #define TOON
        varying vec3 vViewPosition;
        #ifndef FLAT_SHADED
            varying vec3 vNormal;
        #endif
        #include <common>
        ${MyUniformsLib.my_uv}
        #include <uv_pars_vertex>
        #include <uv2_pars_vertex>
        #include <displacementmap_pars_vertex>
        #include <color_pars_vertex>
        #include <fog_pars_vertex>
        #include <morphtarget_pars_vertex>
        #include <skinning_pars_vertex>
        #include <shadowmap_pars_vertex>
        #include <logdepthbuf_pars_vertex>
        #include <clipping_planes_pars_vertex>
        void main() {
            #include <uv_vertex>
            #include <uv2_vertex>
            #include <color_vertex>
            #include <beginnormal_vertex>
            #include <morphnormal_vertex>
            #include <skinbase_vertex>
            #include <skinnormal_vertex>
            #include <defaultnormal_vertex>
        #ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED
            vNormal = normalize( transformedNormal );
        #endif
            #include <begin_vertex>
            #include <morphtarget_vertex>
            #include <skinning_vertex>
            //#include <displacementmap_vertex>
            ${MyShaderChunks.displacementmap_vertex}
            #include <project_vertex>
            #include <logdepthbuf_vertex>
            #include <clipping_planes_vertex>
            vViewPosition = - mvPosition.xyz;
            #include <worldpos_vertex>
            #include <shadowmap_vertex>
            #include <fog_vertex>
        }
    `,
    normal_frag: 
    `
        #define NORMAL
        uniform float opacity;
        ${MyUniformsLib.my_uv}
        #if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( TANGENTSPACE_NORMALMAP )
            varying vec3 vViewPosition;
        #endif
        #ifndef FLAT_SHADED
            varying vec3 vNormal;
            #ifdef USE_TANGENT
                varying vec3 vTangent;
                varying vec3 vBitangent;
            #endif
        #endif
        #include <packing>
        #include <uv_pars_fragment>
        //#include <bumpmap_pars_fragment>
        ${MyShaderChunks.bumpmap_pars_fragment}
        #include <normalmap_pars_fragment>
        #include <logdepthbuf_pars_fragment>
        #include <clipping_planes_pars_fragment>
        void main() {
            ${MyShaderChunks.dynamic_uv}
            #include <clipping_planes_fragment>
            #include <logdepthbuf_fragment>
            #include <normal_fragment_begin>
            #include <normal_fragment_maps>
            gl_FragColor = vec4( packNormalToRGB( normal ), opacity );
        }
    `,
    normal_vert: 
    `
        #define NORMAL
        #if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( TANGENTSPACE_NORMALMAP )
            varying vec3 vViewPosition;
        #endif
        #ifndef FLAT_SHADED
            varying vec3 vNormal;
            #ifdef USE_TANGENT
                varying vec3 vTangent;
                varying vec3 vBitangent;
            #endif
        #endif
        #include <common>
        ${MyUniformsLib.my_uv}
        #include <uv_pars_vertex>
        #include <displacementmap_pars_vertex>
        #include <morphtarget_pars_vertex>
        #include <skinning_pars_vertex>
        #include <logdepthbuf_pars_vertex>
        #include <clipping_planes_pars_vertex>
        void main() {
            #include <uv_vertex>
            #include <beginnormal_vertex>
            #include <morphnormal_vertex>
            #include <skinbase_vertex>
            #include <skinnormal_vertex>
            #include <defaultnormal_vertex>
        #ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED
            vNormal = normalize( transformedNormal );
            #ifdef USE_TANGENT
                vTangent = normalize( transformedTangent );
                vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
            #endif
        #endif
            #include <begin_vertex>
            #include <morphtarget_vertex>
            #include <skinning_vertex>
            //#include <displacementmap_vertex>
            ${MyShaderChunks.displacementmap_vertex}
            #include <project_vertex>
            #include <logdepthbuf_vertex>
            #include <clipping_planes_vertex>
        #if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( TANGENTSPACE_NORMALMAP )
            vViewPosition = - mvPosition.xyz;
        #endif
        }
    `,
    depth_frag: 
    `
        #if DEPTH_PACKING == 3200
            uniform float opacity;
        #endif
        #include <common>
        ${MyUniformsLib.my_uv}
        #include <packing>
        #include <uv_pars_fragment>
        #include <map_pars_fragment>
        #include <alphamap_pars_fragment>
        #include <logdepthbuf_pars_fragment>
        #include <clipping_planes_pars_fragment>
        varying vec2 vHighPrecisionZW;
        void main() {
            ${MyShaderChunks.dynamic_uv}
            #include <clipping_planes_fragment>
            vec4 diffuseColor = vec4( 1.0 );
            #if DEPTH_PACKING == 3200
                diffuseColor.a = opacity;
            #endif
            //#include <map_fragment>
            ${MyShaderChunks.map_fragment}
            //#include <alphamap_fragment>
            ${MyShaderChunks.alphamap_fragment}
            #include <alphatest_fragment>
            #include <logdepthbuf_fragment>
            // Higher precision equivalent of gl_FragCoord.z. This assumes depthRange has been left to its default values.
            float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
            #if DEPTH_PACKING == 3200
                gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
            #elif DEPTH_PACKING == 3201
                gl_FragColor = packDepthToRGBA( fragCoordZ );
            #endif
        }
    `,
    depth_vert:
    `
        #include <common>
        ${MyUniformsLib.my_uv}
        #include <uv_pars_vertex>
        #include <displacementmap_pars_vertex>
        #include <morphtarget_pars_vertex>
        #include <skinning_pars_vertex>
        #include <logdepthbuf_pars_vertex>
        #include <clipping_planes_pars_vertex>
        // This is used for computing an equivalent of gl_FragCoord.z that is as high precision as possible.
        // Some platforms compute gl_FragCoord at a lower precision which makes the manually computed value better for
        // depth-based postprocessing effects. Reproduced on iPad with A10 processor / iPadOS 13.3.1.
        varying vec2 vHighPrecisionZW;
        void main() {
            #include <uv_vertex>
            #include <skinbase_vertex>
            #ifdef USE_DISPLACEMENTMAP
                #include <beginnormal_vertex>
                #include <morphnormal_vertex>
                #include <skinnormal_vertex>
            #endif
            #include <begin_vertex>
            #include <morphtarget_vertex>
            #include <skinning_vertex>
            //#include <displacementmap_vertex>
            ${MyShaderChunks.displacementmap_vertex}
            #include <project_vertex>
            #include <logdepthbuf_vertex>
            #include <clipping_planes_vertex>
            vHighPrecisionZW = gl_Position.zw;
        }
    `,
    distanceRGBA_frag: 
    `
        #define DISTANCE
        uniform vec3 referencePosition;
        ${MyUniformsLib.my_uv}
        uniform float nearDistance;
        uniform float farDistance;
        varying vec3 vWorldPosition;
        #include <common>
        #include <packing>
        #include <uv_pars_fragment>
        #include <map_pars_fragment>
        #include <alphamap_pars_fragment>
        #include <clipping_planes_pars_fragment>
        void main () {
            ${MyShaderChunks.dynamic_uv}
            #include <clipping_planes_fragment>
            vec4 diffuseColor = vec4( 1.0 );
            #include <map_fragment>
            //#include <alphamap_fragment>
            ${MyShaderChunks.alphamap_fragment}
            #include <alphatest_fragment>
            float dist = length( vWorldPosition - referencePosition );
            dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
            dist = saturate( dist ); // clamp to [ 0, 1 ]
            gl_FragColor = packDepthToRGBA( dist );

        }
    `
}