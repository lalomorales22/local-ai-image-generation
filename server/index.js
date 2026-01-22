const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3001;
const OLLAMA_URL = 'http://localhost:11434';

app.use(cors());
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, '../public/images')));

const IMAGES_DIR = path.join(__dirname, '../public/images');
const GALLERY_FILE = path.join(__dirname, '../gallery.json');

// Ensure directories exist
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Load gallery data
function loadGallery() {
  if (fs.existsSync(GALLERY_FILE)) {
    return JSON.parse(fs.readFileSync(GALLERY_FILE, 'utf-8'));
  }
  return [];
}

// Save gallery data
function saveGallery(gallery) {
  fs.writeFileSync(GALLERY_FILE, JSON.stringify(gallery, null, 2));
}

// Get all images
app.get('/api/gallery', (req, res) => {
  const gallery = loadGallery();
  res.json(gallery);
});

// Generate image endpoint using raw Ollama API
app.post('/api/generate', async (req, res) => {
  const { prompt, model = 'x/flux2-klein' } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    console.log(`Generating image with prompt: "${prompt}"`);

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false
      })
    });

    const text = await response.text();

    // Parse NDJSON - split by newlines and find the image data
    const lines = text.trim().split('\n');
    let imageBase64 = '';

    for (const line of lines) {
      try {
        const json = JSON.parse(line);
        // Image data comes in the 'image' field, not 'response'
        if (json.image) {
          imageBase64 = json.image;
        }
      } catch (e) {
        // Skip unparseable lines
      }
    }

    if (imageBase64) {
      const imageId = uuidv4();
      const timestamp = new Date().toISOString();
      const imagePath = path.join(IMAGES_DIR, `${imageId}.png`);

      // Decode base64 and save
      const buffer = Buffer.from(imageBase64, 'base64');
      fs.writeFileSync(imagePath, buffer);

      const imageEntry = {
        id: imageId,
        prompt,
        model,
        timestamp,
        filename: `${imageId}.png`,
        favorite: false
      };

      const gallery = loadGallery();
      gallery.unshift(imageEntry);
      saveGallery(gallery);

      console.log(`Image saved: ${imageId}.png`);

      res.json({
        success: true,
        image: imageEntry
      });
    } else {
      res.status(500).json({ error: 'No image data in response' });
    }
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Streaming generate endpoint with progress updates
app.post('/api/generate-stream', async (req, res) => {
  const { prompt, model = 'x/flux2-klein' } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    console.log(`Streaming generation with prompt: "${prompt}"`);

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: true
      })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let imageBase64 = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line in buffer

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line);
          // Image data comes in the 'image' field
          if (json.image) {
            imageBase64 = json.image;
          }
          // Send progress updates
          if (json.completed !== undefined && json.total !== undefined) {
            res.write(`data: ${JSON.stringify({
              status: 'generating',
              progress: Math.round((json.completed / json.total) * 100)
            })}\n\n`);
          }
        } catch (e) {
          // Skip unparseable lines
        }
      }
    }

    // Process remaining buffer
    if (buffer.trim()) {
      try {
        const json = JSON.parse(buffer);
        if (json.image) {
          imageBase64 = json.image;
        }
      } catch (e) {}
    }

    if (imageBase64) {
      const imageId = uuidv4();
      const timestamp = new Date().toISOString();
      const imagePath = path.join(IMAGES_DIR, `${imageId}.png`);

      const imgBuffer = Buffer.from(imageBase64, 'base64');
      fs.writeFileSync(imagePath, imgBuffer);

      const imageEntry = {
        id: imageId,
        prompt,
        model,
        timestamp,
        filename: `${imageId}.png`,
        favorite: false
      };

      const gallery = loadGallery();
      gallery.unshift(imageEntry);
      saveGallery(gallery);

      console.log(`Image saved: ${imageId}.png`);

      res.write(`data: ${JSON.stringify({ status: 'complete', image: imageEntry })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ status: 'error', error: 'No image data' })}\n\n`);
    }

    res.end();
  } catch (error) {
    console.error('Stream error:', error);
    res.write(`data: ${JSON.stringify({ status: 'error', error: error.message })}\n\n`);
    res.end();
  }
});

// Toggle favorite
app.post('/api/gallery/:id/favorite', (req, res) => {
  const gallery = loadGallery();
  const image = gallery.find(img => img.id === req.params.id);
  if (image) {
    image.favorite = !image.favorite;
    saveGallery(gallery);
    res.json(image);
  } else {
    res.status(404).json({ error: 'Image not found' });
  }
});

// Delete image
app.delete('/api/gallery/:id', (req, res) => {
  let gallery = loadGallery();
  const image = gallery.find(img => img.id === req.params.id);

  if (image) {
    const imagePath = path.join(IMAGES_DIR, image.filename);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    gallery = gallery.filter(img => img.id !== req.params.id);
    saveGallery(gallery);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Image not found' });
  }
});

// Get available models
app.get('/api/models', async (req, res) => {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    const data = await response.json();
    const imageModels = data.models.filter(m =>
      m.name.includes('flux') ||
      m.name.includes('stable') ||
      m.name.includes('sdxl') ||
      m.name.includes('dall')
    );
    res.json(imageModels.length > 0 ? imageModels : data.models);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`FLUX Studio server running on http://localhost:${PORT}`);
});
