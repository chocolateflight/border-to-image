# Border-to-Image

🖼️ **Border-to-Image** is a simple, single-page web app that lets you upload an image, add custom borders (inner or outer), adjust aspect ratios, set border widths in pixels or percentages, use simple or advanced per-side border controls, and download your edited photo at full resolution. It runs entirely in the browser (no server required) and works seamlessly on desktops and mobile devices.

---

## 🛠️ Features

- **Upload**: JPG/PNG/BMP/GIF images directly from your device.
- **Inner Border**: Adds a border around the image, increasing canvas size based on the specified width(s). Maintains the image's position relative to the borders (offset correctly in Advanced Mode).
- **Outer Border**: Adds a border while optionally resizing the entire canvas to a new aspect ratio (e.g. 4:3, 1:1). Fills the background color. Image content (including any inner borders) is positioned based on border settings and aspect ratio padding.
- **px / % Width Units**: Define border widths using fixed pixels (`px`) or percentages (`%`) relative to the current image dimensions at the time of application.
- **Simple / Advanced Mode**:
    - Toggle between modes at any time.
    - **Simple Mode**: Set a single, uniform border width applied to all four sides. Image content remains centered within the borders.
    - **Advanced Mode**: Set individual widths for Top, Right, Bottom, and Left. Image positioning respects these asymmetric borders.
- **Live Preview & Undo**:
  - Real-time border preview using sliders, number inputs, and color pickers.
  - **Apply** adds the border operation to history; **Undo** reverses the last operation.
  - **Reset** clears all borders and restores the original uploaded image.
- **Aspect Ratio Presets** (for Outer Border):
  - Landscape & portrait options: 1:1, 4:3/3:4, 3:2/2:3, 5:4/4:5, 16:9/9:16, and keep original.
- **Download**: Choose PNG (lossless) or JPEG (100% quality) format and download at full resolution. Uses Web Share API on compatible devices for direct sharing/saving.
- Fully **responsive** UI that scales images to fit any viewport (desktop or mobile).

---

## 🌐 Live Demo

A live version is hosted at: [https://chocolateflight.github.io/border-to-image/](https://chocolateflight.github.io/border-to-image/)

---

## 🖱️ How to Use

1.  **Select Mode (Optional)**: Use the **toggle switch** at the top to choose **Simple Mode** (default) or **Advanced Mode** at any time.
2.  **Upload**: Click **Choose File** and select your image.
3.  **Inner Border**:
    - Pick a border color.
    - Select **px** or **%** for the width unit.
    - In **Simple Mode**, use the slider or number input for a uniform width.
    - In **Advanced Mode**, enter values for Top, Right, Bottom, and Left.
    - Click **Apply Inner Border** to add it.
4.  **Outer Border**:
    - Pick a background/border color.
    - Select **px** or **%** for the width unit.
    - In **Simple Mode**, use the slider or number input for a uniform width.
    - In **Advanced Mode**, enter values for Top, Right, Bottom, and Left.
    - Select a target **Aspect Ratio** or "Keep Current".
    - Click **Apply Outer Border** to add it.
5.  **Undo/Reset**:
    - **Undo** removes the last border action applied.
    - **Reset** clears all borders, restoring the original uploaded image.
6.  **Download**: Choose **PNG** or **JPEG** format, then click **Download**.

---

## ⚙️ Structure

```
.
├── index.html       # Single-page app HTML structure
├── style.css        # CSS styles for layout and appearance
├── script.js        # JavaScript for functionality and interactivity
└── README.md        # This documentation file
