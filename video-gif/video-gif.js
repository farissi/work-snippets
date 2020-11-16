import Base from 'modules/base'
import { selectAll, select } from 'lib/selectors'
import { isInView, isWideScreen, isMobileScreen } from 'lib/helpers'
import { Manager, WINDOW_DID_SCROLL, WINDOW_WAS_RESIZED, VIDEO_GIF_CLICKED } from 'lib/events'

const MODULE_SELECTOR = '.button-video-gif'

class VideoGif extends Base {

  constructor(el) {
    super(el)
    /**
     * button container of the video gif
     *
     * @type HTMLButtonElement
     */
    this.elButton = el
    /**
     * @type HTMLMediaElement
     */
    this.elVideo = null
    /**
     * @type HTMLSpanElement
     */
    this.elSpanPlayPause = null
    /**
     * @type HTMLSpanElement
     */
    this.elSpanPlayPauseText = null
    /**
     * @type boolean
     */
    this.manualPaused = false
    /**
     * @type DOMStringMap
     * @type {{srcDesktop: string, srcMobile: string, posterDesktop: string, posterMobile: string}}
     */
    this.videoData = null

    this.heroMedia = select('.hero__media, .sliding-hero', document.body)
  }

  init() {
    if (this.elButton) {
      this.elVideo = select('video', this.elButton.parentNode)
      this.elSpanPlayPause = this.elButton.querySelector('span.button-icon')
      this.elSpanPlayPauseText = this.elButton.querySelector('span.is-sr-only')

      if (this.heroMedia) {
        const height = window.getComputedStyle(this.elVideo.parentElement).height
        const width = window.getComputedStyle(this.elVideo.parentElement).width

        const styleElem = document.head.appendChild(document.createElement("style"));
        styleElem.innerHTML = `.button-video-gif::before {height:${height};width:${width};}`;
      }

      this.bind()
      this.setVideoData()
      this.setVideoSourceByDevice()
    }
  }

  bind() {
    this.elVideo.onloadeddata = this.onVideoLoaded.bind(this)
    Manager.subscribe(WINDOW_DID_SCROLL, this.handleAutoPlayPause)
    Manager.subscribe(WINDOW_WAS_RESIZED, this.setVideoSourceByDevice)
    Manager.subscribe(VIDEO_GIF_CLICKED, this.handleClickPlayPause)
    this.elButton.addEventListener('click', this.handleClickPlayPause)
    this.elButton.addEventListener('keypress', this.handleClickPlayPause)
  }

  /**
   * Play or Pause the video when we scroll or we resize the window
   *
   * @listens WINDOW_DID_SCROLL, WINDOW_WAS_RESIZED
   * @return {void}
   */
  handleAutoPlayPause = () => {
    if (this.manualPaused === false) {
      if (!isInView(this.elVideo)) {
        this.pause()
        this.setPauseState()
      } else {
        this.play()
        this.setPlayState()
      }
    }
  }

  /**
   * Play or Pause the video when a user click or press a key (enter or space)
   *
   * @listens CLICK, KEYPRESS
   * @param {MouseEvent|KeyboardEvent} event
   * @return {void}
   */
  handleClickPlayPause = (event) => {
    const CODE_SPACE = 32
    const CODE_ENTER = 13

    if (this.playPauseAction(event)) {
      if ((event.type === 'click' && !this.isFakeClick(event)) || (event.type === 'keypress' && (event.which === CODE_SPACE || event.which === CODE_ENTER))) {
        if (event.which === CODE_SPACE) {
          event.preventDefault()
        }
        if (this.isPlaying()) {
          this.pause()
          this.setPauseState()
          this.manualPaused = true
        } else if (this.isPaused()) {
          this.play()
          this.setPlayState()
          this.manualPaused = false
        }
      }
    }
  }

