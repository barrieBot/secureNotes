import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

import NoteForm from '@/components/NoteForm.vue'

describe('NoteForm', () => {
  
    // Verifies that the form displays all controls required to create a new note.
  test('renders the title input, note input and save button', () => {
    const wrapper = mount(NoteForm)

    expect(wrapper.get('.title-input').attributes('placeholder')).toBe('Title')
    expect(wrapper.get('.note-input').attributes('placeholder')).toBe(
      'Tell me your secrets....'
    )
    expect(wrapper.get('.save-button').text()).toBe('Save Note')
  })


  // Ensures that an empty note cannot be submitted.
  test('disables the save button when the form is empty', () => {
    const wrapper = mount(NoteForm)
    const saveButton = wrapper.get('.save-button')

    expect(saveButton.attributes('disabled')).toBeDefined()
  })


  // Confirms that entering a title marks the form as containing unsaved data.
  test('enables the save button when a title is entered', async () => {
    const wrapper = mount(NoteForm)

    await wrapper.get('.title-input').setValue('My secret note')

    expect(
      wrapper.get('.save-button').attributes('disabled')
    ).toBeUndefined()
  })


  // Confirms that note content alone is sufficient to mark the form as containing unsaved data.
  test('enables the save button when note content is entered', async () => {
    const wrapper = mount(NoteForm)

    await wrapper
      .get('.note-input')
      .setValue('This is confidential information.')

    expect(
      wrapper.get('.save-button').attributes('disabled')
    ).toBeUndefined()
  })


  // Verifies that submitting a populated form notifies the parent component to begin the save workflow.
  test('emits the saveNote event when the save button is clicked', async () => {
    const wrapper = mount(NoteForm)

    await wrapper.get('.title-input').setValue('Private title')
    await wrapper
      .get('.note-input')
      .setValue('Private note content')

    await wrapper.get('.save-button').trigger('click')

    expect(wrapper.emitted('saveNote')).toBeTruthy()
    expect(wrapper.emitted('saveNote')).toHaveLength(1)
  })

  
  // Ensures that the exposed clear operation resets the form and restores its initial disabled state.
  test('clears the title and note content through the exposed clear method', async () => {
    const wrapper = mount(NoteForm)

    const titleInput = wrapper.get('.title-input')
    const noteInput = wrapper.get('.note-input')

    await titleInput.setValue('Temporary title')
    await noteInput.setValue('Temporary note content')

    wrapper.vm.clear()
    await nextTick()

    expect(titleInput.element.value).toBe('')
    expect(noteInput.element.value).toBe('')
    expect(
      wrapper.get('.save-button').attributes('disabled')
    ).toBeDefined()
  })
})