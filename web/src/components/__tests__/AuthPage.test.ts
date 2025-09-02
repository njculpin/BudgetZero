import { describe, it, expect, vi } from 'vitest'
import { AuthPage } from '../AuthPage'

describe('AuthPage', () => {
  it('should render correctly with all elements', () => {
    const mockOnAuthenticate = vi.fn()
    const component = AuthPage({ onAuthenticate: mockOnAuthenticate })
    
    // Check container
    expect(component.tagName).toBe('DIV')
    expect(component.className).toBe('auth')
    
    // Check title
    const title = component.querySelector('h2')
    expect(title).toBeTruthy()
    expect(title?.textContent).toBe('Welcome')
    
    // Check subtitle
    const subtitle = component.querySelector('p')
    expect(subtitle).toBeTruthy()
    expect(subtitle?.textContent).toBe('Enter your invite code to get started')
    
    // Check inputs
    const inputs = component.querySelectorAll('input')
    expect(inputs).toHaveLength(2)
    
    const inviteInput = inputs[0] as HTMLInputElement
    expect(inviteInput.type).toBe('text')
    expect(inviteInput.id).toBe('inviteCode')
    expect(inviteInput.placeholder).toBe('Invite Code')
    expect(inviteInput.className).toBe('input')
    
    const emailInput = inputs[1] as HTMLInputElement
    expect(emailInput.type).toBe('email')
    expect(emailInput.id).toBe('email')
    expect(emailInput.placeholder).toBe('Email')
    expect(emailInput.className).toBe('input')
    
    // Check buttons
    const buttons = component.querySelectorAll('button')
    expect(buttons).toHaveLength(2)
    
    const continueBtn = buttons[0] as HTMLButtonElement
    expect(continueBtn.className).toBe('btn btn-primary')
    expect(continueBtn.textContent).toBe('Continue')
    
    const backBtn = buttons[1] as HTMLButtonElement
    expect(backBtn.className).toBe('btn btn-secondary')
    expect(backBtn.textContent).toBe('Back')
  })
  
  it('should call onAuthenticate when continue button is clicked with valid input', () => {
    const mockOnAuthenticate = vi.fn()
    const component = AuthPage({ onAuthenticate: mockOnAuthenticate })
    
    const inputs = component.querySelectorAll('input')
    const inviteInput = inputs[0] as HTMLInputElement
    const emailInput = inputs[1] as HTMLInputElement
    
    // Set values
    inviteInput.value = 'TEST123'
    emailInput.value = 'test@example.com'
    
    const continueBtn = component.querySelector('button') as HTMLButtonElement
    continueBtn.click()
    
    expect(mockOnAuthenticate).toHaveBeenCalledWith('test@example.com', 'TEST123')
  })
  
  it('should show alert when continue button is clicked with empty input', () => {
    const mockOnAuthenticate = vi.fn()
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    
    const component = AuthPage({ onAuthenticate: mockOnAuthenticate })
    
    const continueBtn = component.querySelector('button') as HTMLButtonElement
    continueBtn.click()
    
    expect(alertSpy).toHaveBeenCalledWith('Please enter both invite code and email')
    expect(mockOnAuthenticate).not.toHaveBeenCalled()
    
    alertSpy.mockRestore()
  })
  
  it('should call window.history.back when back button is clicked', () => {
    const mockOnAuthenticate = vi.fn()
    const component = AuthPage({ onAuthenticate: mockOnAuthenticate })
    
    const buttons = component.querySelectorAll('button')
    const backBtn = buttons[1] as HTMLButtonElement
    
    backBtn.click()
    
    expect(window.history.back).toHaveBeenCalledTimes(1)
  })
})
