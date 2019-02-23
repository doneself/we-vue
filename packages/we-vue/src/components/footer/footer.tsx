import Vue from 'vue'
import '../../scss/footer.scss'
import FooterLink from './footer-link'
import { PropValidator } from 'vue/types/options'

export default Vue.extend({
  name: 'wv-footer',

  components: {
    FooterLink,
  },

  props: {
    text: String,
    links: {
      type: Array,
      default: () => [],
    } as PropValidator<Array<any>>,
  },

  render (h) {
    const footerLinks = this.links.map(item => (
      <FooterLink
        key={item.text}
        text={item.text}
        to={item.link}
      />
    ))

    return (
      <div class="weui-footer">
        {
          this.links.length > 0
            ? <p class="weui-footer__links">
              {footerLinks}
            </p>
            : h()
        }
        <p class="weui-footer__text" domPropsInnerHTML={this.text} />
      </div>
    )
  },
})
