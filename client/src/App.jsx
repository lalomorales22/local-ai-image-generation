import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Image, Heart, Trash2, Download, X, Copy, Wand2,
  Clock, ChevronLeft, ChevronRight, Plus, Folder, Tag
} from 'lucide-react'
import './index.css'

const EXAMPLE_PROMPTS = [
  "A neon sign reading 'DREAM BIG' in a rainy Tokyo alley at night",
  "Futuristic cyberpunk city with flying cars and holographic billboards",
  "Cozy cabin interior with fireplace, snow falling outside the window",
  "Astronaut floating in space with Earth reflection in helmet visor",
]

const DEFAULT_CATEGORIES = ['All', 'Favorites', 'Uncategorized']

function App() {
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [gallery, setGallery] = useState([])
  const [selectedImage, setSelectedImage] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [view, setView] = useState('generate')
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [activeCategory, setActiveCategory] = useState('All')
  const [newCategory, setNewCategory] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [error, setError] = useState(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    fetchGallery()
    loadCategories()
  }, [])

  const fetchGallery = async () => {
    try {
      const res = await fetch('/api/gallery')
      const data = await res.json()
      setGallery(data.map(img => ({ ...img, category: img.category || 'Uncategorized' })))
    } catch (err) {
      console.error('Failed to fetch gallery:', err)
    }
  }

  const loadCategories = () => {
    const saved = localStorage.getItem('flux-categories')
    if (saved) {
      setCategories(JSON.parse(saved))
    }
  }

  const saveCategories = (cats) => {
    localStorage.setItem('flux-categories', JSON.stringify(cats))
    setCategories(cats)
  }

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      const updated = [...categories, newCategory.trim()]
      saveCategories(updated)
      setNewCategory('')
      setShowNewCategory(false)
    }
  }

  const deleteCategory = (cat) => {
    if (DEFAULT_CATEGORIES.includes(cat)) return
    const updated = categories.filter(c => c !== cat)
    saveCategories(updated)
    setGallery(prev => prev.map(img =>
      img.category === cat ? { ...img, category: 'Uncategorized' } : img
    ))
    if (activeCategory === cat) setActiveCategory('All')
  }

  const generateImage = async () => {
    if (!prompt.trim() || generating) return

    setGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() })
      })

      const data = await response.json()

      if (data.success) {
        const newImage = { ...data.image, category: 'Uncategorized' }
        setGallery(prev => [newImage, ...prev])
        setPrompt('')
      } else {
        setError(data.error || 'Generation failed')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const toggleFavorite = async (id, e) => {
    e?.stopPropagation()
    try {
      await fetch(`/api/gallery/${id}/favorite`, { method: 'POST' })
      setGallery(prev => prev.map(img =>
        img.id === id ? { ...img, favorite: !img.favorite } : img
      ))
      if (selectedImage?.id === id) {
        setSelectedImage(prev => ({ ...prev, favorite: !prev.favorite }))
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
    }
  }

  const deleteImage = async (id, e) => {
    e?.stopPropagation()
    try {
      await fetch(`/api/gallery/${id}`, { method: 'DELETE' })
      setGallery(prev => prev.filter(img => img.id !== id))
      if (selectedImage?.id === id) {
        setSelectedImage(null)
      }
    } catch (err) {
      console.error('Failed to delete image:', err)
    }
  }

  const downloadImage = (image, e) => {
    e?.stopPropagation()
    const link = document.createElement('a')
    link.href = `/images/${image.filename}`
    link.download = `flux-${image.id}.png`
    link.click()
  }

  const copyPrompt = (text, e) => {
    e?.stopPropagation()
    navigator.clipboard.writeText(text)
  }

  const setImageCategory = (id, category) => {
    setGallery(prev => prev.map(img =>
      img.id === id ? { ...img, category } : img
    ))
    if (selectedImage?.id === id) {
      setSelectedImage(prev => ({ ...prev, category }))
    }
  }

  const filteredGallery = activeCategory === 'All'
    ? gallery
    : activeCategory === 'Favorites'
      ? gallery.filter(img => img.favorite)
      : gallery.filter(img => img.category === activeCategory)

  const openImage = (image) => {
    const index = filteredGallery.findIndex(img => img.id === image.id)
    setSelectedIndex(index)
    setSelectedImage(image)
  }

  const navigateImage = (direction) => {
    const newIndex = selectedIndex + direction
    if (newIndex >= 0 && newIndex < filteredGallery.length) {
      setSelectedIndex(newIndex)
      setSelectedImage(filteredGallery[newIndex])
    }
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Keyboard navigation for modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedImage) return

      if (e.key === 'ArrowLeft' && selectedIndex > 0) {
        navigateImage(-1)
      } else if (e.key === 'ArrowRight' && selectedIndex < filteredGallery.length - 1) {
        navigateImage(1)
      } else if (e.key === 'Escape') {
        setSelectedImage(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedImage, selectedIndex, filteredGallery.length])

  return (
    <div className="min-h-screen dot-grid flex items-center justify-center p-8">
      {/* Widget Container */}
      <motion.div
        className="widget rounded-3xl w-full max-w-5xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Tab Header */}
        <div className="flex items-center border-b border-white/10">
          <button
            onClick={() => setView('generate')}
            className={`tab flex-1 py-4 px-6 font-medium text-sm flex items-center justify-center gap-2 ${
              view === 'generate' ? 'tab-active' : 'tab-inactive'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            Generate
          </button>
          <button
            onClick={() => setView('gallery')}
            className={`tab flex-1 py-4 px-6 font-medium text-sm flex items-center justify-center gap-2 ${
              view === 'gallery' ? 'tab-active' : 'tab-inactive'
            }`}
          >
            <Image className="w-4 h-4" />
            Gallery
            {gallery.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-white/10 rounded-full text-xs">
                {gallery.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            {view === 'generate' ? (
              <motion.div
                key="generate"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Title */}
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Create an image
                  </h1>
                  <p className="text-white/50 text-sm">
                    Powered by FLUX.2 Klein
                  </p>
                </div>

                {/* Prompt Input */}
                <div className="mb-6">
                  <textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.metaKey) {
                        generateImage()
                      }
                    }}
                    placeholder="Describe your image..."
                    className="input w-full h-32 px-4 py-3 rounded-xl resize-none text-sm"
                    disabled={generating}
                  />
                </div>

                {/* Example Prompts */}
                <div className="mb-6">
                  <p className="text-xs text-white/30 mb-3">Try an example:</p>
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLE_PROMPTS.map((example, i) => (
                      <button
                        key={i}
                        onClick={() => setPrompt(example)}
                        className="btn-secondary px-3 py-1.5 text-xs rounded-lg truncate max-w-[200px]"
                        disabled={generating}
                      >
                        {example.slice(0, 35)}...
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-4 bg-white/5 border border-white/10 rounded-xl text-white/70 text-sm">
                    {error}
                  </div>
                )}

                {/* Generate Button */}
                <button
                  onClick={generateImage}
                  disabled={!prompt.trim() || generating}
                  className="btn-primary w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-3"
                >
                  {generating ? (
                    <>
                      <div className="spinner w-5 h-5" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate
                    </>
                  )}
                </button>

                {/* Keyboard hint */}
                <p className="text-center text-white/20 text-xs mt-4">
                  Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded">⌘</kbd> + <kbd className="px-1.5 py-0.5 bg-white/10 rounded">Enter</kbd> to generate
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="gallery"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Categories */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 flex-wrap">
                    {categories.map((cat) => (
                      <div key={cat} className="relative group">
                        <button
                          onClick={() => setActiveCategory(cat)}
                          className={`category-pill px-4 py-2 rounded-full text-sm font-medium ${
                            activeCategory === cat
                              ? 'category-pill-active'
                              : 'bg-white/5 text-white/60'
                          }`}
                        >
                          {cat === 'Favorites' && <Heart className="w-3 h-3 inline mr-1.5" />}
                          {cat}
                          {cat !== 'All' && cat !== 'Favorites' && (
                            <span className="ml-1.5 text-xs opacity-50">
                              {cat === 'Uncategorized'
                                ? gallery.filter(img => img.category === 'Uncategorized').length
                                : gallery.filter(img => img.category === cat).length}
                            </span>
                          )}
                        </button>
                        {!DEFAULT_CATEGORIES.includes(cat) && (
                          <button
                            onClick={() => deleteCategory(cat)}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-white/20 rounded-full hidden group-hover:flex items-center justify-center"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    ))}

                    {showNewCategory ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                          placeholder="Category name"
                          className="input px-3 py-2 rounded-full text-sm w-32"
                          autoFocus
                        />
                        <button
                          onClick={addCategory}
                          className="p-2 bg-white/10 rounded-full hover:bg-white/20"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setShowNewCategory(false); setNewCategory('') }}
                          className="p-2 bg-white/10 rounded-full hover:bg-white/20"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowNewCategory(true)}
                        className="category-pill px-4 py-2 rounded-full text-sm font-medium bg-white/5 text-white/40 hover:text-white/60 flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        New
                      </button>
                    )}
                  </div>
                </div>

                {/* Gallery Grid */}
                {filteredGallery.length === 0 ? (
                  <div className="text-center py-16">
                    <Image className="w-12 h-12 mx-auto text-white/20 mb-4" />
                    <p className="text-white/40">
                      {activeCategory === 'Favorites' ? 'No favorites yet' : 'No images yet'}
                    </p>
                    {activeCategory === 'All' && (
                      <button
                        onClick={() => setView('generate')}
                        className="btn-secondary mt-4 px-6 py-2 rounded-lg text-sm"
                      >
                        Create your first image
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredGallery.map((image) => (
                      <motion.div
                        key={image.id}
                        className="group image-card rounded-xl overflow-hidden bg-white/5 cursor-pointer"
                        onClick={() => openImage(image)}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <div className="aspect-square relative">
                          <img
                            src={`/images/${image.filename}`}
                            alt={image.prompt}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23111" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%23333" font-size="10">No Preview</text></svg>'
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                          {/* Quick actions */}
                          <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <button
                              onClick={(e) => toggleFavorite(image.id, e)}
                              className="p-1.5 bg-black/50 backdrop-blur rounded-lg hover:bg-black/70"
                            >
                              <Heart className={`w-3.5 h-3.5 ${image.favorite ? 'fill-white' : ''}`} />
                            </button>
                            <button
                              onClick={(e) => downloadImage(image, e)}
                              className="p-1.5 bg-black/50 backdrop-blur rounded-lg hover:bg-black/70"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {image.favorite && (
                            <div className="absolute top-2 right-2">
                              <Heart className="w-4 h-4 fill-white drop-shadow-lg" />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
          >
            {/* Navigation Arrows */}
            {selectedIndex > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); navigateImage(-1) }}
                className="nav-arrow absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {selectedIndex < filteredGallery.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); navigateImage(1) }}
                className="nav-arrow absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            <motion.div
              className="widget rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col md:flex-row"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image */}
              <div className="flex-1 bg-black flex items-center justify-center min-h-[300px]">
                <img
                  src={`/images/${selectedImage.filename}`}
                  alt={selectedImage.prompt}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              </div>

              {/* Details Panel */}
              <div className="w-full md:w-72 p-5 flex flex-col border-l border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-white/40">
                    {selectedIndex + 1} / {filteredGallery.length}
                  </span>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto">
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-wide">Prompt</label>
                    <p className="mt-1 text-sm text-white/80 leading-relaxed">{selectedImage.prompt}</p>
                  </div>

                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-wide">Created</label>
                    <p className="mt-1 text-sm text-white/60">{formatDate(selectedImage.timestamp)}</p>
                  </div>

                  {/* Category Selector */}
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-wide flex items-center gap-1.5">
                      <Tag className="w-3 h-3" />
                      Category
                    </label>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {categories.filter(c => c !== 'All' && c !== 'Favorites').map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setImageCategory(selectedImage.id, cat)}
                          className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                            selectedImage.category === cat
                              ? 'bg-white text-black'
                              : 'bg-white/10 text-white/60 hover:bg-white/20'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => toggleFavorite(selectedImage.id, e)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                        selectedImage.favorite
                          ? 'bg-white text-black'
                          : 'btn-secondary'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${selectedImage.favorite ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => downloadImage(selectedImage, e)}
                      className="flex-1 btn-secondary py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => copyPrompt(selectedImage.prompt, e)}
                      className="flex-1 btn-secondary py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setPrompt(selectedImage.prompt)
                      setView('generate')
                      setSelectedImage(null)
                    }}
                    className="btn-primary w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Wand2 className="w-4 h-4" />
                    Use this prompt
                  </button>
                  <button
                    onClick={(e) => {
                      deleteImage(selectedImage.id, e)
                      setSelectedImage(null)
                    }}
                    className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Keyboard hints */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 text-white/30 text-xs">
              <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded">←</kbd> <kbd className="px-1.5 py-0.5 bg-white/10 rounded">→</kbd> Navigate</span>
              <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded">Esc</kbd> Close</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
