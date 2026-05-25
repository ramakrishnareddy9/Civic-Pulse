import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useComplaints } from '@hooks/useComplaints'
import { useNotification } from '@hooks/useNotification'
import { ROUTES } from '@utils/constants'

export function ComplaintForm() {
  const navigate = useNavigate()
  const { submit } = useComplaints()
  const { success, error: showError } = useNotification()
  const fileInputRef = useRef(null)

  const [currentStep, setCurrentStep] = useState(1)
  const [ticketId, setTicketId] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    ward: '',
    location: '',
    incidentDate: '',
    incidentTime: '',
    images: [],
    privacyAgree: false
  })

  const [imagePreview, setImagePreview] = useState([])

  const categories = [
    { value: 'POTHOLE', label: 'Pothole/Road Damage' },
    { value: 'STREETLIGHT', label: 'Streetlight Issue' },
    { value: 'DRAINAGE', label: 'Drainage Problem' },
    { value: 'POLLUTION', label: 'Pollution/Cleanliness' },
    { value: 'TRAFFIC', label: 'Traffic Concern' },
    { value: 'TREE', label: 'Tree/Vegetation' },
    { value: 'WATER', label: 'Water Supply' },
    { value: 'ELECTRICITY', label: 'Electricity Issue' },
    { value: 'OTHER', label: 'Other' },
  ]

  const wards = [
    { value: 'WARD_1', label: 'Ward 1 - North' },
    { value: 'WARD_2', label: 'Ward 2 - Central' },
    { value: 'WARD_3', label: 'Ward 3 - East' },
    { value: 'WARD_4', label: 'Ward 4 - West' },
    { value: 'WARD_5', label: 'Ward 5 - South' },
    { value: 'WARD_6', label: 'Ward 6 - Downtown' },
    { value: 'WARD_7', label: 'Ward 7 - Uptown' },
    { value: 'WARD_8', label: 'Ward 8 - Suburbs' },
  ]

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || [])
    
    if (imagePreview.length + files.length > 5) {
      showError('Maximum 5 images allowed')
      return
    }

    const validFiles = files.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        showError(`${file.name} is too large (max 5MB)`)
        return false
      }
      return true
    })

    validFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImagePreview((prev) => [...prev, { file, preview: event.target.result }])
      }
      reader.readAsDataURL(file)
    })

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...validFiles],
    }))

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveImage = (index) => {
    setImagePreview((prev) => prev.filter((_, i) => i !== index))
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const validateStep = (step) => {
    const newErrors = {}
    if (step === 1) {
      if (!formData.title.trim()) newErrors.title = 'Title is required'
      else if (formData.title.trim().length < 5) newErrors.title = 'Title must be at least 5 characters'
      if (!formData.category) newErrors.category = 'Category is required'
    }
    if (step === 2) {
      if (!formData.description.trim()) newErrors.description = 'Description is required'
      else if (formData.description.trim().length < 20) newErrors.description = 'Description must be at least 20 characters'
      if (!formData.ward) newErrors.ward = 'Ward selection is required'
    }
    if (step === 3) {
      if (imagePreview.length === 0) newErrors.images = 'At least one photo attachment is required'
      if (!formData.privacyAgree) newErrors.privacyAgree = 'You must agree to the privacy terms'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1)
  }

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(6)
          const lng = position.coords.longitude.toFixed(6)
          setFormData((prev) => ({
            ...prev,
            location: `GPS: ${lat}, ${lng}`,
          }))
          success('Location loaded successfully!')
        },
        () => {
          showError('Unable to retrieve location.')
        }
      )
    } else {
      showError('Geolocation is not supported by your browser.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateStep(4) && !validateStep(3)) return

    setLoading(true)
    try {
      const result = await submit(
        {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          ward: formData.ward,
          location: formData.location || null,
        },
        formData.images
      )
      setTicketId(result?.id || 'CP-' + Math.floor(100000 + Math.random() * 900000))
      setIsSuccess(true)
      success('Complaint submitted successfully!')
    } catch (err) {
      showError(err?.message || 'Failed to submit complaint')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const totalSteps = 4
  const progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md flex flex-col items-center py-xl px-margin-mobile md:px-margin-desktop">
      <div className="w-full max-w-4xl bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        
        {/* Progress Stepper */}
        {!isSuccess && (
          <div className="bg-surface-container-low px-xl py-lg border-b border-outline-variant">
            <div className="flex items-center justify-between relative max-w-2xl mx-auto">
              <div className="absolute top-1/2 left-0 w-full h-[2px] bg-outline-variant -translate-y-1/2 z-0"></div>
              <div 
                className="absolute top-1/2 left-0 h-[2px] bg-primary -translate-y-1/2 z-0 transition-all duration-500" 
                style={{ width: `${progressPercent}%` }}
              ></div>
              
              {/* Step 1 Circle */}
              <div className="relative z-10 flex flex-col items-center gap-xs">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${currentStep >= 1 ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface-variant border-2 border-outline-variant'}`}>
                  {currentStep > 1 ? <span className="material-symbols-outlined text-[18px]">check</span> : '1'}
                </div>
                <span className={`font-label-md ${currentStep >= 1 ? 'text-primary' : 'text-outline'}`}>Incident</span>
              </div>

              {/* Step 2 Circle */}
              <div className="relative z-10 flex flex-col items-center gap-xs">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-colors ${currentStep >= 2 ? 'bg-primary text-on-primary border-transparent' : 'bg-surface-container-highest text-on-surface-variant border-outline-variant'}`}>
                  {currentStep > 2 ? <span className="material-symbols-outlined text-[18px]">check</span> : '2'}
                </div>
                <span className={`font-label-md ${currentStep >= 2 ? 'text-primary' : 'text-outline'}`}>Location</span>
              </div>

              {/* Step 3 Circle */}
              <div className="relative z-10 flex flex-col items-center gap-xs">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-colors ${currentStep >= 3 ? 'bg-primary text-on-primary border-transparent' : 'bg-surface-container-highest text-on-surface-variant border-outline-variant'}`}>
                  {currentStep > 3 ? <span className="material-symbols-outlined text-[18px]">check</span> : '3'}
                </div>
                <span className={`font-label-md ${currentStep >= 3 ? 'text-primary' : 'text-outline'}`}>Attachments</span>
              </div>

              {/* Step 4 Circle */}
              <div className="relative z-10 flex flex-col items-center gap-xs">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-colors ${currentStep === 4 ? 'bg-primary text-on-primary border-transparent' : 'bg-surface-container-highest text-on-surface-variant border-outline-variant'}`}>
                  4
                </div>
                <span className={`font-label-md ${currentStep === 4 ? 'text-primary' : 'text-outline'}`}>Review</span>
              </div>
            </div>
          </div>
        )}

        {/* Content Canvas */}
        <div className="p-xl min-h-[460px] text-left">
          {isSuccess ? (
            /* Success State */
            <div className="flex flex-col items-center justify-center text-center space-y-lg py-xl">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-on-primary">
                <span className="material-symbols-outlined text-[48px] font-variation-settings-fill">check_circle</span>
              </div>
              <div className="space-y-xs">
                <h2 className="font-headline-xl text-headline-xl text-primary font-bold">Report Submitted</h2>
                <p className="text-on-surface-variant max-w-md mx-auto">
                  Your complaint has been successfully filed with Ticket ID: <strong className="text-primary">{ticketId}</strong>. You can track its progress in your dashboard.
                </p>
              </div>
              <div className="flex gap-md">
                <button 
                  className="px-xl py-md bg-primary text-on-primary rounded-full font-label-lg shadow-sm hover:opacity-90 transition-all cursor-pointer" 
                  onClick={() => {
                    setFormData({
                      title: '',
                      description: '',
                      category: '',
                      ward: '',
                      location: '',
                      incidentDate: '',
                      incidentTime: '',
                      images: [],
                      privacyAgree: false
                    })
                    setImagePreview([])
                    setIsSuccess(false)
                    setCurrentStep(1)
                  }}
                >
                  Submit Another
                </button>
                <button 
                  className="px-xl py-md border border-outline rounded-full font-label-lg hover:bg-surface-container transition-all cursor-pointer" 
                  onClick={() => navigate(ROUTES.CITIZEN.DASHBOARD)}
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-xl">
              
              {/* STEP 1: Incident Details */}
              {currentStep === 1 && (
                <div className="space-y-lg">
                  <div className="space-y-xs">
                    <h2 className="font-headline-md text-headline-md text-primary font-bold">Incident Details</h2>
                    <p className="text-on-surface-variant">Provide a brief title and categorize the issue you're reporting.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                    
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-lg" htmlFor="title">Title *</label>
                      <input 
                        className={`w-full h-12 px-md border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all ${errors.title ? 'border-error' : 'border-outline'}`}
                        id="title" 
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g., Large pothole on Main St" 
                        required 
                        disabled={loading}
                        type="text"
                      />
                      {errors.title && <p className="text-error font-label-md">{errors.title}</p>}
                    </div>

                    <div className="flex flex-col gap-xs">
                      <label className="font-label-lg" htmlFor="category">Category *</label>
                      <select 
                        className={`w-full h-12 px-md border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-white ${errors.category ? 'border-error' : 'border-outline'}`}
                        id="category" 
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      >
                        <option value="">Select Category</option>
                        {categories.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                      {errors.category && <p className="text-error font-label-md">{errors.category}</p>}
                    </div>

                    <div className="flex flex-col gap-xs">
                      <label className="font-label-lg" htmlFor="incidentDate">Date Observed</label>
                      <input 
                        className="w-full h-12 px-md border border-outline rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-white" 
                        id="incidentDate" 
                        name="incidentDate"
                        value={formData.incidentDate}
                        onChange={handleChange}
                        type="date"
                        disabled={loading}
                      />
                    </div>

                    <div className="flex flex-col gap-xs">
                      <label className="font-label-lg" htmlFor="incidentTime">Time Observed (Approx)</label>
                      <input 
                        className="w-full h-12 px-md border border-outline rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-white" 
                        id="incidentTime" 
                        name="incidentTime"
                        value={formData.incidentTime}
                        onChange={handleChange}
                        type="time"
                        disabled={loading}
                      />
                    </div>

                  </div>
                </div>
              )}

              {/* STEP 2: Location & Description */}
              {currentStep === 2 && (
                <div className="space-y-lg">
                  <div className="space-y-xs">
                    <h2 className="font-headline-md text-headline-md text-primary font-bold">Location &amp; Description</h2>
                    <p className="text-on-surface-variant">Tell us exactly where this is happening and give us more context.</p>
                  </div>
                  
                  <div className="w-full h-64 rounded-xl overflow-hidden border border-outline-variant relative group">
                    <div className="absolute inset-0 bg-surface-container-high flex items-center justify-center">
                      <img 
                        className="w-full h-full object-cover" 
                        alt="Simulated map location drop"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBHt6fam6R6H_jXispBEb--ptUk5AGZWJCMflIs8drCxK3ByLuh_A7PmF_Sdh4l9Kuw7NRRbvyHe00L5cWeJNHQ11jKCCPOr3QHxV9vobBXfZDMOT1W2Zb0xSnyYIxQwzef2F4iWJOJSyVnCe6V67jh6iRt-y6ZyiHN6Eprt7aCNcqzjW3pIex5SJj1syH92vOtLEWzooHIEXRCuL2WwSXnf_DSxKIo8CzKO-EkM91mhFCsZEzkxMyRsl5Qb7tM5yHRhNhsQoeVidA"
                      />
                      <button 
                        type="button"
                        onClick={handleUseCurrentLocation}
                        className="absolute bottom-md right-md bg-white p-sm rounded-lg shadow-md border border-outline-variant font-label-md flex items-center gap-xs cursor-pointer hover:bg-surface-container-low transition-colors"
                      >
                        <span className="material-symbols-outlined text-primary">my_location</span>
                        Use my current location
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-lg" htmlFor="ward">Ward/Area *</label>
                      <select 
                        className={`w-full h-12 px-md border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-white ${errors.ward ? 'border-error' : 'border-outline'}`}
                        id="ward" 
                        name="ward"
                        value={formData.ward}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      >
                        <option value="">Select Ward</option>
                        {wards.map((w) => (
                          <option key={w.value} value={w.value}>{w.label}</option>
                        ))}
                      </select>
                      {errors.ward && <p className="text-error font-label-md">{errors.ward}</p>}
                    </div>

                    <div className="flex flex-col gap-xs">
                      <label className="font-label-lg" htmlFor="location">Specific Street Address / GPS</label>
                      <input 
                        className="w-full h-12 px-md border border-outline rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" 
                        id="location" 
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="e.g. 123 Civic Plaza or corner of Oak & 5th" 
                        disabled={loading}
                        type="text"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-xs">
                    <label className="font-label-lg" htmlFor="description">Detailed Description *</label>
                    <textarea 
                      className={`w-full p-md border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all ${errors.description ? 'border-error' : 'border-outline'}`}
                      id="description" 
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Describe the severity and any immediate hazards..." 
                      required 
                      disabled={loading}
                      rows="4"
                    ></textarea>
                    {errors.description && <p className="text-error font-label-md">{errors.description}</p>}
                  </div>
                </div>
              )}

              {/* STEP 3: Attachments & Privacy */}
              {currentStep === 3 && (
                <div className="space-y-lg">
                  <div className="space-y-xs">
                    <h2 className="font-headline-md text-headline-md text-primary font-bold">Attachments &amp; Privacy</h2>
                    <p className="text-on-surface-variant">Photos help us resolve issues faster. Your privacy is important to us.</p>
                  </div>
                  
                  <div 
                    className={`border-2 border-dashed rounded-xl p-xl flex flex-col items-center justify-center gap-md bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer group ${errors.images ? 'border-red-300 bg-red-50' : 'border-outline-variant'}`}
                    onClick={() => !loading && fileInputRef.current?.click()}
                  >
                    <span className="material-symbols-outlined text-primary text-[48px]">cloud_upload</span>
                    <div className="text-center">
                      <p className="font-headline-sm text-on-surface font-semibold">Click to upload or drag and drop</p>
                      <p className="text-on-surface-variant font-label-md">PNG, JPG or GIF up to 5MB (max 5 photos)</p>
                    </div>
                    <button 
                      className="px-lg py-sm border border-primary text-primary rounded-lg font-label-lg hover:bg-primary hover:text-on-primary transition-all cursor-pointer" 
                      type="button"
                    >
                      Select Files
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={loading}
                      className="hidden"
                    />
                  </div>

                  {errors.images && <p className="text-error font-label-md">{errors.images}</p>}

                  {/* Image Preview Grid */}
                  {imagePreview.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-md">
                      {imagePreview.map((img, index) => (
                        <div key={index} className="relative group rounded-lg overflow-hidden border border-outline-variant">
                          <img
                            src={img.preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 bg-error text-white rounded-full p-1 hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center"
                            disabled={loading}
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                          <p className="text-[10px] text-on-surface-variant p-1 truncate bg-white">{img.file.name}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-secondary-container rounded-xl p-md flex gap-md items-start">
                    <span className="material-symbols-outlined text-on-secondary-container pt-xs">verified_user</span>
                    <div className="flex flex-col gap-xs">
                      <label className="flex items-center gap-sm cursor-pointer select-none">
                        <input 
                          className="w-5 h-5 rounded border-outline text-primary focus:ring-primary cursor-pointer" 
                          id="privacyAgree" 
                          name="privacyAgree"
                          checked={formData.privacyAgree}
                          onChange={handleChange}
                          required 
                          disabled={loading}
                          type="checkbox"
                        />
                        <span className="font-label-lg text-on-secondary-container font-semibold">I agree to the privacy policy and terms of submission.</span>
                      </label>
                      <p className="font-label-md text-on-secondary-container opacity-80">Your contact info will only be used to update you on this report's status.</p>
                      {errors.privacyAgree && <p className="text-red-700 font-label-md font-bold mt-1">{errors.privacyAgree}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Review & Submit */}
              {currentStep === 4 && (
                <div className="space-y-lg">
                  <div className="space-y-xs">
                    <h2 className="font-headline-md text-headline-md text-primary font-bold">Review Submission</h2>
                    <p className="text-on-surface-variant">Double-check your details before official submission to the Department of Works.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                    <div className="p-md rounded-lg bg-surface border border-outline-variant space-y-xs">
                      <span className="text-on-surface-variant font-label-md uppercase tracking-wider block text-xs">Title</span>
                      <p className="font-headline-sm text-primary font-bold">{formData.title || '---'}</p>
                    </div>
                    <div className="p-md rounded-lg bg-surface border border-outline-variant space-y-xs">
                      <span className="text-on-surface-variant font-label-md uppercase tracking-wider block text-xs">Category</span>
                      <p className="font-headline-sm text-primary font-bold">{categories.find(c => c.value === formData.category)?.label || '---'}</p>
                    </div>
                    <div className="p-md rounded-lg bg-surface border border-outline-variant space-y-xs md:col-span-2">
                      <span className="text-on-surface-variant font-label-md uppercase tracking-wider block text-xs">Ward &amp; Specific Location</span>
                      <p className="font-body-md text-on-surface font-semibold">
                        {wards.find(w => w.value === formData.ward)?.label || 'No Ward Selected'}
                        {formData.location ? ` - ${formData.location}` : ''}
                      </p>
                    </div>
                    <div className="p-md rounded-lg bg-surface border border-outline-variant space-y-xs md:col-span-2">
                      <span className="text-on-surface-variant font-label-md uppercase tracking-wider block text-xs">Description</span>
                      <p className="font-body-md text-on-surface whitespace-pre-wrap">{formData.description || '---'}</p>
                    </div>
                  </div>
                  
                  {imagePreview.length > 0 && (
                    <div>
                      <span className="text-on-surface-variant font-label-md uppercase tracking-wider block text-xs mb-2">Uploaded Images ({imagePreview.length})</span>
                      <div className="flex gap-md overflow-x-auto py-1">
                        {imagePreview.map((img, i) => (
                          <img 
                            key={i} 
                            src={img.preview} 
                            alt="Upload preview" 
                            className="h-20 w-20 object-cover rounded-lg border border-outline-variant shrink-0" 
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-sm p-md bg-error-container text-on-error-container rounded-lg border border-error/20">
                    <span className="material-symbols-outlined">report</span>
                    <p className="font-label-md font-medium">Once submitted, this report enters the municipal workflow and cannot be edited immediately.</p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center border-t border-outline-variant pt-xl">
                <button 
                  className={`flex items-center gap-sm px-xl py-md border border-outline rounded-lg text-primary font-label-lg cursor-pointer hover:bg-surface-container transition-all ${currentStep === 1 ? 'invisible' : ''}`}
                  onClick={handleBack} 
                  type="button"
                  disabled={loading}
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                  Back
                </button>
                <div className="flex items-center gap-md">
                  {currentStep < totalSteps ? (
                    <button 
                      className="flex items-center gap-sm px-xl py-md bg-primary text-on-primary rounded-lg font-label-lg shadow-sm hover:opacity-90 transition-all cursor-pointer" 
                      onClick={handleNext}
                      type="button"
                    >
                      Next Step
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                  ) : (
                    <button 
                      className="flex items-center gap-sm px-xl py-md bg-primary text-on-primary rounded-lg font-label-lg shadow-sm hover:opacity-90 transition-all cursor-pointer disabled:opacity-50" 
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? 'Submitting...' : 'Submit Complaint'}
                      <span className="material-symbols-outlined">send</span>
                    </button>
                  )}
                </div>
              </div>

            </form>
          )}
        </div>

      </div>

      {/* Info Grid (Bento Style Support) */}
      <div className="w-full max-w-4xl mt-xl grid grid-cols-1 md:grid-cols-3 gap-lg text-left">
        <div className="p-lg bg-surface border border-outline-variant rounded-xl flex flex-col gap-sm mui-card-shadow">
          <span className="material-symbols-outlined text-primary text-2xl">schedule</span>
          <h4 className="font-label-lg text-primary font-bold">Estimated Response</h4>
          <p className="font-label-md text-on-surface-variant">Emergency reports are triaged within 4 hours. General maintenance within 3-5 business days.</p>
        </div>
        <div className="p-lg bg-surface border border-outline-variant rounded-xl flex flex-col gap-sm mui-card-shadow">
          <span className="material-symbols-outlined text-primary text-2xl">support_agent</span>
          <h4 className="font-label-lg text-primary font-bold">Need Live Help?</h4>
          <p className="font-label-md text-on-surface-variant">Call our municipal hotline at 311 for urgent hazards that require immediate intervention.</p>
        </div>
        <div className="p-lg bg-surface border border-outline-variant rounded-xl flex flex-col gap-sm mui-card-shadow">
          <span className="material-symbols-outlined text-primary text-2xl">policy</span>
          <h4 className="font-label-lg text-primary font-bold">Public Transparency</h4>
          <p className="font-label-md text-on-surface-variant">All valid reports are visible on our Open Data map to ensure neighborhood accountability.</p>
        </div>
      </div>

    </div>
  )
}

