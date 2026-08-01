# Futbahl Quaternius animation system

## Sources and license

- Universal Animation Library Standard: Quaternius, CC0 1.0.
- Universal Animation Library 2 Standard: Quaternius, CC0 1.0.
- Universal Base Characters: Quaternius, CC0 1.0.

Futbahl uses the non-root-motion GLBs. Gameplay code remains authoritative for
player position, heading, ball contact, physics, AI, rules, and restarts. The
animation controller only drives the cloned visual skeleton beneath each
gameplay player group.

## Runtime architecture

- One cached promise loads the base character, both animation libraries, hair,
  and the uniform wordmark.
- Retargeted `AnimationClip` objects are shared by all players.
- Each active player owns one `AnimationMixer` because mixers bind actions to a
  particular cloned skeleton. Actions are created lazily and cached.
- Distant players update their mixers at 30 Hz; visible gameplay characters run
  at render frequency.
- Root translation tracks are stripped except for the pelvis height channel.
  No clip can displace the AI-controlled player group.
- Per-player idle phase and playback variation avoid synchronized movement.

## State priority

1. Keeper dive, slide tackle, recovery, pass/shot, header, catch, block.
2. Celebration, pass request, keeper/defensive ready stance.
3. Sprint, run, jog, walk, diagonal movement, backpedal, shuffle, turn, idle.

Critical timers come from the existing match runtime. They cannot be interrupted
by lower-priority locomotion poses. Crossfades use 0.16–0.18 seconds. Gameplay
applies kick impulses at the beginning of `kickTimer`; the visual foot therefore
starts at contact and follows through, avoiding a delayed or duplicated kick.

## Verified clip mapping

| Futbahl state | Clip or restrained fallback |
| --- | --- |
| Idle | `Idle_Loop`, occasional `Idle_Talking_Loop` |
| Walk/dead-ball repositioning | `Walk_Loop`, `Walk_Formal_Loop` fallback |
| Jog/run/forward diagonals | `Jog_Fwd_Loop` |
| Sprint | `Sprint_Loop` |
| Backpedal/backward diagonals | `Walk_Loop` (in-place fallback) |
| Lateral shuffle | `Jog_Fwd_Loop` plus local-space lean fallback |
| Defensive/keeper ready | `Crouch_Idle_Loop` |
| Moving defensive posture | `Crouch_Fwd_Loop` where selected by context |
| Header/jump | `Jump_Start`; existing physical head-contact code remains authoritative |
| Slide tackle | UAL2 `Slide_Loop` plus football leg-contact overlay |
| Tackle recovery | UAL2 `Slide_Exit` |
| Pass/shot/goal kick | Procedural plant-leg, swing, body lean, and follow-through |
| Keeper catch/parry/dive | Procedural two-arm catch and direction-aware dive overlay |
| Pass request | Upper-body arm raise; `Interact` only while nearly stationary |
| Goal celebration | `Dance_Loop` with three restrained per-player upper-body variants |
| Contact reaction | `Hit_Chest` / `Hit_Head` available but not attached to routine contact |
| Bench | Sitting clips are available, but Futbahl has no bench character system |

## Deliberately unused clips

Weapon, combat, death, zombie, swimming, farming, fishing, driving, spell, and
martial-arts clips are not used. `Roll_RM` and other root-motion clips are not
used in live gameplay.

## Requested states without a natural verified clip

- Football short pass, long pass, shot, shield, standing catch, low/full-stretch
  goalkeeper dive, parry, underarm throw, punt, missed-chance reaction, and
  referee card/direction signals have no natural dedicated clip in the free
  verified libraries.
- UAL2 `OverhandThrow` is available, but the current match runtime has no
  separate hand-throw release action. It is not substituted for a foot
  distribution because that would visually contradict gameplay.
- Futbahl currently has no referee or substitute/bench models to animate. No new
  rule, referee, bench, spectator, or crowd entity was added.

These states use existing restrained skeletal overlays or remain unchanged. No
unrelated animation is used merely to increase the animation count.

## Clip inventory

### Universal Animation Library prototype

`A_TPose`, `Crouch_Fwd_Loop`, `Crouch_Idle_Loop`, `Dance_Loop`, `Death01`,
`Driving_Loop`, `Fixing_Kneeling`, `Hit_Chest`, `Hit_Head`, `Idle_Loop`,
`Idle_Talking_Loop`, `Idle_Torch_Loop`, `Interact`, `Jog_Fwd_Loop`,
`Jump_Land`, `Jump_Loop`, `Jump_Start`, `PickUp_Table`, `Pistol_Aim_Down`,
`Pistol_Aim_Neutral`, `Pistol_Aim_Up`, `Pistol_Idle_Loop`, `Pistol_Reload`,
`Pistol_Shoot`, `Punch_Cross`, `Punch_Enter`, `Punch_Jab`, `Push_Loop`, `Roll`,
`Roll_RM`, `Sitting_Enter`, `Sitting_Exit`, `Sitting_Idle_Loop`,
`Sitting_Talking_Loop`, `Spell_Simple_Enter`, `Spell_Simple_Exit`,
`Spell_Simple_Idle_Loop`, `Spell_Simple_Shoot`, `Sprint_Loop`, `Swim_Fwd_Loop`,
`Swim_Idle_Loop`, `Sword_Attack`, `Sword_Attack_RM`, `Sword_Idle`,
`Walk_Formal_Loop`, `Walk_Loop`.

### Universal Animation Library 2 Standard

`A_TPose`, `Chest_Open`, `ClimbUp_1m`, `Consume`, `Farm_Harvest`,
`Farm_PlantSeed`, `Farm_Watering`, `Hit_Knockback`, `Idle_FoldArms_Loop`,
`Idle_Lantern_Loop`, `Idle_No_Loop`, `Idle_Rail_Call`, `Idle_Rail_Loop`,
`Idle_Shield_Break`, `Idle_Shield_Loop`, `Idle_TalkingPhone_Loop`, `LayToIdle`,
`Melee_Hook`, `Melee_Hook_Rec`, `NinjaJump_Idle_Loop`, `NinjaJump_Land`,
`NinjaJump_Start`, `OverhandThrow`, `Shield_Dash`, `Shield_OneShot`,
`Slide_Exit`, `Slide_Loop`, `Slide_Start`, `Sword_Block`, `Sword_Dash`,
`Sword_Heavy_Combo`, `Sword_Regular_A`, `Sword_Regular_A_Rec`,
`Sword_Regular_B`, `Sword_Regular_B_Rec`, `Sword_Regular_C`,
`Sword_Regular_Combo`, `TreeChopping_Loop`, `Walk_Carry_Loop`, `Yes`,
`Zombie_Idle_Loop`, `Zombie_Scratch`, `Zombie_Walk_Fwd_Loop`.
