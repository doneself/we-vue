import '../../scss/swipe.scss'

import Vue from 'vue'

// Utils
import { getTouch } from '../../utils'
import mixins, { ExtractVue } from '../../utils/mixins'

import SwipeItem from '../WSwipeItem'

// Mixins
import Touchable from '../../mixins/touchable'

type SwipeItemInstance = InstanceType<typeof SwipeItem>

// Types
interface options extends Vue {
  timer: any
}

export default mixins<options &
  ExtractVue<[typeof Touchable]>
>(Touchable).extend({
  name: 'w-swipe',

  props: {
    width: Number,
    height: Number,
    autoplay: Number,
    vertical: Boolean,
    indicatorColor: String,
    defaultIndex: {
      type: Number,
      default: 0,
    },
    showIndicators: {
      type: Boolean,
      default: true,
    },
    duration: {
      type: Number,
      default: 500,
    },
    prevent: Boolean,
    noDragWhenSingle: {
      type: Boolean,
      default: true,
    },
    loop: {
      type: Boolean,
      default: true,
    },
    touchable: {
      type: Boolean,
      default: true,
    },
  },

  data () {
    return {
      computedWidth: 0 as number,
      computedHeight: 0 as number,
      offset: 0 as number,
      active: 0 as number,
      deltaX: 0 as number,
      deltaY: 0 as number,
      swipes: [] as Array<SwipeItemInstance>,
      swiping: false as boolean,
    }
  },

  mounted () {
    this.initialize()
  },

  destroyed () {
    clearTimeout(this.timer)
  },

  watch: {
    swipes () {
      this.initialize()
    },

    defaultIndex () {
      this.initialize()
    },

    autoplay (autoplay) {
      if (!autoplay) {
        this.clear()
      } else {
        this.autoPlay()
      }
    },
  },

  computed: {
    count (): number {
      return this.swipes.length
    },

    delta (): number {
      return this.vertical ? this.deltaY : this.deltaX
    },

    size (): number {
      return this.vertical ? this.computedHeight : this.computedWidth
    },

    trackSize (): number {
      return this.count * this.size
    },

    isCorrectDirection (): boolean {
      const expect = this.vertical ? 'vertical' : 'horizontal'
      return this.direction === expect
    },

    trackStyle (): object {
      const mainAxis = this.vertical ? 'height' : 'width'
      const crossAxis = this.vertical ? 'width' : 'height'

      return {
        [mainAxis]: `${this.trackSize}px`,
        [crossAxis]: this[crossAxis] ? `${this[crossAxis]}px` : '',
        transitionDuration: `${this.swiping ? 0 : this.duration}ms`,
        transform: `translate${this.vertical ? 'Y' : 'X'}(${this.offset}px)`,
      }
    },

    indicatorStyle (): object {
      return {
        backgroundColor: this.indicatorColor,
      }
    },

    wrapperStyle (): object {
      let ret: any = {
        paddingLeft: this.count > 1 ? this.computedWidth + 'px' : 0,
        width: this.count > 1 ? (this.count + 2) * this.computedWidth + 'px' : '100%',
        transitionDuration: `${this.currentDuration}ms`,
        transform: `translate3d(${this.offset}px, 0, 0)`,
      }

      if (this.height) {
        ret.height = this.height + 'px'
      }

      return ret
    },

    activeIndicator (): number {
      return (this.active + this.count) % this.count
    },
  },

  methods: {
    initialize (active = this.defaultIndex): void {
      clearTimeout(this.timer)
      if (this.$el) {
        const rect = this.$el.getBoundingClientRect()
        this.computedWidth = this.width || rect.width
        this.computedHeight = this.height || rect.height
      }
      this.swiping = true
      this.active = active
      this.offset = this.count > 1 ? -this.size * this.active : 0
      this.swipes.forEach(swipe => {
        swipe.offset = 0
      })
      this.autoPlay()
    },

    onResize () {
      this.initialize(this.activeIndicator)
    },

    onTouchstart (e: TouchEvent): void {
      if (!this.touchable) return

      this.clear()
      this.swiping = true
      clearTimeout(this.timer)

      if (this.active <= -1) {
        this.move(this.count)
      }
      if (this.active >= this.count) {
        this.move(-this.count)
      }
    },

    onTouchmove (e: TouchEvent): void {
      if (!this.touchable || this.swiping) return

      // TODO

      if (this.isCorrectDirection) {
        e.preventDefault()
        e.stopPropagation()
        this.move({ offset: Math.min(Math.max(this.delta, -this.size), this.size) })
      }
    },

    onTouchend (): void {
      if (this.count === 1) {
        if (this.noDragWhenSingle) return

        this.offset = 0
      } else {
        if (this.deltaX) {
          this.move(Math.abs(this.deltaX) > 50 ? (this.deltaX > 0 ? -1 : 1) : 0)
        }
        this.autoPlay()
      }
    },

    move ({ pace = 0, offset = 0, emitChange }): void {
      const { delta, active, count, swipes, trackSize } = this
      const atFirst = active === 0
      const atLast = active === count - 1
      const outOfBounds =
        !this.loop &&
        ((atFirst && (offset > 0 || pace < 0)) || (atLast && (offset < 0 || pace > 0)))

      if (outOfBounds || count <= 1) {
        return
      }

      if (swipes[0]) {
        swipes[0].offset = atLast && (delta < 0 || pace > 0) ? trackSize : 0
      }

      if (swipes[count - 1]) {
        swipes[count - 1].offset = atFirst && (delta > 0 || pace < 0) ? -trackSize : 0
      }

      if (pace && active + pace >= -1 && active + pace <= count) {
        this.active += pace

        if (emitChange) {
          this.$emit('change', this.activeIndicator)
        }
      }

      this.offset = Math.round(offset - this.active * this.size)
    },

    swipeTo (index: number): void {
      this.swiping = true
      this.resetTouchStatus()
      this.correctPosition()
      setTimeout(() => {
        this.swiping = false
        this.move({
          pace: (index % this.count) - this.active,
          emitChange: true,
        })
      }, 30)
    },

    correctPosition (): void {
      if (this.active <= -1) {
        this.move({ pace: this.count })
      }
      if (this.active >= this.count) {
        this.move({ pace: -this.count })
      }
    },

    range (num: number, arr: number[]): number {
      return Math.min(Math.max(num, arr[0]), arr[1])
    },

    clear (): void {
      clearTimeout(this.timer)
    },

    autoPlay (): void {
      const { autoplay } = this
      if (autoplay && this.count > 1) {
        this.clear()
        this.timer = setTimeout(() => {
          this.swiping = true
          this.resetTouchStatus()
          this.correctPosition()

          setTimeout(() => {
            this.swiping = false
            this.move({
              pace: 1,
              emitChange: true,
            })
            this.autoPlay()
          }, 30)
        }, autoplay)
      }
    },
  },

  render (h) {
    const { count, activeIndicator } = this

    const Indicator = this.$slots.indicator || (
      this.showIndicators && count > 1 &&
      <div class="wv-swipe__indicators">
        {
          Array(...Array(count)).map((empty, index) => (
            <i
              key={index}
              class={{ 'wv-swipe__indicator--active': index === activeIndicator }}
              style={index === activeIndicator ? this.indicatorStyle : null}
            />
          ))
        }
      </div>
    )

    return (
      <div class="wv-swipe">
        <div
          style={this.trackStyle}
          class="wv-swipe__wrapper"
          ref="track"
          onTouchstart={this.onTouchstart}
          onTouchmove={this.onTouchmove}
          onTouchend={this.onTouchend}
          onTouchcancel={this.onTouchend}
        >
          {this.$slots.default}
        </div>
        {Indicator}
      </div>
    )
  },
})
