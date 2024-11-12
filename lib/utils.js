const path = require('path')
const JSON5 = require('json5')
const fs = require('fs')
function evalJSONJS (source, filename, defs) {
  const defKeys = Object.keys(defs)
  const defValues = defKeys.map((key) => {
    return defs[key]
  })
  const dirname = path.dirname(filename)
  // eslint-disable-next-line no-new-func
  const func = new Function('module', 'exports', 'require', '__filename', '__dirname', ...defKeys, source)
  const module = {
    exports: {}
  }
  func(module, module.exports, function (request) {
    if (request.startsWith('.')) {
      request = path.join(dirname, request)
    }
    const filename = require.resolve(request)
    const source = fs.readFileSync(filename, 'utf-8')
    return evalJSONJS(source, request, defs)
  }, filename, dirname, ...defValues)

  return module.exports
}

function readJsonFromMpx (entryFile, defs) {
  let data;
  try {
    data = fs.readFileSync(entryFile, { encoding: 'utf-8' })
  } catch (e) {
    data = fs.readFileSync(entryFile.replace(/\.mpx/g, '/index.mpx'), { encoding: 'utf-8' })
  }
  // console.log(data)
  const scriptExecResult = /(?:<script\s*(?:name|type)?="(application\/)?json">)([\s\S]+)(?:<\/script>)/img.exec(data)
  if (!scriptExecResult) {
    // console.error('输入有误，无法获取 script:json 的内容', data)
    // 不一定是输入有误，有可能是 page 没有注册 json，他不需要 component 的时候就不用注册
    return undefined
  }
  const isRealJSON = scriptExecResult[1]
  const scriptContent = scriptExecResult[2]
  if (isRealJSON && scriptContent) {
    return JSON5.parse(scriptContent)
  }
  return evalJSONJS(scriptContent, entryFile, defs)
}

const { CachedInputFileSystem, ResolverFactory } = require("enhanced-resolve");

// create a resolver with enhanced-resolve
const mpxFileResolver = ResolverFactory.createResolver({
  fileSystem: new CachedInputFileSystem(fs, 4000),
  useSyncFileSystemCalls: true,
  extensions: ['.mpx']
});

function resolveMpxFile (lookUpFrom, request) {
  return mpxFileResolver.resolveSync(__dirname, lookUpFrom, request)
}


module.exports = {
  readJsonFromMpx,
  evalJSONJS,
  resolveMpxFile
}
