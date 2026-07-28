"""Retarget user-supplied football FBX motions onto the Futbahl armature.

Run with Blender, not the system Python:
  blender --background --python tools/football-animation/import_fbx.py -- \
    --input-dir /absolute/path/to/licensed-fbx \
    --output /absolute/path/to/football-actions.glb

The output contains armature nodes and selected animation channels only. Meshes,
materials, images, and textures are removed before export.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

import bpy


TARGET_BONES = {
    "head": "Head",
    "neck": "neck_01",
    "hips": "pelvis",
    "pelvis": "pelvis",
    "spine": "spine_01",
    "spine1": "spine_02",
    "spine2": "spine_03",
    "leftshoulder": "clavicle_l",
    "rightshoulder": "clavicle_r",
    "leftarm": "upperarm_l",
    "rightarm": "upperarm_r",
    "leftforearm": "lowerarm_l",
    "rightforearm": "lowerarm_r",
    "lefthand": "hand_l",
    "righthand": "hand_r",
    "leftupleg": "thigh_l",
    "rightupleg": "thigh_r",
    "leftleg": "calf_l",
    "rightleg": "calf_r",
    "leftfoot": "foot_l",
    "rightfoot": "foot_r",
    "lefttoe": "ball_l",
    "righttoe": "ball_r",
}


def normalized(name: str) -> str:
    return re.sub(r"[^a-z0-9]", "", name.lower()).replace("mixamorig", "")


def arguments() -> argparse.Namespace:
    raw = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-dir", required=True, type=Path)
    parser.add_argument(
        "--manifest",
        type=Path,
        default=Path(__file__).with_name("clip-manifest.json"),
    )
    parser.add_argument("--target", type=Path)
    parser.add_argument("--output", required=True, type=Path)
    return parser.parse_args(raw)


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in (bpy.data.meshes, bpy.data.materials, bpy.data.images, bpy.data.textures):
        for item in list(collection):
            collection.remove(item)


def only_armature(objects: list[bpy.types.Object]) -> bpy.types.Object:
    armatures = [obj for obj in objects if obj.type == "ARMATURE"]
    if len(armatures) != 1:
        raise RuntimeError(f"Expected one armature, found {len(armatures)}")
    return armatures[0]


def source_to_target_bone(source_name: str, target_armature: bpy.types.Object) -> str | None:
    source_key = normalized(source_name)
    direct = next(
        (bone.name for bone in target_armature.data.bones if normalized(bone.name) == source_key),
        None,
    )
    if direct:
        return direct
    for alias, target in TARGET_BONES.items():
        if source_key.endswith(alias) and target_armature.data.bones.get(target):
            return target
    return None


def retarget_action(
    source_action: bpy.types.Action,
    source_armature: bpy.types.Object,
    target_armature: bpy.types.Object,
    clip_id: str,
) -> bpy.types.Action:
    action = bpy.data.actions.new(clip_id)
    source_height = max(0.01, source_armature.dimensions.z)
    target_height = max(0.01, target_armature.dimensions.z)
    translation_scale = target_height / source_height
    for curve in source_action.fcurves:
        match = re.search(r'pose\.bones\["([^"]+)"\]\.(.+)', curve.data_path)
        if not match:
            continue
        source_bone, property_name = match.groups()
        target_bone = source_to_target_bone(source_bone, target_armature)
        if not target_bone or property_name == "scale":
            continue
        if property_name == "location" and target_bone != "pelvis":
            continue
        target_curve = action.fcurves.new(
            data_path=f'pose.bones["{target_bone}"].{property_name}',
            index=curve.array_index,
            action_group=target_bone,
        )
        for point in curve.keyframe_points:
            value = point.co.y * (translation_scale if property_name == "location" else 1)
            inserted = target_curve.keyframe_points.insert(point.co.x, value)
            inserted.interpolation = point.interpolation
    if not action.fcurves:
        bpy.data.actions.remove(action)
        raise RuntimeError(f"{clip_id}: no compatible humanoid bone channels were found")
    return action


def main() -> None:
    args = arguments()
    manifest = json.loads(args.manifest.read_text())
    target_path = args.target or (args.manifest.parent / manifest["targetBaseModel"]).resolve()
    clear_scene()
    bpy.ops.import_scene.gltf(filepath=str(target_path))
    target_armature = only_armature(list(bpy.context.scene.objects))
    target_armature.name = "FutbahlAnimationArmature"

    imported_actions: list[bpy.types.Action] = []
    for clip in manifest["clips"]:
        source_path = args.input_dir / clip["file"]
        if not source_path.exists():
            print(f"SKIP missing licensed source: {source_path}")
            continue
        before = set(bpy.context.scene.objects)
        bpy.ops.import_scene.fbx(filepath=str(source_path), use_anim=True, automatic_bone_orientation=False)
        imported = [obj for obj in bpy.context.scene.objects if obj not in before]
        source_armature = only_armature(imported)
        source_action = source_armature.animation_data.action if source_armature.animation_data else None
        if source_action is None:
            raise RuntimeError(f"{source_path}: no active animation action")
        imported_actions.append(retarget_action(source_action, source_armature, target_armature, clip["id"]))
        for obj in imported:
            if obj.name in bpy.data.objects:
                bpy.data.objects.remove(obj, do_unlink=True)

    if not imported_actions:
        raise RuntimeError("No licensed FBX clips were converted")

    target_armature.animation_data_create()
    target_armature.animation_data.action = imported_actions[0]
    for action in imported_actions:
        track = target_armature.animation_data.nla_tracks.new()
        track.name = action.name
        track.strips.new(action.name, int(action.frame_range[0]), action)

    for obj in list(bpy.context.scene.objects):
        if obj != target_armature:
            bpy.data.objects.remove(obj, do_unlink=True)
    for collection in (bpy.data.meshes, bpy.data.materials, bpy.data.images, bpy.data.textures):
        for item in list(collection):
            collection.remove(item)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    target_armature.select_set(True)
    bpy.context.view_layer.objects.active = target_armature
    bpy.ops.export_scene.gltf(
        filepath=str(args.output),
        export_format="GLB",
        use_selection=True,
        export_animations=True,
        export_nla_strips=True,
        export_materials="NONE",
        export_skins=True,
        export_morph=False,
        export_cameras=False,
        export_lights=False,
    )
    print(f"Wrote {len(imported_actions)} selected animation clips to {args.output}")


if __name__ == "__main__":
    main()
