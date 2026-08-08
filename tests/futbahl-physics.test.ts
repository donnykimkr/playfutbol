import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { simulateBallTrajectory, stepBallPhysics } from "../src/lib/futbahl-ball-physics.ts";
import { sweptMovingSphereContact } from "../src/lib/futbahl-contact.ts";
import { kickAnimationPhase, kickAnimationProfile } from "../src/lib/futbahl-animation-contact.ts";
import {
  LOCOMOTION_CLIPS,
  locomotionPlaybackRate,
  selectFutbahlLocomotionState,
} from "../src/lib/futbahl-locomotion.ts";
import { receivePassReadiness } from "../src/lib/futbahl-receive-readiness.ts";

const constants = {
  radius: 0.11,
  gravity: 9.81,
  airDrag: 0.018,
  magnus: 0.0018,
  bounce: 0.46,
  rollingFriction: 0.7,
  slidingFriction: 2.7,
  spinDamping: 0.36,
  enterGroundedThreshold: 0.145,
  leaveGroundedThreshold: 0.22,
};

test("identical kick inputs produce identical endpoints", () => {
  const initial = {
    position: new THREE.Vector3(0, constants.radius, 0),
    velocity: new THREE.Vector3(14, 5.5, 23),
    angularVelocity: new THREE.Vector3(20, 4, -12),
    curve: new THREE.Vector3(1.2, 0, -0.4),
    grounded: false,
  };
  const stop = { maxSteps: 1200, stopSpeed: 0.035 };
  const first = simulateBallTrajectory(initial, 1 / 120, constants, stop);
  const second = simulateBallTrajectory(initial, 1 / 120, constants, stop);
  assert.ok(first.endpoint.distanceTo(second.endpoint) < 1e-10);
});

test("goal-plane stop returns the exact crossing plane", () => {
  const result = simulateBallTrajectory({
    position: new THREE.Vector3(0, constants.radius, 0),
    velocity: new THREE.Vector3(2, 2.8, 26),
    angularVelocity: new THREE.Vector3(),
    curve: new THREE.Vector3(),
    grounded: false,
  }, 1 / 120, constants, { maxSteps: 800, goalPlaneZ: 18 });
  assert.ok(Math.abs(result.endpoint.z - 18) < 1e-9);
});

test("a rolling pass decelerates monotonically", () => {
  const state = {
    position: new THREE.Vector3(0, constants.radius, 0),
    velocity: new THREE.Vector3(0, 0, 14),
    angularVelocity: new THREE.Vector3(14 / constants.radius, 0, 0),
    curve: new THREE.Vector3(),
    grounded: true,
  };
  let previous = state.velocity.length();
  for (let index = 0; index < 120; index += 1) {
    stepBallPhysics(state, 1 / 120, constants);
    assert.ok(state.velocity.length() <= previous + 1e-9);
    previous = state.velocity.length();
  }
});

test("moving head catches a fast crossed ball without tunnelling", () => {
  const contact = sweptMovingSphereContact(
    new THREE.Vector3(0, 2.1, -1),
    new THREE.Vector3(0, 2.1, 1),
    new THREE.Vector3(-0.15, 2.1, 0),
    new THREE.Vector3(0.15, 2.1, 0),
    0.42,
  );
  assert.ok(contact);
  assert.ok(contact.distance <= 0.42);
});

test("header contact rejects a ball outside the combined radius", () => {
  const contact = sweptMovingSphereContact(
    new THREE.Vector3(0, 3.1, -1),
    new THREE.Vector3(0, 3.1, 1),
    new THREE.Vector3(0, 2.1, 0),
    new THREE.Vector3(0, 2.1, 0),
    0.42,
  );
  assert.equal(contact, null);
});

test("kick animation exposes preparation, contact and follow-through phases", () => {
  const profile = kickAnimationProfile("shot");
  assert.equal(kickAnimationPhase(0, profile), "preparation");
  assert.equal(kickAnimationPhase(profile.contactAfter, profile), "contact");
  assert.equal(kickAnimationPhase(profile.contactAfter + 0.08, profile), "follow-through");
});

test("run and sprint use distinct locomotion clips", () => {
  assert.equal(LOCOMOTION_CLIPS.Run, "Jog_Fwd_Loop");
  assert.equal(LOCOMOTION_CLIPS.Sprint, "Sprint_Loop");
});

test("locomotion hysteresis keeps a runner stable near a speed threshold", () => {
  assert.equal(selectFutbahlLocomotionState({
    speed: 4.92,
    localForward: 4.92,
    localLateral: 0,
    acceleration: 0.1,
    angularVelocity: 0,
    previousSpeed: 4.88,
    previousState: "Run",
    defensive: false,
  }), "Run");
  assert.equal(selectFutbahlLocomotionState({
    speed: 4.3,
    localForward: -3.2,
    localLateral: 0.4,
    acceleration: 0,
    angularVelocity: 2.8,
    previousSpeed: 4.3,
    previousState: "Run",
    defensive: false,
  }), "TurnAround");
});

test("locomotion playback follows movement direction and speed", () => {
  assert.ok(locomotionPlaybackRate("Run", 6.8) > locomotionPlaybackRate("Run", 4.9));
  assert.ok(locomotionPlaybackRate("Backpedal", 2.5) < 0);
});

test("clean controlled reception permits an intentional one-touch pass", () => {
  const result = receivePassReadiness({
    incomingSpeed: 16,
    receiverSpeed: 2.2,
    ballHeight: 0.18,
    contactDistance: 0.78,
    targetFacingDot: 0.82,
    redirectionDot: 0.38,
    pressureDistance: 3.5,
    passStyle: "short",
  });
  assert.equal(result.oneTouchAllowed, true);
  assert.ok(result.requiredControlTime < 0.2);
});

test("fast awkward reception requires control before another pass", () => {
  const result = receivePassReadiness({
    incomingSpeed: 33,
    receiverSpeed: 7.2,
    ballHeight: 1.05,
    contactDistance: 1.2,
    targetFacingDot: -0.55,
    redirectionDot: -0.7,
    pressureDistance: 0.9,
    passStyle: "through",
  });
  assert.equal(result.oneTouchAllowed, false);
  assert.ok(result.requiredControlTime >= 0.4);
});
