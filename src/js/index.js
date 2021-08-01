import 'regenerator-runtime/runtime';
import '../css/main.css';
import * as THREE from 'three';
import {fonts} from './assets/assets';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { BasicType, LambertType, PhongType, NormalType, StandardType, ToonType } from './components/three-type-materials/all';

const MyScene = new function(){
    this.container = document.getElementById('webGL');
    this.bounds = this.container.getBoundingClientRect();
    this.width = this.bounds.width;
    this.height = this.bounds.height;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, this.width/this.height, 0.1, 400);
    this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x111111);
    this.time = 0;
    this.clock = new THREE.Clock();
    this.orbitControl = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControl.enableDamping = true;
    this.orbitControl.dampingFactor = 0.05;

    this.create = async () => {

        this.typeMaterials = [];

        const fontSetting = {
            fnt: fonts.montserrat.fnt,
            png: fonts.montserrat.png,
        }

        this.typeBasic = new BasicType({
            ...fontSetting,
            text: 'BASIC',
            color: 0xffff00,
            background: 0x0000ff,
            useAlphaMap: true,
            alphaSpace: 'outer',
            alphaIntensity: 0.5,
            useDisplacementMap: true
        });
        this.typeBasicMat = await this.typeBasic.getMaterial({
            alphaTest: 0,
        });

        this.typeLambert = new LambertType({
            ...fontSetting,
            text: 'LAMBERT',
            color: 0xffff00,
            background: 0x0000ff,
            useAlphaMap: true,
            alphaSpace: 'outer',
            alphaIntensity: 0.5,
            uniforms: {
                uRepeat: new THREE.Vector2(2,2)
            },
            transform: {
               // translate: new THREE.Vector3(0,0,-40),
                scale: new THREE.Vector3(0.6,2,1)
            }
        });
        this.typeLambertMat = await this.typeLambert.getMaterial({
            alphaTest: 0,
        });

        this.typePhong = new PhongType({
            ...fontSetting,
            text: 'PHONG',
            color: 0xffff00,
            background: 0x0000ff,
            useSpecularMap: true,
            specularColorIntensity: 0,
            specularBackgroundIntensity: 1,
            useBumpMap: true,
            bumpSpace: 'inner',
            uniforms: {
                uTimeXY: new THREE.Vector2(0,0.3)
            },
            transform: {
                scale: new THREE.Vector2(0.6,2)
            }
        });
        this.typePhongMat = await this.typePhong.getMaterial({
            specular: 0xffffff,
            shininess: 3000
        });

        this.typeNormal = new NormalType({
            ...fontSetting,
            text: 'NORMAL',
            useBumpMap: true,
            bumpMapIntensity: 1,
            useDisplacementMap: true,
            displacementSpace: 'outer',
            uniforms: {
                uTimeXY: new THREE.Vector2(0.2,0)
            },
            transform: {
                scale: new THREE.Vector2(0.7,1)
            }
        });
        this.typeNormalMat = await this.typeNormal.getMaterial({
            bumpScale: 4,
            wireframe: false,
            displacementScale: 0.5
        });

        this.typeStandard = new StandardType({
            ...fontSetting,
            text: 'STANDARD',
            color: 0xffff00,
            background: 0x0000ff,
            useMetalnessMap: true,
            metalnessSpace: 'inner',
            metalnessIntensity: 0.8,
            useRoughnessMap: true,
            roughnessSpace: 'outer',
            roughnessIntensity: 1,
            useAlphaMap: false,
            alphaSpace: 'outer',
            alphaIntensity: 0.6,
            transform: {
                scale: new THREE.Vector2(0.6,2)
            }
        });
        this.typeStandardMat = await this.typeStandard.getMaterial({
            alphaTest: 0.0
        });

        this.typeToon = new ToonType({
            ...fontSetting,
            text: 'TOON',
            color: 0xffff00,
            background: 0x0000ff,
            useEmissiveMap: true,
            emissiveColor: new THREE.Color(0xffffff),
            emissiveBackground: new THREE.Color(0xffff00),
            useAlphaMap: true,
            alphaSpace: 'inner',
            alphaIntensity: 0.5,
        });
        this.typeToonMat = await this.typeToon.getMaterial({
            emissive: new THREE.Color(0x333333),
            alphaTest: 0,
        });

        this.typeMaterials.push(
            this.typeBasicMat,
            this.typeLambertMat,
            this.typePhongMat,
            this.typeNormalMat,
            this.typeStandardMat,
            this.typeToonMat
        );

        const rows = 2;
        const offset = 13;
        this.group = new THREE.Object3D();
        for(let x = 0; x < this.typeMaterials.length; x++){
            let y = Math.floor(x/(this.typeMaterials.length/rows));
            const box = new THREE.Mesh(
                (this.typeMaterials[x] instanceof THREE.MeshNormalMaterial ? new THREE.SphereGeometry(5,180,80) : new THREE.BoxGeometry(10,10,10)),
                this.typeMaterials[x]
            );
            box.position.set(
                (x*offset-y*offset*(this.typeMaterials.length/rows)) , 
                y*offset + offset/2 - 0,
                0
            );
            this.group.add(box);
        }
        const bBox = new THREE.Box3().setFromObject(this.group);
        this.group.position.x = -bBox.max.x/2 - bBox.min.x/2;
        this.group.position.y = -bBox.max.y/2 - bBox.min.y/2;
        this.scene.add(this.group);



        this.axisHelper = new THREE.AxisHelper(60);
        this.scene.add(this.axisHelper);


        const lighting = (() => {
            this.directionalLight = new THREE.DirectionalLight(0x444444, 4);
            this.directionalLight.position.set(100,100,100);
            this.scene.add(this.directionalLight);

            this.spotLight = new THREE.SpotLight(0xffffff, 0.5);
            this.spotLight.position.set(0,50,0);
            this.scene.add(this.spotLight);

            this.spotLight1 = new THREE.SpotLight(0xffffff, 1.5);
            this.spotLight1.position.set(50,50,50);
            this.scene.add(this.spotLight1);
            this.scene.add(new THREE.SpotLightHelper(this.spotLight1));

            this.hemisphereLight = new THREE.HemisphereLight(0xcccccc, 0x333333, 1);
            this.scene.add(this.hemisphereLight)
        })();
        
    }

    

    this.update = () => {
        if(this.box) this.box.rotation.y = this.time;
        if(this.typeBasic) this.typeBasic.update(this.time);
        if(this.typeLambert) this.typeLambert.update(this.time);
        if(this.typePhong) this.typePhong.update(this.time);
        if(this.typeNormal) this.typeNormal.update(this.time);
        if(this.typeStandard) this.typeStandard.update(this.time);
        if(this.typeToon) this.typeToon.update(this.time);
        if(this.spotLight1) this.spotLight1.position.set(
            Math.cos(this.time) * 100,
            0,
            Math.sin(this.time) * 100
        );
        this.spotLight1.lookAt(0,0,0);
    }

    this.init = () => {
        this.scene.add(this.camera);
        this.container.appendChild(this.renderer.domElement);
        this.camera.position.set(50,50,50);
        this.camera.lookAt(0,0,0);

        this.create();
        this.animate();
    }

    this.resize = () => {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.renderer.setSize(this.width, this.height);
        this.camera.aspect = this.width/this.height;
        this.camera.updateProjectionMatrix();
    }

    this.addEvents = () => {
        this.container.addEventListener('resize', this.resize().bind(this)); 
    }

    this.render = () => {
        this.renderer.render(this.scene, this.camera);
    }

    this.animate = () => {
        this.animationFrame = window.requestAnimationFrame(()=>this.animate());
        this.time = this.clock.getElapsedTime();
        this.orbitControl.update();
        this.update();
        this.render();
    }
}

MyScene.init();