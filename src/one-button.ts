import { css, html, CSSResultArray, TemplateResult } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { BaseCSS, Point, OneBase } from './one-base';
import { line, polygon } from './one-lib';
import { theme } from './one-theme';

@customElement('one-button')
export class OneButton extends OneBase {
  @property({ type: Boolean }) icon = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: String, reflect: true }) variant = 'contained';
  @property({ type: String, reflect: true }) color = null;
  @property({ type: String, reflect: true }) size = 'medium';
  @property({ type: Number }) elevation = 1;

  @query('button') private button?: HTMLButtonElement;

  constructor() {
    super();
  }

  static get styles(): CSSResultArray {
    return [
      BaseCSS,
      css`
      :host {
        display: inline-block;
        font-size: 14px;
      }
      path {
        transition: transform 0.05s ease;
      }
      button {
        position: relative;
        user-select: none;
        border: none;
        background: none;        
        font-family: inherit;
        font-size: inherit;
        cursor: pointer;
        letter-spacing: 1.25px;
        text-align: center;
        padding: 10px;
        color: inherit;
        outline: none;
      }
      button[icon] {
        border-radius: 50%;
      }
      button[disabled] {
        opacity: 0.6 !important;
        cursor: default;
        pointer-events: none;
      }
      button:active path {
        transform: scale(0.97) translate(1.5%, 1.5%);
      }
      button:focus path {
        stroke-width: 1.5;
      }
      `
    ]
  }

  render(): TemplateResult {
    return html`
    <button
      ?icon="${this.icon}"
      ?disabled="${this.disabled}"
      ?variant="${this.variant}"
      ?color="${this.color}"
      ?size="${this.size}"
    >
      <slot @slotchange="${this.oneRender}"></slot>
      <div id="overlay">
        <svg></svg>
      </div>
    </button>
    `;
  }

  focus() {
    if (this.button) {
      this.button.focus();
    } else {
      super.focus();
    }
  }

  updated() {
    super.updated();
  }

  protected canvasSize(): Point {
    if (this.button) {
      const size = this.button.getBoundingClientRect();
      const elevation = Math.min(Math.max(1, this.elevation), 5);
      const width = size.width + ((elevation - 1) * 2);
      const height = size.height + ((elevation -1) * 2);
      return [Math.round(width), Math.round(height)];
    }

    return this.lastSize;
  }

  protected draw(svg: SVGSVGElement, size: Point) {
    if (this.icon) {
      this.style.color = this.color?? 'white';
      const min = Math.min(size[0], size[1]);
      svg.setAttribute('width', `${min}`);
      svg.setAttribute('height', `${min}`);
    } else {
      if (this.size === 'small') {
        this.style.fontSize = '12px';
      } else if (this.size === 'large') {
        this.style.fontSize = '16px';
      }

      if (this.variant === 'text') {
        this.style.color = this.color?? 'inherit';
        return;
      }

      const elevation = Math.min(Math.max(1, this.elevation), 5);
      const s = {
        width: size[0] - ((elevation - 1) * 2),
        height: size[1] - ((elevation - 1) * 2)
      };

      const rectangle = polygon(svg, [[0, 0], [s.width, 0], [s.width, s.height], [0, s.height]]);
      if (this.variant === 'contained') {
        rectangle.style.fill = this.color?? theme.primary;
      } else if (this.variant === 'outlined') {
        this.style.color = this.color?? 'white';
      }
      for (let i = 1; i < elevation; i++) {
        line(svg, (i * 2), s.height + (i * 2), s.width + (i * 2), s.height + (i * 2));
        line(svg, s.width + (i * 2), s.height + (i * 2), s.width + (i * 2), i * 2);
        line(svg, (i * 2), s.height + (i * 2), s.width + (i * 2), s.height + (i * 2));
        line(svg, s.width + (i * 2), s.height + (i * 2), s.width + (i * 2), i * 2);
      }
    }
  }
}