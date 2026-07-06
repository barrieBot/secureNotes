import { flushPromises, mount } from '@vue/test-utils'
import { reactive } from 'vue'

import NoteView from '@/components/NoteView.vue'
import { NotesStore } from '@/stores/notes'

jest.mock('@/stores/notes', () => ({
  NotesStore: jest.fn(),
}))

let mockStore

function createMockStore() {
  return reactive({
    notes: [
      {
        id: 'note-1',
        title: 'Confidential note',
        encryptedMsg: 'encrypted-content',
        decryptedMsg: null,
      },
    ],
    selectedNote: 'note-1',
    getDecryptNote: jest.fn(),
  })
}

describe('NoteView', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockStore = createMockStore()
    NotesStore.mockReturnValue(mockStore)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })


  // Verifies that an encrypted note is initially displayed in its locked state.
  test('displays the selected note as locked when it has no decrypted content', () => {
    const wrapper = mount(NoteView)

    expect(wrapper.get('.note-title').text()).toBe(
      'Confidential note'
    )
    expect(wrapper.find('.note-locked').exists()).toBe(true)
    expect(wrapper.find('.note-unlocked').exists()).toBe(false)
    expect(wrapper.get('label').text()).toBe('Note locked!')
  })


  // Ensures that an unlock request is not sent when no password has been entered.
  test('does not request note decryption when the password is empty', async () => {
    const wrapper = mount(NoteView)

    await wrapper.get('.note-locked button').trigger('click')

    expect(mockStore.getDecryptNote).not.toHaveBeenCalled()
  })


  // Confirms that a valid password unlocks the note and displays its decrypted content.
  test('unlocks and displays the note when decryption succeeds', async () => {
    mockStore.getDecryptNote.mockImplementation(async () => {
      mockStore.notes[0].decryptedMsg = 'Decrypted secret content'
    })

    const wrapper = mount(NoteView)
    const passwordInput = wrapper.get('#note-password')

    await passwordInput.setValue('correct-password')
    await wrapper.get('.note-locked button').trigger('click')
    await flushPromises()

    expect(mockStore.getDecryptNote).toHaveBeenCalledTimes(1)
    expect(mockStore.getDecryptNote).toHaveBeenCalledWith(
      'note-1',
      'correct-password'
    )

    expect(wrapper.find('.note-locked').exists()).toBe(false)
    expect(wrapper.get('.note-unlocked').text()).toContain(
      'Decrypted secret content'
    )
  })


  // Verifies that a failed decryption attempt keeps the note locked and informs the user.
  test('displays an error when the supplied password is incorrect', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    mockStore.getDecryptNote.mockRejectedValue(
      new Error('Incorrect password')
    )

    const wrapper = mount(NoteView)
    const passwordInput = wrapper.get('#note-password')

    await passwordInput.setValue('wrong-password')
    await wrapper.get('.note-locked button').trigger('click')
    await flushPromises()

    expect(mockStore.getDecryptNote).toHaveBeenCalledWith(
      'note-1',
      'wrong-password'
    )

    expect(wrapper.get('.error-label').text()).toBe(
      'Password incorrect'
    )
    expect(wrapper.find('.note-locked').exists()).toBe(true)
    expect(passwordInput.element.value).toBe('wrong-password')
    expect(
      wrapper.get('.note-locked button').attributes('disabled')
    ).toBeUndefined()

    consoleErrorSpy.mockRestore()
  })
})