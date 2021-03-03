const express = require('express')
const router = express.Router()
const asyncHandler = require('express-async-handler')

const drive = require('../../drive.js')
const cache = require('../../cache.js')

// create new
router.post('/drive', asyncHandler(async (req, res) => {
  try {
    const body = req.body
    if (!body.name) {
      return res.status(400).json('')
    }
    if (cache.drives[body.name] || body.name === 'local') {
      return res.status(419).json('duplicated')
    }
    const key = await drive.create(body.name)
    return res.json({ key: key })
  } catch (e) {
    console.log(e)
    return res.status(400).json('wrong body payload')
  }
}))

// list dir
// download file
router.get('/drive/:id/*', asyncHandler(async (req, res) => {
  const driveObj = await drive.get(req.params.id)
  let filepath = req.url.replace(`/drive/${req.params.id}`, '').trim()

  if (filepath === undefined) {
    filepath = '/'
  }

  let entry = null

  try {
    entry = await driveObj.promises.stat(filepath)
  } catch (e) {
    return res.status(404).json('')
  }

  if (entry && entry.isDirectory()) {
    const files = await driveObj.promises.readdir(filepath)
    files.sort()
    return res.json({ files: files })
  } else {
    const content = await driveObj.promises.readFile(filepath, 'utf8')
    return res.send(content)
  }
}))

router.get('/drive/:id', asyncHandler(async (req, res) => {
  return res.redirect(`/drive/${req.params.id}/`)
}))

module.exports = router
