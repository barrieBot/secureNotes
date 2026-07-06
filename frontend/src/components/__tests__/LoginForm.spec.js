import { flushPromises, mount } from '@vue/test-utils'
import LoginForm from '@/components/LoginForm.vue'
import { authStore } from '@/stores/auth.ts'
import router from '@/router/routes.ts'

jest.mock('@/stores/auth.ts', () => ({
  authStore: jest.fn(),
}))

jest.mock('@/router/routes.ts', () => ({
  __esModule: true,
  default: {
    push: jest.fn(),
  },
}))

const mockSignIn = jest.fn()
const mockPush = router.push

describe('LoginForm', () => {
  beforeEach(() => {
    mockSignIn.mockReset()
    mockPush.mockReset()
    authStore.mockReset()

    authStore.mockReturnValue({
      signIn: mockSignIn,
    })
  })

  
  // Verifies that the form presents the expected controls for entering user credentials.
  test('renders username and password inputs', () => {
    const wrapper = mount(LoginForm)
    const inputs = wrapper.findAll('input')

    expect(inputs).toHaveLength(2)

    expect(inputs[0].attributes('type')).toBe('text')
    expect(inputs[0].attributes('placeholder')).toBe('username')

    expect(inputs[1].attributes('type')).toBe('password')
    expect(inputs[1].attributes('placeholder')).toBe('password')
  })


  // Ensures that authentication cannot be submitted until both required fields are completed.
  test('disables the sign-in button until both fields contain values', async () => {
    const wrapper = mount(LoginForm)

    const usernameInput = wrapper.get('input[type="text"]')
    const passwordInput = wrapper.get('input[type="password"]')
    const button = wrapper.get('.login-button')

    expect(button.attributes('disabled')).toBeDefined()

    await usernameInput.setValue('luca')

    expect(button.attributes('disabled')).toBeDefined()

    await passwordInput.setValue('secret-password')

    expect(button.attributes('disabled')).toBeUndefined()
  })


  // Confirms that valid credentials trigger authentication and redirect the user to the notes page.
  test('signs in and navigates to the notes page with valid credentials', async () => {
    mockSignIn.mockResolvedValue(true)

    const wrapper = mount(LoginForm)

    const usernameInput = wrapper.get('input[type="text"]')
    const passwordInput = wrapper.get('input[type="password"]')

    await usernameInput.setValue('luca')
    await passwordInput.setValue('secret-password')
    await wrapper.get('.login-button').trigger('click')

    await flushPromises()

    expect(mockSignIn).toHaveBeenCalledTimes(1)
    expect(mockSignIn).toHaveBeenCalledWith(
      'luca',
      'secret-password'
    )

    expect(mockPush).toHaveBeenCalledTimes(1)
    expect(mockPush).toHaveBeenCalledWith('/notes')

    expect(usernameInput.element.value).toBe('')
    expect(passwordInput.element.value).toBe('')
  })


  // Verifies that a failed authentication attempt does not grant access to the protected notes page.
  test('does not navigate when authentication is unsuccessful', async () => {
    mockSignIn.mockResolvedValue(false)

    const wrapper = mount(LoginForm)

    await wrapper
      .get('input[type="text"]')
      .setValue('luca')

    await wrapper
      .get('input[type="password"]')
      .setValue('wrong-password')

    await wrapper.get('.login-button').trigger('click')

    await flushPromises()

    expect(mockSignIn).toHaveBeenCalledTimes(1)
    expect(mockSignIn).toHaveBeenCalledWith(
      'luca',
      'wrong-password'
    )

    expect(mockPush).not.toHaveBeenCalled()
  })
})