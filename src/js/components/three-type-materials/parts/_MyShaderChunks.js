export const MyShaderChunks = {
    dynamic_uv: 
    `
        vec2 repeat = uRepeat;
        vec2 dynamic_uv = fract(vUv * repeat + vec2(uTime) * uTimeXY );
    `,
    map_fragment: 
    `
        #ifdef USE_MAP
            vec4 texelColor = texture2D( map, dynamic_uv );
            texelColor = mapTexelToLinear( texelColor );
            texelColor.a *= opacity;
            diffuseColor = texelColor;
        #endif
    `,
    alphamap_fragment: 
    `
        #ifdef USE_ALPHAMAP
            diffuseColor.a *= texture2D( alphaMap, dynamic_uv ).g;   
        #endif
    `,
    emissivemap_fragment: 
    `
        #ifdef USE_EMISSIVEMAP
            vec4 emissiveColor = texture2D( emissiveMap, dynamic_uv );
            emissiveColor.rgb = emissiveMapTexelToLinear( emissiveColor ).rgb;
            totalEmissiveRadiance *= emissiveColor.rgb;
        #endif
    `,
    specularmap_fragment: 
    `
        float specularStrength;
        #ifdef USE_SPECULARMAP
            vec4 texelSpecular = texture2D( specularMap, dynamic_uv );
            specularStrength = texelSpecular.r;
        #else
            specularStrength = 1.0;
        #endif
    `,
    bumpmap_pars_fragment: 
    `
        #ifdef USE_BUMPMAP
            uniform sampler2D bumpMap;
            uniform float bumpScale;
            // Bump Mapping Unparametrized Surfaces on the GPU by Morten S. Mikkelsen
            // http://api.unrealengine.com/attachments/Engine/Rendering/LightingAndShadows/BumpMappingWithoutTangentSpace/mm_sfgrad_bump.pdf
            // Evaluate the derivative of the height w.r.t. screen-space using forward differencing (listing 2)
            
            vec2 dHdxy_fwd() {
                vec2 repeat = uRepeat;
                vec2 dynamic_uv = fract(vUv * repeat + vec2(uTime) * uTimeXY );
                vec2 dSTdx = dFdx( dynamic_uv );
                vec2 dSTdy = dFdy( dynamic_uv );
                float Hll = bumpScale * texture2D( bumpMap, dynamic_uv ).x;
                float dBx = bumpScale * texture2D( bumpMap, dynamic_uv + dSTdx ).x - Hll;
                float dBy = bumpScale * texture2D( bumpMap, dynamic_uv + dSTdy ).x - Hll;
                return vec2( dBx, dBy );
            }
            vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy ) {
                // Workaround for Adreno 3XX dFd*( vec3 ) bug. See #9988
                vec3 vSigmaX = vec3( dFdx( surf_pos.x ), dFdx( surf_pos.y ), dFdx( surf_pos.z ) );
                vec3 vSigmaY = vec3( dFdy( surf_pos.x ), dFdy( surf_pos.y ), dFdy( surf_pos.z ) );
                vec3 vN = surf_norm;		// normalized
                vec3 R1 = cross( vSigmaY, vN );
                vec3 R2 = cross( vN, vSigmaX );
                float fDet = dot( vSigmaX, R1 );
                fDet *= ( float( gl_FrontFacing ) * 2.0 - 1.0 );
                vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
                return normalize( abs( fDet ) * surf_norm - vGrad );
            }
        #endif
    `,
    displacementmap_vertex: 
    `
        #ifdef USE_DISPLACEMENTMAP
            vec2 repeat = uRepeat;
            vec2 dynamic_uv = fract(vUv * repeat + vec2(uTime) * uTimeXY );
            transformed += normalize( objectNormal ) * ( texture2D( displacementMap, dynamic_uv).x * displacementScale + displacementBias );
        #endif
    `,
    metalnessmap_fragment:
    `
        float metalnessFactor = metalness;
            #ifdef USE_METALNESSMAP
            vec4 texelMetalness = texture2D( metalnessMap, dynamic_uv );
            // reads channel B, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
            metalnessFactor = texelMetalness.b;
        #endif
    `,
    roughnessmap_fragment:
    `
        float roughnessFactor = roughness;
        #ifdef USE_ROUGHNESSMAP
            vec4 texelRoughness = texture2D( roughnessMap, dynamic_uv );
            // reads channel G, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
            roughnessFactor = texelRoughness.g;
        #endif
    `
};