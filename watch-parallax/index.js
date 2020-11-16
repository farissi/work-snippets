import { Manager, WINDOW_DID_SCROLL, BREAKPOINT_CHANGE, WINDOW_WAS_RESIZED } from 'lib/events'
import { HEADER_SMALL_COLLAPSED_HEIGHT, HEADER_LARGE_COLLAPSED_HEIGHT, HEADER_LARGE_EXPANDED_HEIGHT } from 'config/constants'
import { select } from 'lib/selectors'
import Base from 'modules/base'
import { isMobileScreen , getMq } from 'lib/helpers'
import Positioning from './positioning'

const MODULE_SELECTOR = '.js-watches-parallax'
const MODULE_CONFIG = {
  portrait: {
    thumb: {
      height: 15
    }
  },
  landscape: {
    thumb: {
      height: 15
    }
  }
}

/**
 * Module to handle Sliding Hero
 * @module WatchesParallax
**/
class WatchesParallax {

  constructor(el) {
    this.el = el
    this.mq = window.matchMedia('(min-width: 601px)')
    this.img = select('img', el)
    this.data = {
      illustration: null,
      windowScroll: 0,
      windowHeight: 0,
      windowWidth: 0,
      headerHeight: HEADER_LARGE_EXPANDED_HEIGHT,
      viewHeight: 0,
      itemHeight: 0,
      moduleHeight: 0,
      moduleOffset: 0,
      thumbHeight: 0,
      orientation: null,
      position: null,
      length: 0,
      top: 0,
      distance: 0,
      defaultSrc: this.img ? this.img.getAttribute('data-src-default') : null,
      defaultSrcset: this.img ? this.img.getAttribute('data-srcset-default') : null,
      src: this.img ? this.img.getAttribute('src') : null,
      srcset: this.img ? this.img.getAttribute('data-srcset') : null
    }

    if (!this.el) {
      return
    }

    this.breakpointChangeHandler()
  }

  /**
   * Set up all event listeners
   * @method
  **/
  bind() {
    Manager.subscribe(BREAKPOINT_CHANGE, this.breakpointChangeHandler)
    Manager.subscribe(WINDOW_WAS_RESIZED, this.resizeHandler)
    Manager.subscribe(WINDOW_DID_SCROLL, () => {
      window.cancelAnimationFrame(this.raf)
      this.raf = window.requestAnimationFrame(() => {
        this.scrollHandler()
      })
    })
  }

  /**
   * Get header height on breakpoint change
   * @method
  **/
  breakpointChangeHandler = () => {
    const state = getMq()
    this.data.headerHeight = state === 'desktop' ? HEADER_LARGE_EXPANDED_HEIGHT : HEADER_SMALL_COLLAPSED_HEIGHT
    this.resizeHandler()
  }

  /**
   * Mount module
   * @method
  **/
  mount() {
    this.bind()
  }

    /**
   * Triggers resize event with all corresponding data.
   * Return without update on vertical resizing with a delta inferior to 70px
   * to prevent display issues on mobile devices when the browser UI is collapsed.
   * @method
  **/
  resizeHandler = () => {
    if (window.innerWidth === this.data.windowWidth &&
      Math.abs(this.data.windowHeight - window.innerHeight) < 70) {
      return
    }
    this.resize()
  }

  /**
   * Update data on resize
   * @method
  **/
  resize() {
    this.data.windowScroll = window.pageYOffset
    this.data.windowHeight = window.innerHeight
    this.data.windowWidth = window.innerWidth

    const {defaultSrcset, defaultSrc, srcset, src} = this.data
    if (defaultSrcset && defaultSrc && srcset && src) {
      if (getMq() !== 'desktop') {
        this.img.setAttribute('data-srcset', defaultSrcset)
        this.img.setAttribute('srcset', defaultSrcset)
        this.img.setAttribute('src', defaultSrc)
      } else {
        this.img.setAttribute('data-srcset', srcset)
        this.img.setAttribute('srcset', srcset)
        this.img.setAttribute('src', src)
      }
    }

    if (!isMobileScreen() || (isMobileScreen() && this.data.windowWidth > this.data.windowHeight)) {
      this.data.orientation = 'landscape'
    } else {
      this.data.orientation = 'portrait'
    }

    this.setup()
    this.scrollHandler()
  }

    /**
   * Setup module dimensions and init/update modules
   * @method
  **/
  setup() {
    this.data.illustration = select('.characteristics__illustration', this.el)
    this.data.distance = this.data.windowHeight - this.data.headerHeight + this.data.illustration.clientHeight

    // Set picture position
    if (!this.el.positioning) {
      this.el.positioning = new Positioning(this.el)
    }

    this.el.positioning.resize(this.data)
  }

  /**
   * Set parallax on scroll
   * @method
  **/
  scrollHandler = () => {
    this.data.windowScroll = window.pageYOffset
    this.data.top = this.data.illustration.getBoundingClientRect().top + this.data.windowScroll

    let progress = (this.data.windowScroll + this.data.windowHeight - this.data.top) / this.data.distance

    if (progress < 0) {
      progress = 0
    }
    else if (progress > 1) {
      progress = 1
    }

    this.el.positioning.move(progress)
  }

  /**
   * Remove all event listeners
   * @method
  **/
  unbind() {
    Manager.unsubscribe(WINDOW_WAS_RESIZED, this.resizeHandler)
    Manager.unsubscribe(BREAKPOINT_CHANGE, this.breakpointChangeHandler)
  }

  /**
   * Unmount module
   * @method
  **/
  unmount() {
    this.unbind()
  }
}

function init(context = document) {
  const el = select(MODULE_SELECTOR, context)
  if (el) {
    const watchesParallax = new WatchesParallax(el)
    watchesParallax.mount()
  }
}

export {
  init,
  WatchesParallax,
  MODULE_SELECTOR
}
