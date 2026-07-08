'use client'
import { useSettingDataQuery, useUpdateSettingMutation } from '@/redux/feature/userSlice'
import React, { useState, useEffect } from 'react'
import { IMAGE_BASE_URL } from '@/lib/config'

export default function Info() {
  const { data, isLoading, error, refetch } = useSettingDataQuery(undefined)
  const [updateSetting, { isLoading: isUpdating }] = useUpdateSettingMutation()


  const [formData, setFormData] = useState({
    name: '',
    description: '',
    version: '',
    delivery_charge: '',
    contact_email: '',
    contact_phone: '',
    whatsapp_number: '',
    maintenance_mode: false,
    maintenance_message: '',
  })
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [message, setMessage] = useState({ text: '', type: '' })

  // Initialize form data when data is loaded
  useEffect(() => {
    if (data && data.status === 'success' && data.data.length > 0) {
      const settings = data.data[0]
      setFormData({
        name: settings.name || '',
        description: settings.description || '',
        version: settings.version || '',
        delivery_charge: settings.delivery_charge?.toString() || '',
        contact_email: settings.contact_email || '',
        contact_phone: settings.contact_phone || '',
        whatsapp_number: settings.whatsapp_number || '',
        maintenance_mode: Boolean(settings.maintenance_mode),
        maintenance_message: settings.maintenance_message || '',
      })
      setLogoPreview(settings.logo || '')
    }
  }, [data])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setLogoFile(file)
      // Create a preview
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setLogoPreview(reader.result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage({ text: '', type: '' })

    try {
      const formDataToSend = new FormData()

      formDataToSend.append('name', formData.name)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('version', formData.version)
      formDataToSend.append('delivery_charge', formData.delivery_charge)
      formDataToSend.append('contact_email', formData.contact_email)
      formDataToSend.append('contact_phone', formData.contact_phone)
      formDataToSend.append('whatsapp_number', formData.whatsapp_number)
      formDataToSend.append('maintenance_mode', String(formData.maintenance_mode))
      formDataToSend.append('maintenance_message', formData.maintenance_message)
      // Append all text fields


      // Append logo file if selected
      if (logoFile) {
        formDataToSend.append('logo', logoFile)
      }

      const result = await updateSetting(formDataToSend).unwrap()

      if (result.status === 'success') {
        setMessage({ text: 'Settings updated successfully!', type: 'success' })
        refetch() // Refetch the latest data
      } else {
        setMessage({ text: 'Failed to update settings', type: 'error' })
      }
    } catch (err) {
      setMessage({ text: 'An error occurred while updating settings', type: 'error' })
      console.error('Update error:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p>Error loading settings</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const fieldClass =
    "block w-full rounded-md bg-[#23252b] border border-gray-600 text-white placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-purple-500 sm:text-sm p-3 outline-none";

  return (
    <div className="px-4 py-8 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 shadow-lg rounded-xl overflow-hidden border border-gray-700">

          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Platform Settings</h3>
            <p className="mt-1 text-sm text-gray-400">Manage your platform configuration</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* Inline message */}
            {message.text && (
              <div
                className={`mb-6 rounded-md px-4 py-3 text-sm border ${message.type === 'success'
                  ? 'bg-green-500/15 text-green-300 border-green-500/30'
                  : 'bg-red-500/15 text-red-300 border-red-500/30'
                  }`}
              >
                {message.text}
              </div>
            )}

            {/* Maintenance Mode */}
            <div className={`mb-6 rounded-lg border p-4 ${formData.maintenance_mode ? 'border-amber-500/40 bg-amber-500/10' : 'border-gray-700 bg-[#23252b]'}`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-white">Maintenance Mode</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    When on, the mobile app shows a maintenance banner to users.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.maintenance_mode}
                  onClick={() => setFormData(prev => ({ ...prev, maintenance_mode: !prev.maintenance_mode }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${formData.maintenance_mode ? 'bg-amber-500' : 'bg-gray-600'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${formData.maintenance_mode ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              {formData.maintenance_mode && (
                <div className="mt-3">
                  <label htmlFor="maintenance_message" className="block text-sm font-medium text-gray-300 mb-1.5">Banner Message</label>
                  <textarea
                    name="maintenance_message"
                    id="maintenance_message"
                    rows={2}
                    value={formData.maintenance_message}
                    onChange={handleInputChange}
                    className={fieldClass}
                    placeholder="Message shown to app users during maintenance…"
                  />
                </div>
              )}
            </div>

            {/* Logo Upload */}
            <div className="flex items-center gap-5 pb-6 mb-6 border-b border-gray-700">
              <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-700 flex-shrink-0 border border-gray-600">
                {logoPreview ? (
                  <img
                    src={`${IMAGE_BASE_URL}${logoPreview}`}
                    alt="Logo"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-500">
                    <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <label className="inline-block cursor-pointer bg-gray-700 hover:bg-gray-600 rounded-md font-medium text-purple-300 hover:text-purple-200 px-4 py-2 transition-colors">
                  <span>Change logo</span>
                  <input type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                </label>
                <p className="mt-1.5 text-xs text-gray-500">PNG or JPG, square image recommended.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Platform Name */}
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1.5">Platform Name</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} className={fieldClass} placeholder="Enter platform name" />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
                <textarea name="description" id="description" rows={3} value={formData.description} onChange={handleInputChange} className={fieldClass} placeholder="Enter platform description" />
              </div>

              {/* Version */}
              <div>
                <label htmlFor="version" className="block text-sm font-medium text-gray-300 mb-1.5">Version</label>
                <input type="text" name="version" id="version" value={formData.version} onChange={handleInputChange} className={fieldClass} placeholder="e.g. 1.0.0" />
              </div>

              {/* Delivery Charge */}
              <div>
                <label htmlFor="delivery_charge" className="block text-sm font-medium text-gray-300 mb-1.5">Delivery Charge (৳)</label>
                <input type="number" name="delivery_charge" id="delivery_charge" value={formData.delivery_charge} onChange={handleInputChange} className={fieldClass} placeholder="0.00" min="0" step="0.01" />
              </div>

              {/* Contact Email */}
              <div>
                <label htmlFor="contact_email" className="block text-sm font-medium text-gray-300 mb-1.5">Contact Email</label>
                <input type="email" name="contact_email" id="contact_email" value={formData.contact_email} onChange={handleInputChange} className={fieldClass} placeholder="Enter contact email" />
              </div>

              {/* Contact Phone */}
              <div>
                <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-300 mb-1.5">Contact Phone</label>
                <input type="tel" name="contact_phone" id="contact_phone" value={formData.contact_phone} onChange={handleInputChange} className={fieldClass} placeholder="Enter contact phone" />
              </div>

              {/* WhatsApp Number */}
              <div>
                <label htmlFor="whatsapp_number" className="block text-sm font-medium text-gray-300 mb-1.5">WhatsApp Number</label>
                <input type="tel" name="whatsapp_number" id="whatsapp_number" value={formData.whatsapp_number} onChange={handleInputChange} className={fieldClass} placeholder="With country code, e.g. 8801XXXXXXXXX" />
                <p className="mt-1 text-xs text-gray-500">Shown as the &quot;Order on WhatsApp&quot; button in the app. Include country code, digits only. Leave blank to hide it.</p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={isUpdating}
                className="inline-flex justify-center py-2.5 px-6 text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}