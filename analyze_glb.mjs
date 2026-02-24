/**
 * GLB Structure Analyzer for MAZE-HUNT 4-arm bug investigation.
 *
 * Loads each enemy GLB file and reports:
 *   - Number of SkinnedMesh nodes
 *   - Number of regular Mesh nodes
 *   - Whether multiple SkinnedMeshes share the same Skeleton instance
 *   - Bone names for each unique Skeleton
 *   - Bone count differences between skeletons
 *   - Whether bone names overlap (same names in different skeletons)
 */

// Polyfill browser globals required by three.js r128
if (typeof self === 'undefined') globalThis.self = globalThis;
if (typeof window === 'undefined') globalThis.window = globalThis;
if (typeof document === 'undefined') {
    globalThis.document = {
        createElementNS: (ns, tag) => {
            if (tag === 'img' || tag === 'canvas') return createMockImage();
            return { style: {} };
        },
        createElement: (tag) => {
            if (tag === 'img' || tag === 'canvas') return createMockImage();
            return { style: {}, getContext: () => null };
        },
    };
}
if (typeof Image === 'undefined') {
    globalThis.Image = function() { return createMockImage(); };
}
if (typeof ImageBitmap === 'undefined') {
    globalThis.ImageBitmap = function() {};
}
if (typeof createImageBitmap === 'undefined') {
    globalThis.createImageBitmap = function() {
        return Promise.resolve({ width: 1, height: 1, close: () => {} });
    };
}

function createMockImage() {
    const img = {
        width: 1, height: 1, data: new Uint8Array(4),
        style: {},
        _listeners: {},
        addEventListener: function(evt, fn) {
            this._listeners[evt] = this._listeners[evt] || [];
            this._listeners[evt].push(fn);
        },
        removeEventListener: function(evt, fn) {
            if (this._listeners[evt]) {
                this._listeners[evt] = this._listeners[evt].filter(f => f !== fn);
            }
        },
        set src(v) {
            this._src = v;
            // Trigger load callback asynchronously
            setTimeout(() => {
                if (this._listeners.load) {
                    this._listeners.load.forEach(fn => fn());
                }
            }, 0);
        },
        get src() { return this._src || ''; },
    };
    return img;
}

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import fs from 'fs';
import path from 'path';

const CHARACTERS_DIR = '/private/tmp/MAZE-HUNT/characters';

// Enemy GLB files (from CHARACTER_LIST)
const ENEMY_FILES = [
    'Hallin.glb',
    'zombie.glb',
    'Vampire.glb',
    'Mutant.glb',
    'Desbiens.glb',
    'Skeletonzombi.glb',
];

// Also analyze runner files for comparison
const RUNNER_FILES = [
    'Atienza.glb',
    'Erika.glb',
    'Aj.glb',
    'Granny.glb',
    'CH03.glb',
    'CH18.glb',
];

function loadGLB(filePath) {
    return new Promise((resolve, reject) => {
        const buffer = fs.readFileSync(filePath);
        const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

        const loader = new GLTFLoader();
        loader.parse(arrayBuffer, path.dirname(filePath) + '/', (gltf) => {
            resolve(gltf);
        }, (error) => {
            reject(error);
        });
    });
}

