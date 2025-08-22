/**
 * Budget Zero Design System - Base Web Component
 * Foundation class for all Budget Zero UI components
 * 
 * This component now uses external CSS files instead of inline styles
 * for better performance and maintainability.
 */

export abstract class BaseComponent extends HTMLElement {
  protected shadow: ShadowRoot;
  
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    this.render();
    this.addEventListeners();
  }

  disconnectedCallback(): void {
    this.removeEventListeners();
  }

  attributeChangedCallback(_name: string, oldValue: string, newValue: string): void {
    if (oldValue !== newValue && this.isConnected) {
      this.render();
    }
  }

  /**
   * Render the component's HTML template
   * Styles are now handled by external CSS files
   */
  protected render(): void {
    this.shadow.innerHTML = this.getTemplate();
  }

  /**
   * Get the component's HTML template
   * Override in subclasses
   */
  protected abstract getTemplate(): string;

  /**
   * Add event listeners
   * Override in subclasses if needed
   */
  protected addEventListeners(): void {
    // Override in subclasses
  }

  /**
   * Remove event listeners
   * Override in subclasses if needed
   */
  protected removeEventListeners(): void {
    // Override in subclasses
  }

  /**
   * Utility method to get attribute with default value
   */
  public getAttribute(name: string, defaultValue: string = ''): string {
    return super.getAttribute(name) || defaultValue;
  }

  /**
   * Utility method to check if attribute exists and is not false
   */
  public hasAttribute(name: string): boolean {
    return super.hasAttribute(name) && this.getAttribute(name) !== 'false';
  }

  /**
   * Emit custom event
   */
  protected emit(eventName: string, detail?: any): void {
    this.dispatchEvent(new CustomEvent(eventName, {
      detail,
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Query element in shadow DOM
   */
  protected query<T extends Element>(selector: string): T | null {
    return this.shadow.querySelector<T>(selector);
  }

  /**
   * Query all elements in shadow DOM
   */
  protected queryAll<T extends Element>(selector: string): NodeListOf<T> {
    return this.shadow.querySelectorAll<T>(selector);
  }

  /**
   * Add CSS class to host element
   */
  protected addClass(className: string): void {
    this.classList.add(className);
  }

  /**
   * Remove CSS class from host element
   */
  protected removeClass(className: string): void {
    this.classList.remove(className);
  }

  /**
   * Toggle CSS class on host element
   */
  protected toggleClass(className: string, force?: boolean): void {
    this.classList.toggle(className, force);
  }

  /**
   * Set CSS custom property on host element
   */
  protected setCustomProperty(property: string, value: string): void {
    this.style.setProperty(`--${property}`, value);
  }

  /**
   * Get computed style value
   */
  protected getComputedStyleValue(property: string): string {
    return getComputedStyle(this as unknown as Element).getPropertyValue(property);
  }
}

/**
 * Type for component registration
 */
export interface ComponentDefinition {
  name: string;
  component: CustomElementConstructor;
}

/**
 * Register a component with the custom elements registry
 */
export function defineComponent(name: string, component: CustomElementConstructor): void {
  if (!customElements.get(name)) {
    customElements.define(name, component);
  }
}
