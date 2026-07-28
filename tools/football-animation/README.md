# Football motion import

This pipeline accepts **user-supplied, properly licensed** football FBX files. It does not download,
purchase, scrape, or redistribute commercial motion packs. Keep licensed source FBX files outside
the repository.

## Expected input

1. Put only the selected clips listed in `clip-manifest.json` in a private directory.
2. Use the manifest filenames, or edit a local manifest copy to match the licensed files.
3. Confirm that the licence permits compiled-game distribution before placing the generated GLB
   under `public/`.

The selected manifest is intentionally small: 13 locomotion clips, 18 ball actions, 16 goalkeeper
actions, and 4 celebrations. The browser never needs a complete 308-clip collection.

## Convert

Run with Blender 4.x:

```bash
blender --background \
  --python tools/football-animation/import_fbx.py -- \
  --input-dir /absolute/private/path/to/licensed-fbx \
  --output /absolute/private/path/to/football-actions.glb
```

The converter imports the existing Futbahl target armature, maps common humanoid bone names,
copies only selected animation channels, strips meshes/materials/images/textures, and exports an
animation-only GLB. Inspect the result in Blender before shipping it.

## Runtime opt-in

After licence review, host the generated GLB and set:

```bash
NEXT_PUBLIC_FUTBAHL_FOOTBALL_ANIMATIONS_URL=/models/football/football-actions.glb
```

When the variable is absent or the file fails to load, the current Quaternius CC0 animations remain
the fallback. No paid file belongs in Git history without explicit distribution approval.

## Retargeting limitations

Bone aliases cover common humanoid/Mixamo-style names. A commercial pack with a custom rig may
need aliases added to `TARGET_BONES` and a visual foot-contact/root-motion check. The runtime keeps
gameplay translation authoritative; imported root motion should be in-place or cleaned before use.
