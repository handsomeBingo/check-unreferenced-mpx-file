#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const process = require('process')
const { readJsonFromMpx, resolveMpxFile } = require('./utils')
const cwd = process.cwd()
const { webpackBaseCfgAlias, extensionList, entry, localSrcDir, defs } = require(path.resolve(cwd, './unreferenced-file-config.js'))
const fileMap = {
  [entry[0].absolutePath]: 1
}
const fileArr = []

function checkInFileMapOrNot (p) {
  const hasResult = fileMap[p]
  if (typeof hasResult === 'undefined') return !!hasResult
  fileMap[p]++
}

while (localSrcDir.length) {
  const item = localSrcDir.pop();
  const files = fs.readdirSync(item.absolutePath, { withFileTypes: true });
  files.forEach(f => {
    const fullPath = path.join(f.path, f.name)
    if (f.isDirectory()) {
      localSrcDir.push({ type: 'dir', absolutePath: fullPath })
      return
    }
    if (f.name.endsWith('.mpx')) {
      fileMap[fullPath] = 0
      fileArr.push(fullPath)
    }
  })
}

const appCollections = [
  entry[0].absolutePath
]
const pageCollections = []
const componentCollections = []

while (entry.length) {
  const item = entry.pop()
  const { type, absolutePath } = item
  const dirname = path.dirname(absolutePath);
  const jsonContent = readJsonFromMpx(absolutePath, defs);
  switch (type) {
    case 'app': {
      // 处理 page
      if (jsonContent.pages) {
        jsonContent.pages.map(i => {
          // let p
          // if (!i.endsWith('.mpx')) {
          //   for (const ex of extensionList) {
          //     try {
          //       const test = path.resolve(dirname, i + ex)
          //       require.resolve(test)
          //       p = test
          //       break
          //     } catch (e) {
          //
          //     }
          //   }
          // } else {
          //   p = path.resolve(dirname, i)
          // }
          let p = resolveMpxFile(dirname, i)

          pageCollections.push(p);
          entry.push({ type: 'component', absolutePath: p })
        });
      }

      if (jsonContent.packages) {
        jsonContent.packages.filter(i => i.startsWith('.')).forEach(i => {
          const resolvedPathWithQuery = resolveMpxFile(dirname, i)
          const p = resolvedPathWithQuery.includes('?root=')
            ? resolvedPathWithQuery.slice(0, resolvedPathWithQuery.indexOf('?'))
            : resolvedPathWithQuery;

          appCollections.push(p);

          checkInFileMapOrNot(p);

          entry.push({
            type: 'page',
            absolutePath: p
          })
        })
      }

      break
    }
    case 'page': {
      const pageDir = path.dirname(absolutePath)
      let { pages } = jsonContent
      if (pages && Array.isArray(pages)) {
        pages = pages.map(i => {
          let p = resolveMpxFile(pageDir, i)
          // // 标记引用
          // // map.has(p)
          // try {
          //   fs.statSync(p)
          // } catch (e) {
          //   p = p.replace(/\.mpx/g, '/index.mpx')
          //   fs.statSync(p)
          // }

          pageCollections.push(p)

          checkInFileMapOrNot(p)
          return { type: 'component', absolutePath: p }
        })
        // collect & mark file involved

        entry.push(...pages)
      }
      break
    }
    case 'component': {
      if (!jsonContent) continue
      const { usingComponents } = jsonContent
      if (!usingComponents) break
      for (let [, compPath] of Object.entries(usingComponents)) {
        if (compPath.includes('?root=')) {
          compPath = compPath.replace(/\?root=.+/g, '')
        }

        // todo: 优化补充 .mpx 或 /index.mpx 用 enhanced-resolve 做这件事
        // if (!compPath.endsWith('.mpx')) compPath += '.mpx';
        const [firstPathOfComp] =  /^(?:[^/]+)/g.exec(compPath)
        const isAlias = webpackBaseCfgAlias[firstPathOfComp]
        if (isAlias && /^\//g.test(isAlias)) {
          // 非 node_modules 下的自有项目目录下的 alias
          // alias
          compPath = compPath.replace(firstPathOfComp, isAlias)
          try {
            fs.statSync(compPath)
          } catch (e) {
            compPath = compPath.replace(/\.mpx/g, '/index.mpx')
            fs.statSync(compPath)
          }
          entry.push({ type: 'component', absolutePath: compPath })
          componentCollections.push(compPath)
        }
        if (firstPathOfComp.startsWith('.')) {
          // 说明是相对路径
          compPath = path.resolve(dirname, compPath)
          try {
            fs.statSync(compPath)
          } catch (e) {
            compPath = compPath.replace(/\.mpx/g, '/index.mpx')
            fs.statSync(compPath)
          }
          entry.push({ type: 'component', absolutePath: compPath })
          componentCollections.push(compPath);
          checkInFileMapOrNot(compPath)
        }

      }
      break
    }
  }
}

const obj = [
  ...appCollections,
  ...pageCollections,
  ...componentCollections
]

fs.writeFileSync('./scan-comps.json', JSON.stringify(obj, null, 2))
fs.writeFileSync('./file-tree-flat.json', JSON.stringify(fileArr, null, 2))

const usedFilesUnique = [...new Set([...appCollections, ...pageCollections, ...componentCollections])]

const unUsed = []
for (let i = 0; i < fileArr.length; i++) {
  const x = fileArr[i]
  if (!usedFilesUnique.includes(x)) {
    unUsed.push(x)
  }
}

fs.writeFileSync('./un-used.json', JSON.stringify(unUsed, null, 2))
