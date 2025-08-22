/**
 * Budget Zero Button Component
 * Clean CSS-first Web Component using external CSS files
 */

import { BaseComponent, defineComponent } from '../../core/BaseComponent.js';

export class Button extends BaseComponent {
  static get observedAttributes(): string[] {
    return ['variant', 'size', 'disabled', 'loading', 'icon-left', 'icon-right'];
  }

  protected getTemplate(): string {
    const variant = this.getAttribute('variant', 'primary');
    const size = this.getAttribute('size', 'md');
    const disabled = this.hasAttribute('disabled');
    const loading = this.hasAttribute('loading');
    const iconLeft = this.getAttribute('icon-left');
    const iconRight = this.getAttribute('icon-right');

    const buttonClasses = [
      'button',
      `button--${variant}`,
      `button--${size}`,
      loading ? 'button--loading' : ''
    ].filter(Boolean).join(' ');

    return `
      <button 
        class="${buttonClasses}"
        ${disabled ? 'disabled' : ''}
        ${loading ? 'aria-busy="true"' : ''}
        part="button"
      >
        ${loading ? '<span class="loading-spinner"></span>' : ''}
        ${iconLeft ? `<span class="icon icon-left">${iconLeft}</span>` : ''}
        <slot></slot>
        ${iconRight ? `<span class="icon icon-right">${iconRight}</span>` : ''}
      </button>
    `;
  }

  protected addEventListeners(): void {
    const button = this.query<HTMLButtonElement>('.button');
    if (button) {
      button.addEventListener('click', this.handleClick.bind(this));
    }
  }

  private handleClick(event: Event): void {
    if (this.hasAttribute('disabled') || this.hasAttribute('loading')) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    // Emit custom event
    this.emit('bz-click', {
      variant: this.getAttribute('variant'),
      size: this.getAttribute('size')
    });
  }

  /**
   * Public method to set loading state
   */
  public setLoading(loading: boolean): void {
    if (loading) {
      this.setAttribute('loading', '');
    } else {
      this.removeAttribute('loading');
    }
  }

  /**
   * Public method to set disabled state
   */
  public setDisabled(disabled: boolean): void {
    if (disabled) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }
}

// Register the component
defineComponent('bz-button', Button);
