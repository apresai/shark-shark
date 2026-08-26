// OpenNext configuration for @opennextjs/aws.
// Minimal config: defaults are applied for the server, image-optimization,
// revalidation, and warmer functions. The CDK `Nextjs` construct
// (cdk-nextjs-standalone) runs `npx @opennextjs/aws build` against this file.
//
// ---------------------------------------------------------------------------
// DO NOT DELETE THE `imageOptimization.install` BLOCK BELOW.
//
// Without it the image-optimization Lambda ships with NO sharp at all, and
// Next.js image optimization fails at runtime. Two independent reasons:
//
// 1. OpenNext's own default install options are invalid on npm >= 12.
//    `dist/build/installDeps.js` composes the inner install as:
//        npm install --os=linux --arch=arm64 --target=18 --libc=glibc
//        sharp@0.32.6
//    `--arch` and `--target` have never been real npm flags. npm's equivalent
//    of
//    the first is `--cpu`, and it has no equivalent of the second. Older npm
//    ignored unknown flags silently; npm 12 rejects them with EUNKNOWNCONFIG,
//    the install dies, and `installDependencies` swallows it as a logged
//    "Could not install dependencies" rather than failing the build. Read out
//    of
//    the pinned 3.10.4 in node_modules and reproduced against npm 12.0.2 on
//    2026-08-25. The same defaults are reported present in every published
//    OpenNext from 3.5.0 through 4.1.1, so upgrading is not a fix.
//    The two config fields that emit those two flags are `arch` and
//    `nodeVersion`, so this override omits both and passes npm's real flag via
//    `additionalArgs`.
//
// 2. `libc: "glibc"` is load-bearing. Without it npm resolves none of the
//    @img/* platform packages and you get a sharp with no native binary.
//
// `--cpu=arm64` is a correctness fix, not just an unblocking one: npm defaults
// --cpu to the HOST cpu, so an x86 CI runner would otherwise silently build an
// x64 sharp for these ARM64 Lambdas.
//
// sharp is pinned to 0.35.3 rather than left on OpenNext's 0.32.6 default, for
// two reasons.
//
// Security first: everything below 0.35.0 carries GHSA-f88m-g3jw-g9cj (HIGH),
// sharp inheriting libvips CVE-2026-33327 / -33328 / -35590 / -35591. This repo
// declares
// no sharp of its own, so this line is the only thing choosing a version for
// the
// image Lambda.
//
// Second, 0.32.6 predates the prebuilt @img/* packages and relies on an install
// script to fetch a binary for the BUILD machine. That is how the pre-fix
// bundle
// in this repo ended up holding a Mach-O `sharp-darwin-arm64v8.node` destined
// for
// an ARM64 Linux Lambda. 0.35.x declares no install script at all, so it
// sidesteps npm 12's script blocking outright. (The 0.33/0.34 line does declare
// one, `node install/check.js`, but it is only a verification step, so those
// versions survived blocking by luck rather than design.)
//
// This block is only half the fix. The nested install also has to be shielded
// from the developer's ~/.npmrc, which is why both `build:open-next` in
// package.json and `buildCommand` in infra/lib/shark-shark-stack.ts prefix the
// OpenNext invocation with npm_config_userconfig= and
// npm_config_allow_scripts=.
// Removing either half puts the image Lambda back to shipping without sharp.
// Nothing mechanically couples the halves, so both build entries end in
// scripts/assert-sharp-bundle.mjs, which fails the build unless the bundle
// really
// holds an arm64 sharp at or above the version floor.
//
// Same pattern as regist/web, podcaster/portal and eleven9s/admin.
// ---------------------------------------------------------------------------
const config = {
  default: {},
  imageOptimization: {
    install: {
      packages: ["sharp@0.35.3"],
      os: "linux",
      libc: "glibc",
      additionalArgs: "--cpu=arm64",
    },
  },
};

export default config;
