import { getMq, isIOS10Portrait } from 'lib/helpers'
import { select } from 'lib/selectors'
/**
 * Handles image positioning according to x and y axis
 * @constructor
 */
function Positioning(el) {
  const params = {
    portrait: {
      ratio: 3 / 4
    },
    landscape: {
      ratio: 16 / 7
    }
  }
  const els = {}
  const data = {}
  const options = {}


  /**
   * Inits Module
   * @method
  **/
  function init() {
    parse()
  }

  /**
   * Register all needed DOM elements
   * @method
  **/
  function parse() {
    els.area = select('.characteristics__illustration__wrapper', el)

    params.portrait.offset = {
      y: +100
    }
    params.landscape.offset = {
      y: +100
    }
  }

  /**
   * Get image new position
   * @method
   * @param {Object} opts images and area dimensions
  **/
  function getPos(opts) {
    let areaCenter = opts.areaSize / 2
    if (opts.position && opts.position === 'start') {
      areaCenter = 0
    }
    const pictureCenter = opts.pictureSize * opts.pictureOffset / 100

    let pos = areaCenter - pictureCenter
    if (pos > 0) {
      pos = 0
    }
    else if (opts.pictureSize + pos < opts.areaSize) {
      pos = opts.areaSize - opts.pictureSize
    }

    return pos
  }

  /**
   * Move image on vertical axis
   * @method
   * @param {Number} delta moving delta between 0 and 1
  **/
  function move(delta) {
    TweenLite.set(els.area, {
      css: {
        y: delta * 300, // 150px top and bottom
        force3D: true
      }
    })
  }

  /**
   * Reinit on resize
   * @method
   * @param {Object} opts Sliding hero data
  **/
  function resize(opts) {
    Object.assign(options, opts)
    setup()
  }

  /**
   * Setup module regarding viewport ratio
   * @method
  **/
  function setup() {
    const areaData = {
      height: Math.ceil(els.area.offsetHeight + options.headerHeight),
      width: Math.ceil(els.area.offsetWidth)
    }
    areaData.ratio = areaData.width / areaData.height

    let ratio = params[options.orientation].ratio
    let yPos = 0
    let height
    let width

    if (isIOS10Portrait()) {
      ratio = 0.77
    }


    height = Math.ceil(areaData.width / ratio)
    width = areaData.width

    yPos = getPos({
      pictureSize: height,
      pictureOffset: params[options.orientation].offset.y,
      areaSize: areaData.height,
      position: 'start'
    })

    TweenLite.set(els.area, {
      css: {
        y: yPos
      }
    })

    data.y = yPos
  }

  init()

  return {
    resize,
    move
  }
}

export default Positioning
