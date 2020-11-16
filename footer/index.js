import { select, selectAll } from 'lib/selectors'
import { Manager, WINDOW_DID_SCROLL, WINDOW_WAS_RESIZED, LOAD_PLP_PROUCTS, FOOTER_DID_ANIMATE } from 'lib/events'
import { isWideScreen, isExplorer, isFirefox } from 'lib/helpers'
import disclaimer from './disclaimer'
import * as dBind from 'delegate'
import { HEADER_LARGE_COLLAPSED_HEIGHT } from 'config/constants'

class Footer {
  constructor(el) {
    this.isActive = false
    this.isVisible = false
    this.wasInView = false
    this.el = el
    this.footerEl = select('.footer', el)
    if (!this.footerEl) {
      return
    }
    this.subfooterEl = select('.subfooter', el).firstElementChild
    window.addEventListener('load', () => {
      Manager.subscribe(WINDOW_WAS_RESIZED, this.onResize)
      Manager.subscribe(LOAD_PLP_PROUCTS, this.onResize)
      this.onResize()
    })
    dBind(this.el, 'a[target].link.js-store-locator', 'click', this.onStoreLocatorClicked)
    dataTest()
  }

  bind() {
    Manager.subscribe(WINDOW_DID_SCROLL, () => this.onScroll())
    document.body.addEventListener('focus', this.onFocus, true)

  }

  unbind() {
    Manager.unsubscribe(WINDOW_DID_SCROLL, this.onScroll)
    document.body.removeEventListener('focus', this.onFocus, true)
  }

  onResize = () => {
    this.windowHeight = window.innerHeight
    this.footerHeight = this.footerEl.offsetHeight
    if (this.subfooterEl) {
      this.subfooterHeight = this.subfooterEl.offsetHeight
    } 
    const hasAnimation = isWideScreen()
      && this.footerEl.offsetHeight <= this.windowHeight
      && document.body.scrollHeight >= this.windowHeight + this.footerHeight
    if (hasAnimation && !this.isActive) {
      this.bind()
      this.el.classList.add('has-animation')
      this.onScroll()
      this.isActive = true
    } else if (!hasAnimation && this.isActive) {
      this.unbind()
      this.triggerEvent({
        pixelsEngaged: 0,
        pixelsLeft: this.footerHeight,
        progress: 0
      })
      this.el.classList.remove('has-animation')
      this.isActive = false
      TweenLite.set(this.footerEl, { opacity: 1 })
      if (this.subfooterEl) {
        TweenLite.set(this.subfooterEl, { opacity: 1 })
      }
    } else if (!hasAnimation && !this.isActive) {
      this.footerEl.style.minHeight = '100%'
      this.footerEl.style.height = '100%'
    }
  }

  onScroll = () => {
    const scrollPos = window.pageYOffset
    const foldingPosY = scrollPos + this.windowHeight
    const footerThreshold = document.body.clientHeight - this.footerHeight
    const footerIsInView = foldingPosY >= footerThreshold
    let subfooterIsInView
    let subfooterDelta
    let subfooterThreshold

    if (this.subfooterEl) {
      subfooterDelta = this.subfooterHeight - (this.subfooterHeight / 4)
      subfooterThreshold = document.body.clientHeight - this.footerHeight - subfooterDelta
      subfooterIsInView = foldingPosY >= subfooterThreshold
    }
   
    if (window.pageYOffset < HEADER_LARGE_COLLAPSED_HEIGHT) {
      TweenLite.set(this.footerEl, { opacity: 0 })
      this.isVisible = false
    }
    if (footerIsInView && window.pageYOffset) {
      const pixelsEngaged = foldingPosY - footerThreshold
      const progress = pixelsEngaged / this.footerHeight
      const footerLinks = selectAll('.footer > *', this.footerEl)
      const footerLogo = select('.footer__logo > a', this.footerEl)
      this.tl = new TimelineLite()
      this.tl.fromTo(footerLinks, 0.4, { opacity: 0 }, { opacity: 1 }, '+=0.2')
      this.tl.fromTo(footerLogo, 0.5, { opacity: 0 }, { opacity: 1 }, '+=0.2')
      this.tl.stop()
      this.triggerEvent({
        pixelsEngaged,
        pixelsLeft: this.footerHeight - pixelsEngaged,
        progress: pixelsEngaged / this.footerHeight
      })
      this.tl.progress(progress)

      if (!this.isVisible) {
        TweenLite.set(this.footerEl, { opacity: 1 })
        this.isVisible = true
      }
    }
    else if (this.wasInView) {
      this.triggerEvent({
        pixelsEngaged: 0,
        pixelsLeft: this.footerHeight,
        progress: 0
      })
    }
    if (this.subfooterEl && subfooterIsInView) {
      const progress = (foldingPosY - subfooterThreshold) / this.subfooterHeight
      let speed = 1.5
      if (isFirefox() || isExplorer()) {
        speed = 5
      }
      if (progress < 1) {
        TweenLite.to(this.subfooterEl, 0.3, { opacity: progress * speed })
      }
    } else {
      if (this.subfooterEl) {
        TweenLite.set(this.subfooterEl, { opacity: 0 })
      }
    }
    this.wasInView = footerIsInView
  }

  onFocus = (e) => {
    const isInSubFooter = this.subfooterEl.contains(e.target)
    const isInFooter = this.footerEl.contains(e.target)
    const isUsingKeyboard = document.body.classList.contains('is-using-keyboard')
    if (isInFooter && isUsingKeyboard) {
      // eslint-disable-next-line max-len
      window.scrollTo(0, window.pageYOffset + e.target.getBoundingClientRect().top + this.footerHeight)
    }
    if(isInSubFooter && isUsingKeyboard ) {
      TweenLite.set(this.subfooterEl, { opacity: 1 })
     }
  }

  onStoreLocatorClicked = () => {
    const dl = window.config.dl
    window.document.DLKit.push('on-tracking', {
      event: dl.event,
      eventCategory: dl.sl.ec,
      eventAction: dl.sl.footer.ea,
      eventLabel: dl.sl.footer.el
    })
  }

  triggerEvent({ pixelsEngaged, pixelsLeft, progress }) {
    Manager.publish(FOOTER_DID_ANIMATE, { pixelsEngaged, pixelsLeft, progress })
  }
}

function init() {
  const el = select('.js-footer')
  if (el) {
    // eslint-disable-next-line no-new
    new Footer(el)
  }
}

if (select('.disclaimer') || select('.disclaimer-indicator')) {
  disclaimer()
}

const spk = selectAll('.collapse-panel__description p', this.el)

function dataTest() {
  spk.forEach((elm, index) => {
    elm.setAttribute('data-test', `lblContent_Spk_${index}`)
  })
}


export {
  init,
  Footer
}
