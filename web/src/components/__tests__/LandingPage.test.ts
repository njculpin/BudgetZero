import { describe, it, expect, vi } from 'vitest'
import { LandingPage } from '../LandingPage'

describe('LandingPage', () => {
  it('should render correctly with all elements', () => {
    const mockOnGetStarted = vi.fn()
    const component = LandingPage({ onGetStarted: mockOnGetStarted })
    
    // Check container
    expect(component.tagName).toBe('DIV')
    expect(component.className).toBe('landing')
    
    // Check title
    const title = component.querySelector('h1')
    expect(title).toBeTruthy()
    expect(title?.textContent).toBe('Budget Zero')
    
    // Check subtitle
    const subtitle = component.querySelector('p')
    expect(subtitle).toBeTruthy()
    expect(subtitle?.textContent).toBe('Collaborative game design platform with zero upfront investment')
    
    // Check button
    const button = component.querySelector('button')
    expect(button).toBeTruthy()
    expect(button?.className).toBe('btn btn-primary')
    expect(button?.textContent).toBe('Get Started')
  })
  
  it('should call onGetStarted when button is clicked', () => {
    const mockOnGetStarted = vi.fn()
    const component = LandingPage({ onGetStarted: mockOnGetStarted })
    
    const button = component.querySelector('button') as HTMLButtonElement
    button.click()
    
    expect(mockOnGetStarted).toHaveBeenCalledTimes(1)
  })
  
  it('should have correct structure', () => {
    const mockOnGetStarted = vi.fn()
    const component = LandingPage({ onGetStarted: mockOnGetStarted })
    
    // Should have exactly 3 child elements
    expect(component.children.length).toBe(3)
    
    // Check order: h1, p, button
    expect(component.children[0].tagName).toBe('H1')
    expect(component.children[1].tagName).toBe('P')
    expect(component.children[2].tagName).toBe('BUTTON')
  })
})