function analyzeGLTF(gltf, filename) {
    const scene = gltf.scene;
    scene.updateMatrixWorld(true);

    const skinnedMeshes = [];
    const regularMeshes = [];
    const allBones = [];

    scene.traverse((child) => {
        if (child.isSkinnedMesh && child.geometry) {
            skinnedMeshes.push(child);
        } else if (child.isMesh && child.geometry) {
            regularMeshes.push(child);
        }
        if (child.isBone) {
            allBones.push(child);
        }
    });

    // Identify unique Skeleton instances
    const skeletonMap = new Map(); // skeleton uuid -> { skeleton, meshes }
    for (const sm of skinnedMeshes) {
        if (sm.skeleton) {
            const uuid = sm.skeleton.uuid;
            if (!skeletonMap.has(uuid)) {
                skeletonMap.set(uuid, { skeleton: sm.skeleton, meshes: [] });
            }
            skeletonMap.get(uuid).meshes.push(sm);
        }
    }

    // Analyze each skeleton
    const skeletonDetails = [];
    let skelIdx = 0;
    for (const [uuid, { skeleton, meshes }] of skeletonMap) {
        const boneNames = skeleton.bones.map(b => b.name);
        const uniqueBoneNames = [...new Set(boneNames)];
        const hasDuplicateBoneNames = boneNames.length !== uniqueBoneNames.length;

        skeletonDetails.push({
            index: skelIdx,
            uuid: uuid.substring(0, 8),
            boneCount: skeleton.bones.length,
            uniqueBoneNameCount: uniqueBoneNames.length,
            hasDuplicateBoneNames,
            boneNames: uniqueBoneNames,
            meshNames: meshes.map(m => m.name || '(unnamed)'),
            meshVertexCounts: meshes.map(m => m.geometry.attributes.position.count),
        });
        skelIdx++;
    }

    // Check for bone name overlap between different skeletons
    let boneNameOverlap = [];
    if (skeletonDetails.length > 1) {
        for (let i = 0; i < skeletonDetails.length; i++) {
            for (let j = i + 1; j < skeletonDetails.length; j++) {
                const setA = new Set(skeletonDetails[i].boneNames);
                const setB = new Set(skeletonDetails[j].boneNames);
                const overlap = [...setA].filter(name => setB.has(name));
                if (overlap.length > 0) {
                    boneNameOverlap.push({
                        skeletonA: i,
                        skeletonB: j,
                        overlapCount: overlap.length,
                        overlapNames: overlap,
                    });
                }
            }
        }
    }

    // Detect if bone names have mixamorig prefix or not
    const allBoneNames = allBones.map(b => b.name);
    const hasMixamorigPrefix = allBoneNames.some(n => n.startsWith('mixamorig'));
    const hasColonInNames = allBoneNames.some(n => n.includes(':'));

    // Check scene hierarchy for multiple armatures
    const armatures = [];
    scene.traverse((child) => {
        // Armatures are typically Object3D or Bone with specific naming
        if (child.type === 'Object3D' || child.type === 'Bone') {
            if (child.name && (child.name.toLowerCase().includes('armature') || child.name.toLowerCase().includes('skeleton'))) {
                armatures.push({ name: child.name, type: child.type, childCount: child.children.length });
            }
        }
    });

    // Check if SkinnedMeshes have different bindMatrix values
    const bindMatrices = skinnedMeshes.map(sm => ({
        name: sm.name,
        bindMode: sm.bindMode,
        bindMatrixDiag: [sm.bindMatrix.elements[0], sm.bindMatrix.elements[5], sm.bindMatrix.elements[10]],
        bindMatrixTrans: [sm.bindMatrix.elements[12], sm.bindMatrix.elements[13], sm.bindMatrix.elements[14]],
    }));

    // Animations
    const animations = (gltf.animations || []).map(clip => ({
        name: clip.name,
        duration: clip.duration,
        trackCount: clip.tracks.length,
        trackTypes: [...new Set(clip.tracks.map(t => {
            const dot = t.name.lastIndexOf('.');
            return dot >= 0 ? t.name.substring(dot + 1) : t.name;
        }))],
        targetBoneNames: [...new Set(clip.tracks.map(t => {
            const dot = t.name.lastIndexOf('.');
            const slash = t.name.lastIndexOf('/');
            return t.name.substring(slash + 1, dot >= 0 ? dot : undefined);
        }))],
    }));

    return {
        filename,
        skinnedMeshCount: skinnedMeshes.length,
        regularMeshCount: regularMeshes.length,
        totalBoneObjects: allBones.length,
        uniqueSkeletonCount: skeletonMap.size,
        hasMixamorigPrefix,
        hasColonInNames,
        armatures,
        skeletons: skeletonDetails,
        boneNameOverlap,
        bindMatrices,
        animations,
    };
}

