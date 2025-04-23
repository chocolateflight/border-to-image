# Border-to-Image

🖼️ **Border-to-Image** is a simple, single-page web app that lets you upload an image, add custom borders (overlay or canvas), adjust aspect ratios, and download your edited photo at full resolution. It runs entirely in the browser (no server required) and works seamlessly on desktops and mobile devices.

---

## 🛠️ Features

- **Upload** JPG/PNG/BMP images directly from your device.
- **Overlay Border**: Draw a colored frame around your image _without_ changing its aspect ratio.
- **Canvas Border**: Expand the canvas to a new aspect ratio (e.g. 4:3, 1:1, 9:16, etc.) and center your image on a colored background.
- **Live Preview & Undo**:
  - Real-time border preview using sliders and color pickers.
  - **Apply** adds the border to history; **Undo** reverses the last operation.
  - **Reset** clears all borders and restores the original image.
- **Aspect Ratio Presets**:
  - Landscape & portrait options: 1:1, 4:3/3:4, 3:2/2:3, 5:4/4:5, 16:9/9:16, and keep original.
- **Download** as PNG (lossless) or JPEG (100% quality) at full resolution.
- Fully **responsive** UI that scales images to fit any viewport (desktop or mobile).

---

## 🌐 Live Demo

A live version is hosted at: [https://chocolateflight.github.io/border-to-image/](https://chocolateflight.github.io/border-to-image/)

---

## 🖱️ How to Use

1. **Upload**: Click **Choose File** and select your image.
2. **Overlay Border**:
   - Pick a color and drag the **Width** slider to preview.
   - Click **Apply Overlay** to add it permanently.
3. **Canvas Border**:
   - Pick a background color.
   - Drag the **Width** slider to preview canvas size.
   - Select an **Aspect Ratio** or keep current.
   - Click **Apply Canvas** to add it permanently.
4. **Undo/Reset**:
   - **Undo** removes the last border action.
   - **Reset** clears all borders, restoring the original image.
5. **Download**: Choose **PNG** or **JPEG**, then click **Download**.

---

## ⚙️ Structure

```
├── index.html       # Single-page app HTML
└── style.css        # CSS code
└── script.js        # JS
└── README.md        # This documentation file



