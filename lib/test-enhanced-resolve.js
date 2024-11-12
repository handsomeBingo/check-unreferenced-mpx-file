const fs = require("fs");
const { CachedInputFileSystem, ResolverFactory } = require("enhanced-resolve");

// create a resolver
const Resolver = ResolverFactory.createResolver({
  // Typical usage will consume the `fs` + `CachedInputFileSystem`, which wraps Node.js `fs` to add caching.
  fileSystem: new CachedInputFileSystem(fs, 4000),
  useSyncFileSystemCalls: true,
  extensions: [".mpx"]
  /* any other resolver options here. Options/defaults can be seen below */
});

console.log(Resolver.resolveSync(__dirname, '/Users/didi/Documents/kf-mp-apphome/src/subpackage/homepage', './pages/index.mpx?root=home'))