async function main() {
    console.log('=== MAZE-HUNT GLB Structure Analyzer ===\n');

    const allFiles = [...ENEMY_FILES.map(f => ({ name: f, type: 'ENEMY' })), ...RUNNER_FILES.map(f => ({ name: f, type: 'RUNNER' }))];

    const problematicModels = [];

    for (const { name: filename, type } of allFiles) {
        const filePath = path.join(CHARACTERS_DIR, filename);
        if (!fs.existsSync(filePath)) {
            console.log(`[SKIP] ${filename} not found`);
            continue;
        }

        try {
            const gltf = await loadGLB(filePath);
            const analysis = analyzeGLTF(gltf, filename);

            const isProblematic = analysis.uniqueSkeletonCount > 1 || analysis.boneNameOverlap.length > 0;
            if (isProblematic) problematicModels.push(analysis);

            console.log(`${'='.repeat(60)}`);
            console.log(`[${type}] ${filename} ${isProblematic ? ' *** POTENTIAL 4-ARM BUG ***' : ''}`);
            console.log(`${'='.repeat(60)}`);
            console.log(`  SkinnedMeshes: ${analysis.skinnedMeshCount}`);
            console.log(`  Regular Meshes: ${analysis.regularMeshCount}`);
            console.log(`  Total Bone Objects: ${analysis.totalBoneObjects}`);
            console.log(`  Unique Skeleton Instances: ${analysis.uniqueSkeletonCount}`);
            console.log(`  Has mixamorig prefix: ${analysis.hasMixamorigPrefix}`);
            console.log(`  Has colon in names: ${analysis.hasColonInNames}`);

            if (analysis.armatures.length > 0) {
                console.log(`  Armature nodes:`);
                for (const a of analysis.armatures) {
                    console.log(`    - ${a.name} (${a.type}, ${a.childCount} children)`);
                }
            }

            for (const skel of analysis.skeletons) {
                console.log(`  --- Skeleton #${skel.index} (uuid: ${skel.uuid}) ---`);
                console.log(`    Bones: ${skel.boneCount} (${skel.uniqueBoneNameCount} unique names)`);
                console.log(`    Has duplicate bone names: ${skel.hasDuplicateBoneNames}`);
                console.log(`    Meshes using this skeleton:`);
                for (let i = 0; i < skel.meshNames.length; i++) {
                    console.log(`      - ${skel.meshNames[i]} (${skel.meshVertexCounts[i]} vertices)`);
                }
                console.log(`    Bone names: ${skel.boneNames.join(', ')}`);
            }

            if (analysis.boneNameOverlap.length > 0) {
                console.log(`  !!! BONE NAME OVERLAP between skeletons !!!`);
                for (const ov of analysis.boneNameOverlap) {
                    console.log(`    Skel#${ov.skeletonA} vs Skel#${ov.skeletonB}: ${ov.overlapCount} shared names`);
                    console.log(`    Shared: ${ov.overlapNames.join(', ')}`);
                }
            }

            if (analysis.bindMatrices.length > 0) {
                console.log(`  Bind matrices:`);
                for (const bm of analysis.bindMatrices) {
                    console.log(`    - ${bm.name}: mode=${bm.bindMode} diag=[${bm.bindMatrixDiag.map(v=>v.toFixed(3)).join(',')}] trans=[${bm.bindMatrixTrans.map(v=>v.toFixed(3)).join(',')}]`);
                }
            }

            if (analysis.animations.length > 0) {
                console.log(`  Embedded animations: ${analysis.animations.length}`);
                for (const anim of analysis.animations) {
                    console.log(`    - "${anim.name}" dur=${anim.duration.toFixed(2)}s tracks=${anim.trackCount} types=[${anim.trackTypes.join(',')}]`);
                    console.log(`      targets: ${anim.targetBoneNames.join(', ')}`);
                }
            } else {
                console.log(`  Embedded animations: NONE`);
            }

            console.log('');
        } catch (err) {
            console.error(`[ERROR] ${filename}: ${err.message}`);
            console.log('');
        }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    if (problematicModels.length === 0) {
        console.log('No models with multiple skeleton instances or bone name overlap detected.');
        console.log('The 4-arm bug may be caused by something else (e.g., static meshes + skinned meshes).');
    } else {
        console.log(`Found ${problematicModels.length} model(s) with potential 4-arm issues:`);
        for (const m of problematicModels) {
            console.log(`  ${m.filename}:`);
            console.log(`    ${m.uniqueSkeletonCount} unique skeleton instances`);
            if (m.boneNameOverlap.length > 0) {
                console.log(`    Bone name overlap means procedural animation via name-matching`);
                console.log(`    will animate ALL bone objects with that name.`);
                console.log(`    If skeletons have different bone hierarchies, this could cause issues.`);
            }
        }
    }
}

main().catch(console.error);