  playPauseAction = (event) => {
    let canPlayPause = true
    const anchorEl = event.target.closest('a')
    if (anchorEl && anchorEl.hasAttribute('href')) {
      event.preventDefault()
      canPlayPause = event.target.className.includes('button-icon') ? (!this.isFakeClick(event) && !this.isRepeatPressKey(event)) : false
    }
    return canPlayPause
  }

  /**
   * Check if the click is fake (user does not click)
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/UIEvent/detail
   * @param {Event} event
   * @return {boolean}
   */
  isFakeClick = (event) => {
    return event.type === 'click' && event.detail === 0
  }

  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/repeat
   * @param {KeyboardEvent} event
   * @return {boolean}
   */
  isRepeatPressKey = (event) => {
    return event.type === 'keypress' && event.repeat
  }

  /**
   * Check if the video is playing
   *
   * @return {boolean}
   */
  isPlaying = () => {
    return (this.elVideo.currentTime > 0 && !this.elVideo.paused && !this.elVideo.ended && this.elVideo.readyState > 2)
  }

  /**
   * Check if the video is paused
   *
   * @return {boolean}
   */
  isPaused = () => {
    return this.elVideo.paused
  }

  /**
   * Play the video
   *
   * @return {void}
   */
  play = () => {
    if (!this.isPlaying()) {
      this.elVideo.play()
    }
  }

  /**
   * Pause the video
   *
   * @return {void}
   */
  pause = () => {
    if (this.isPlaying()) {
      this.elVideo.pause()
    }
  }

  /**
   * Set pause state to the button container
   *
   * @return {void}
   */
  setPauseState = () => {
    const labelPlay = this.elSpanPlayPauseText.getAttribute('data-label-play')
    this.elSpanPlayPauseText.innerText = labelPlay
    this.el.classList.add('paused')
  }

  /**
   * Set play state to the button container
   *
   * @return {void}
   */
  setPlayState = () => {
    const labelPause = this.elSpanPlayPauseText.getAttribute('data-label-pause')
    this.elSpanPlayPauseText.innerText = labelPause
    this.el.classList.remove('paused')
  }

  /**
   * Function executed when the video is fully loaded
   */
  onVideoLoaded = () => {
    this.handleAutoPlayPause()
    this.onVideoLoadedPreserveManualPause()
  }

  /**
   * When we change the breakpoint the src video is changed then loaded event is triggered
   * In this case we make sure to preserve state manual pause
   */
  onVideoLoadedPreserveManualPause = () => {
    if (this.manualPaused) {
      setTimeout(() => {
        this.elVideo.pause()
        this.setPauseState()
      }, 0)
    }
  }

  /**
   * Set data of video src and poster for desktop and mobile
   */
  setVideoData = () => {
    if (!this.videoData) {
      this.videoData = this.elVideo.dataset
    }
  }

  /**
   * This function changes the src and poster of video based on breakpoint if it is contributed
   */
  setVideoSourceByDevice = () => {
    let src = this.videoData.srcDesktop
    let poster = this.videoData.posterDesktop
    if (this.videoData.srcMobile.trim() !== '' && (window.orientation === 0 || src.trim() === '')) {
      src = this.videoData.srcMobile
      poster = this.videoData.posterMobile
    }

    if (src && src.trim() !== '' && !this.isCurrentSource(src)) {
      const sourceEl = this.elVideo.querySelector('source')
      this.elVideo.setAttribute('poster', poster)
      sourceEl.setAttribute('src', src)
      this.elVideo.load()
    }
  }

  /**
   * Check if src param is the same current src of video
   * @param {string} src
   * @return boolean
   */
  isCurrentSource = (src) => {
    // from backend we might have empty strings inside slashes ex url. aaa/bbb///ccc/ddd//eee
    return this.elVideo.currentSrc.includes(src)
  }
}

const init = (context = document) => {
  const els = Array.from(selectAll(MODULE_SELECTOR, context))
  els.forEach(el => {
    if (el) {
      new VideoGif(el).init()
    }
  })
}

export {
  init,
  VideoGif,
  MODULE_SELECTOR
}

