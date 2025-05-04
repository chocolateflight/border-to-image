(() => {
  // --- DOM Element References ---
  const fileInput = document.getElementById("fileInput");
  const resetBtn = document.getElementById("resetBtn");
  const undoBtn = document.getElementById("undoBtn");
  const removeBtn = document.getElementById("removeBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const dlFormat = document.getElementById("dlFormat");
  const canvas = document.getElementById("photoCanvas");
  const ctx = canvas.getContext("2d");
  const advancedModeToggle = document.getElementById("advancedModeToggle");
  const controlsContainer = document.getElementById("controls");
  const canvasWrapper = document.getElementById("canvasWrapper");
  // Inner Border Elements
  const applyInner = document.getElementById("applyInner");
  const innerColor = document.getElementById("innerColor");
  const innerWidth = document.getElementById("innerWidth");
  const innerVal = document.getElementById("innerVal");
  const innerNum = document.getElementById("innerNum");
  const innerUnitHidden = document.getElementById("innerUnit");
  const innerNumT = document.getElementById("innerNumT");
  const innerNumR = document.getElementById("innerNumR");
  const innerNumB = document.getElementById("innerNumB");
  const innerNumL = document.getElementById("innerNumL");
  // Outer Border Elements
  const applyOuter = document.getElementById("applyOuter");
  const outerColor = document.getElementById("outerColor");
  const outerWidth = document.getElementById("outerWidth");
  const outerVal = document.getElementById("outerVal");
  const outerNum = document.getElementById("outerNum");
  const outerUnitHidden = document.getElementById("outerUnit");
  const outerNumT = document.getElementById("outerNumT");
  const outerNumR = document.getElementById("outerNumR");
  const outerNumB = document.getElementById("outerNumB");
  const outerNumL = document.getElementById("outerNumL");
  const ratioSelect = document.getElementById("ratioSelect");
  // EXIF Elements
  const showExifToggle = document.getElementById("showExifToggle");
  const exifOptionsContainer = document.getElementById("exifOptionsContainer");
  const exifDate = document.getElementById("exifDate");
  const exifTime = document.getElementById("exifTime");
  const showTimeToggle = document.getElementById("showTimeToggle");
  const timeFieldContainer = document.getElementById("timeFieldContainer");
  const exifCamera = document.getElementById("exifCamera");
  const exifAperture = document.getElementById("exifAperture");
  const exifShutter = document.getElementById("exifShutter");
  const exifShutterSeconds = document.getElementById("exifShutterSeconds");
  const shutterTypeToggle = document.getElementById("shutterTypeToggle");
  const fractionShutterInput = document.getElementById("fractionShutterInput");
  const secondsShutterInput = document.getElementById("secondsShutterInput");
  const exifISO = document.getElementById("exifISO");
  const exifLocation = document.getElementById("exifLocation");
  const exifCopyright = document.getElementById("exifCopyright");
  const exifPosition = document.getElementById("exifPosition");
  const exifSizeMode = document.getElementById("exifSizeMode");
  const exifSeparator = document.getElementById("exifSeparator");
  const exifDisplayStyle = document.getElementById("exifDisplayStyle");
  const exifBgColor = document.getElementById("exifBgColor");
  const exifBgOpacity = document.getElementById("exifBgOpacity");
  const exifBgOpacityVal = document.getElementById("exifBgOpacityVal");
  const exifTextColor = document.getElementById("exifTextColor");
  const manualSizeControls = document.getElementById("manualSizeControls");
  const exifFontSize = document.getElementById("exifFontSize");
  const exifFontSizeVal = document.getElementById("exifFontSizeVal");
  const exifPadding = document.getElementById("exifPadding");
  const exifPaddingVal = document.getElementById("exifPaddingVal");
  const exifTabButtons = document.querySelectorAll(".exif-tab-btn");
  const exifTabContents = document.querySelectorAll(".exif-tab-content");
  const applyExif = document.getElementById("applyExif");
  const exifAlignment = document.getElementById("exifAlignment");
  const exifInset = document.getElementById("exifInset");
  const exifInsetVal = document.getElementById("exifInsetVal");
  const exifBorderAlign = document.getElementById("exifBorderAlign");

  // --- Application State ---
  let originalImg = null;
  let originalName = "";
  let ops = []; // History of applied border operations
  let raf = null; // requestAnimationFrame ID for debouncing previews
  let isAdvancedMode = false;
  let exifData = null; // Store extracted EXIF data
  let exifOp = null; // Current EXIF overlay operation

  // --- Utility Functions ---

  // Enable/disable UI controls and manage visual states based on image presence.
  function enableControls(on) {
    const elementsToToggle = [
      resetBtn,
      undoBtn,
      removeBtn,
      applyInner,
      applyOuter,
      downloadBtn,
      innerColor,
      innerWidth,
      innerNum,
      innerNumT,
      innerNumR,
      innerNumB,
      innerNumL,
      outerColor,
      outerWidth,
      outerNum,
      outerNumT,
      outerNumR,
      outerNumB,
      outerNumL,
      ratioSelect,
      dlFormat,
      // EXIF elements
      showExifToggle,
      showTimeToggle,
      exifDate,
      exifTime,
      exifCamera,
      exifAperture,
      exifShutter,
      exifShutterSeconds,
      shutterTypeToggle,
      exifISO,
      exifLocation,
      exifCopyright,
      exifPosition,
      exifSizeMode,
      exifSeparator,
      exifDisplayStyle,
      exifBgColor,
      exifBgOpacity,
      exifBgOpacityVal,
      exifTextColor,
      exifFontSize,
      exifPadding,
      applyExif,
      ...document.querySelectorAll(".unit-btn"),
      ...document.querySelectorAll(".exif-tab-btn"),
      exifAlignment,
      exifInset,
      exifBorderAlign,
    ];
    elementsToToggle.forEach((el) => {
      if (el) el.disabled = !on;
    });

    if (fileInput) fileInput.disabled = false;
    if (advancedModeToggle) advancedModeToggle.disabled = false;

    if (controlsContainer) {
      controlsContainer.classList.toggle("controls-inactive", !on);
      controlsContainer.classList.toggle(
        "advanced-mode-active",
        on && isAdvancedMode
      );
    }
    if (canvasWrapper) {
      canvasWrapper.classList.toggle(
        "image-loaded",
        on && originalImg !== null
      );
    }
    if (undoBtn) {
      undoBtn.disabled = !(on && ops.length > 0);
    }
    if (!on) {
      if (removeBtn) removeBtn.disabled = true;
      if (resetBtn) resetBtn.disabled = true;
    } else {
      const imageLoaded = originalImg !== null;
      if (removeBtn) removeBtn.disabled = !imageLoaded;
      if (resetBtn) resetBtn.disabled = !imageLoaded;
    }
  }

  // Convert border widths (px or %) to absolute pixel values for rendering.
  function calculatePixelWidths(op, currentWidth, currentHeight) {
    const parse = (v) => parseInt(v, 10) || 0;
    let pxT = 0,
      pxR = 0,
      pxB = 0,
      pxL = 0;
    const unit = op.unit || "px";
    if (unit === "%") {
      pxT = Math.round((parse(op.widthT) / 100) * currentHeight);
      pxB = Math.round((parse(op.widthB) / 100) * currentHeight);
      pxL = Math.round((parse(op.widthL) / 100) * currentWidth);
      pxR = Math.round((parse(op.widthR) / 100) * currentWidth);
    } else {
      pxT = parse(op.widthT);
      pxB = parse(op.widthB);
      pxL = parse(op.widthL);
      pxR = parse(op.widthR);
    }
    return {
      top: Math.max(0, pxT),
      right: Math.max(0, pxR),
      bottom: Math.max(0, pxB),
      left: Math.max(0, pxL),
    };
  }

  // --- Consistent border-width calculator (uses original image as reference) ---
  function getBorderWidthsPx(op) {
    if (!op || !originalImg) return { top: 0, right: 0, bottom: 0, left: 0 };
    const parse = v => parseInt(v, 10) || 0;

    if (op.unit === '%') {                 // percentage → px
      return {
        top:    Math.round((parse(op.widthT) / 100) * originalImg.height),
        right:  Math.round((parse(op.widthR) / 100) * originalImg.width),
        bottom: Math.round((parse(op.widthB) / 100) * originalImg.height),
        left:   Math.round((parse(op.widthL) / 100) * originalImg.width),
      };
    }
    // already px
    return {
      top:    parse(op.widthT),
      right:  parse(op.widthR),
      bottom: parse(op.widthB),
      left:   parse(op.widthL),
    };
  }

  // Renders the image with applied borders onto the main canvas.
  // Uses an offscreen canvas for sequential rendering steps.
  function render(useOps, previewOp = null) {
    if (!originalImg) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (canvasWrapper) canvasWrapper.classList.remove("image-loaded");
      canvas.width = 1;
      canvas.height = 1; // Prevent large empty canvas
      return;
    }
    if (canvasWrapper) canvasWrapper.classList.add("image-loaded");

    let tempCanvas = document.createElement("canvas");
    let tempCtx = tempCanvas.getContext("2d");
    tempCanvas.width = originalImg.width;
    tempCanvas.height = originalImg.height;
    tempCtx.drawImage(originalImg, 0, 0);

    const allOps = previewOp ? useOps.concat([previewOp]) : useOps.slice();

    allOps.forEach((op) => {
      if (op.type === "exif") {
        // Handle EXIF overlay operation separately
        // Just keep the current canvas state for now, apply EXIF later
        return;
      }

      const currentImgWidth = tempCanvas.width;
      const currentImgHeight = tempCanvas.height;
      const pxBorders = calculatePixelWidths(
        op,
        currentImgWidth,
        currentImgHeight
      );
      const color = op.color;
      const ratio = op.ratio;

      const borderedWidth = currentImgWidth + pxBorders.left + pxBorders.right;
      const borderedHeight =
        currentImgHeight + pxBorders.top + pxBorders.bottom;
      let finalCanvasWidth = borderedWidth;
      let finalCanvasHeight = borderedHeight;

      // Adjust canvas size for aspect ratio (outer borders only)
      if (op.type === "outer" && ratio && ratio !== "orig") {
        const [rw, rh] = ratio.split(":").map(Number);
        if (rw > 0 && rh > 0) {
          const scaleFactor = Math.max(borderedWidth / rw, borderedHeight / rh);
          finalCanvasWidth = Math.ceil(rw * scaleFactor);
          finalCanvasHeight = Math.ceil(rh * scaleFactor);
        } else {
          console.warn("Invalid ratio:", ratio);
        }
      }

      const newCanvas = document.createElement("canvas");
      newCanvas.width = finalCanvasWidth;
      newCanvas.height = finalCanvasHeight;
      const newCtx = newCanvas.getContext("2d");
      newCtx.fillStyle = color;
      newCtx.fillRect(0, 0, finalCanvasWidth, finalCanvasHeight);
      const paddingX = finalCanvasWidth - borderedWidth;
      const paddingY = finalCanvasHeight - borderedHeight;
      const drawX = pxBorders.left + Math.round(paddingX / 2);
      const drawY = pxBorders.top + Math.round(paddingY / 2);
      newCtx.drawImage(tempCanvas, drawX, drawY);
      tempCanvas = newCanvas; // Use this result for the next step
    });

    canvas.width = tempCanvas.width;
    canvas.height = tempCanvas.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0);

    // Apply EXIF overlay if needed
    const exifOpToApply = allOps.find(op => op.type === "exif") || 
                          (showExifToggle.checked ? getExifPreviewOp() : null);
    
    if (exifOpToApply) {
      renderExifOverlay(exifOpToApply);
    }
  }

  // Debounce render calls using requestAnimationFrame for smooth previews.
  function scheduleRender(previewOp) {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      render(ops, previewOp);
      raf = null;
    });
  }

  // --- Event Listeners ---

  // Handle file selection: load image, reset state, enable controls, set defaults.
  fileInput.addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (!f) return;
    originalName = f.name;
    originalImg = null;
    ops = [];
    render();
    enableControls(false);
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      originalImg = img;
      ops = [];
      render(ops);
      enableControls(true);
      // Reset UI to defaults
      document.querySelectorAll('.unit-btn[data-unit="px"]').forEach((btn) => {
        if (!btn.classList.contains("active")) {
          const borderType = btn.dataset.borderType;
          document.getElementById(`${borderType}Unit`).value = "px";
          const group = btn.closest(".width-unit-toggle");
          if (group)
            group
              .querySelectorAll(".unit-btn")
              .forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          const fieldset = btn.closest("fieldset");
          if (fieldset)
            fieldset
              .querySelectorAll(".unit-label")
              .forEach((label) => (label.textContent = "px"));
          const slider = document.getElementById(`${borderType}Width`);
          if (slider) {
            slider.max = "200";
            slider.step = "1";
          }
        }
      });
      innerWidth.value = innerNum.value = "10";
      innerVal.textContent = "10";
      outerWidth.value = outerNum.value = "20";
      outerVal.textContent = "20";
      innerNumT.value =
        innerNumB.value =
        innerNumL.value =
        innerNumR.value =
          innerNum.value;
      outerNumT.value =
        outerNumB.value =
        outerNumL.value =
        outerNumR.value =
          outerNum.value;
      
      // Reset EXIF display settings
      resetExifUI();
      
      // Extract and populate EXIF data
      extractExifData(f).then(data => {
        exifData = data;
        updateExifFields(data);
      });
      
      // Set EXIF options visibility based on checkbox state
      if (exifOptionsContainer && showExifToggle) {
        exifOptionsContainer.classList.toggle("hidden", !showExifToggle.checked);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      alert("Failed to load image.");
      fileInput.value = "";
      originalImg = null;
      render();
      enableControls(false);
    };
    img.src = url;
  });

  // Reset image to original state (remove all borders).
  resetBtn.addEventListener("click", () => {
    if (!originalImg) return;
    ops = [];
    render(ops);
    undoBtn.disabled = true;
  });

  // Remove the last applied border operation.
  undoBtn.addEventListener("click", () => {
    if (!ops.length) return;
    ops.pop();
    render(ops);
    undoBtn.disabled = ops.length === 0;
  });

  // Remove the current image entirely and reset UI.
  if (removeBtn) {
    removeBtn.addEventListener("click", () => {
      originalImg = null;
      originalName = "";
      ops = [];
      if (fileInput) fileInput.value = "";
      render();
      enableControls(false);
    });
  }

  // Toggle advanced controls visibility and sync inputs if needed.
  advancedModeToggle.addEventListener("change", () => {
    isAdvancedMode = advancedModeToggle.checked;
    controlsContainer.classList.toggle("advanced-mode-active", isAdvancedMode);
    if (isAdvancedMode && originalImg && !innerNum.disabled) {
      innerNumT.value =
        innerNumB.value =
        innerNumL.value =
        innerNumR.value =
          innerNum.value;
      outerNumT.value =
        outerNumB.value =
        outerNumL.value =
        outerNumR.value =
          outerNum.value;
      updateInnerPreview();
      updateOuterPreview();
    } else if (!isAdvancedMode && originalImg && !innerNum.disabled) {
      updateInnerPreview();
      updateOuterPreview();
    }
  });

  // Handle unit changes (px/%) via event delegation, updating relevant UI.
  controlsContainer.addEventListener("click", (e) => {
    if (!e.target.classList.contains("unit-btn")) return;
    const button = e.target;
    if (button.disabled || button.classList.contains("active")) return;

    const borderType = button.dataset.borderType;
    const unit = button.dataset.unit;
    const hiddenInput = document.getElementById(`${borderType}Unit`);
    if (hiddenInput) hiddenInput.value = unit;

    const group = button.closest(".width-unit-toggle");
    if (!group) return;
    group
      .querySelectorAll(".unit-btn")
      .forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    const fieldset = button.closest("fieldset");
    if (!fieldset) return;
    fieldset
      .querySelectorAll(".unit-label")
      .forEach((label) => (label.textContent = unit));

    const slider = document.getElementById(`${borderType}Width`);
    const numInput = document.getElementById(`${borderType}Num`);
    const valDisplay = document.getElementById(`${borderType}Val`);
    if (slider && numInput && valDisplay) {
      let currentNumVal = parseInt(numInput.value, 10) || 0;
      if (unit === "%") {
        slider.max = "50";
        slider.step = "1";
        if (currentNumVal > 50) {
          numInput.value = "50";
          currentNumVal = 50;
        }
        slider.value = currentNumVal;
      } else {
        slider.max = "200";
        slider.step = "1";
        slider.value = currentNumVal;
      }
      valDisplay.textContent = slider.value;
    }
    if (originalImg && !button.disabled) {
      if (borderType === "inner") updateInnerPreview();
      else if (borderType === "outer") updateOuterPreview();
    }
  });

  // --- Border Apply Logic ---

  // Creates and applies a new border operation based on current settings.
  function applyBorder(type) {
    const colorInput = document.getElementById(`${type}Color`);
    if (!originalImg || !colorInput || colorInput.disabled) return;

    const color = colorInput.value;
    const unit = document.getElementById(`${type}Unit`).value;
    const ratio = type === "outer" ? ratioSelect.value : undefined;
    let op = { type, color, unit, ratio };

    if (isAdvancedMode) {
      op.widthT = document.getElementById(`${type}NumT`).value;
      op.widthR = document.getElementById(`${type}NumR`).value;
      op.widthB = document.getElementById(`${type}NumB`).value;
      op.widthL = document.getElementById(`${type}NumL`).value;
    } else {
      const width = document.getElementById(`${type}Num`).value;
      op.widthT = op.widthR = op.widthB = op.widthL = width;
    }
    const parse = (v) => parseInt(v, 10) || 0;
    if (
      parse(op.widthT) < 0 ||
      parse(op.widthR) < 0 ||
      parse(op.widthB) < 0 ||
      parse(op.widthL) < 0
    ) {
      alert("Border widths cannot be negative.");
      return;
    }
    ops.push(op);
    render(ops);
    undoBtn.disabled = ops.length === 0;
    
    // Update inset if border alignment is checked
    if (exifBorderAlign && exifBorderAlign.checked) {
      updateInsetFromBorders();
    }
  }
  applyInner.addEventListener("click", () => applyBorder("inner"));
  applyOuter.addEventListener("click", () => applyBorder("outer"));

  // --- Live Preview Logic ---

  // Get current border settings as a temporary operation object for preview.
  function getPreviewOp(type) {
    const colorInput = document.getElementById(`${type}Color`);
    const unitInput = document.getElementById(`${type}Unit`);
    if (!colorInput || !unitInput) return null;
    const color = colorInput.value;
    const unit = unitInput.value;
    const ratio = type === "outer" ? ratioSelect.value : undefined;
    let op = { type, color, unit, ratio };
    if (isAdvancedMode) {
      const numT = document.getElementById(`${type}NumT`),
        numR = document.getElementById(`${type}NumR`),
        numB = document.getElementById(`${type}NumB`),
        numL = document.getElementById(`${type}NumL`);
      if (!numT || !numR || !numB || !numL) return null;
      op.widthT = numT.value;
      op.widthR = numR.value;
      op.widthB = numB.value;
      op.widthL = numL.value;
    } else {
      const numSimple = document.getElementById(`${type}Num`);
      if (!numSimple) return null;
      const width = numSimple.value;
      op.widthT = op.widthR = op.widthB = op.widthL = width;
    }
    return op;
  }

  // Trigger a debounced preview render for the inner border settings.
  function updateInnerPreview() {
    if (!originalImg) return;
    const op = getPreviewOp("inner");
    if (op) {
      scheduleRender(op);
      
      // Update inset if border alignment is checked
      if (exifBorderAlign && exifBorderAlign.checked) {
        updateInsetFromBorders();
      }
    }
  }
  
  // Trigger a debounced preview render for the outer border settings.
  function updateOuterPreview() {
    if (!originalImg) return;
    const op = getPreviewOp("outer");
    if (op) {
      scheduleRender(op);
      
      // Update inset if border alignment is checked
      if (exifBorderAlign && exifBorderAlign.checked) {
        updateInsetFromBorders();
      }
    }
  }

  // Inner Border: Sync simple slider/input and update preview.
  innerColor.addEventListener("input", updateInnerPreview);
  innerWidth.addEventListener("input", () => {
    innerVal.textContent = innerWidth.value;
    innerNum.value = innerWidth.value;
    updateInnerPreview();
  });
  innerNum.addEventListener("input", () => {
    let v = parseInt(innerNum.value, 10),
      max = parseInt(innerWidth.max, 10);
    if (!isNaN(v)) {
      if (v >= 0 && v <= max) {
        innerWidth.value = v;
        innerVal.textContent = v;
      } else if (v > max) {
        innerWidth.value = max;
        innerVal.textContent = max;
      }
    }
    updateInnerPreview();
  });
  innerNum.addEventListener("change", () => {
    let v = parseInt(innerNum.value, 10),
      max = parseInt(innerWidth.max, 10);
    if (isNaN(v) || v < 0) v = 0;
    if (v > max) v = max;
    innerNum.value = v;
    innerWidth.value = v;
    innerVal.textContent = v;
    updateInnerPreview();
  });
  // Inner Border: Update preview on advanced input, validate on change.
  [innerNumT, innerNumR, innerNumB, innerNumL].forEach((input) => {
    input.addEventListener("input", updateInnerPreview);
    input.addEventListener("change", () => {
      let v = parseInt(input.value, 10);
      if (isNaN(v) || v < 0) v = 0;
      input.value = v;
    });
  });

  // Outer Border: Sync simple slider/input and update preview.
  outerColor.addEventListener("input", updateOuterPreview);
  ratioSelect.addEventListener("change", updateOuterPreview);
  outerWidth.addEventListener("input", () => {
    outerVal.textContent = outerWidth.value;
    outerNum.value = outerWidth.value;
    updateOuterPreview();
  });
  outerNum.addEventListener("input", () => {
    let v = parseInt(outerNum.value, 10),
      max = parseInt(outerWidth.max, 10);
    if (!isNaN(v)) {
      if (v >= 0 && v <= max) {
        outerWidth.value = v;
        outerVal.textContent = v;
      } else if (v > max) {
        outerWidth.value = max;
        outerVal.textContent = max;
      }
    }
    updateOuterPreview();
  });
  outerNum.addEventListener("change", () => {
    let v = parseInt(outerNum.value, 10),
      max = parseInt(outerWidth.max, 10);
    if (isNaN(v) || v < 0) v = 0;
    if (v > max) v = max;
    outerNum.value = v;
    outerWidth.value = v;
    outerVal.textContent = v;
    updateOuterPreview();
  });
  // Outer Border: Update preview on advanced input, validate on change.
  [outerNumT, outerNumR, outerNumB, outerNumL].forEach((input) => {
    input.addEventListener("input", updateOuterPreview);
    input.addEventListener("change", () => {
      let v = parseInt(input.value, 10);
      if (isNaN(v) || v < 0) v = 0;
      input.value = v;
    });
  });

  // --- Download Logic ---

  // Fallback method to trigger file download using a temporary link.
  function downloadFallback(blob, filename) {
    const dataURL = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = dataURL;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(dataURL);
    }, 100);
  }

  downloadBtn.addEventListener("click", () => {
    if (!originalImg || canvas.width === 0 || canvas.height === 0) {
      alert("No image loaded.");
      return;
    }
    const mime = dlFormat.value;
    const ext = mime === "image/png" ? "png" : "jpg";
    const nameWithoutExt = originalName.includes(".")
      ? originalName.substring(0, originalName.lastIndexOf("."))
      : originalName;
    const filename = `${nameWithoutExt}_border.${ext}`;
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          alert("Failed to create image blob.");
          return;
        }
        downloadFallback(blob, filename);
      },
      mime,
      1.0
    );
  });

  // --- EXIF Logic ---

  // Extract EXIF data from the uploaded image
  function extractExifData(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = function(e) {
        const result = e.target.result;
        
        // Default EXIF data (empty)
        const defaultData = {
          datetime: "",
          camera: "",
          aperture: "",
          shutter: "",
          iso: "",
          location: "",
          copyright: ""
        };

        try {
          // Check for EXIF data in JPEG files
          if (file.type === "image/jpeg") {
            // Simple EXIF extraction for basic data
            // This is a basic implementation, for full EXIF support 
            // consider using an EXIF library like exif-js
            
            // Look for date/time data
            const dateTimeMatch = /\d{4}([-:]\d{2}){2}\s\d{2}([-:]\d{2}){2}/.exec(result);
            if (dateTimeMatch) {
              defaultData.datetime = dateTimeMatch[0];
            }
            
            // Try to extract camera model info
            const cameraModelMatch = /([A-Za-z]+\s?[A-Za-z0-9]+\s(EOS|ILCE|D[0-9]+|Alpha|FinePix|COOLPIX|LUMIX|NIKON|CANON|SONY|FUJI|OLYMPUS|LEICA)[a-zA-Z0-9-\s]*)/.exec(result);
            if (cameraModelMatch) {
              defaultData.camera = cameraModelMatch[0].trim();
            }
            
            // Extract aperture (f-stop)
            const apertureMatch = /(f\/[\d.]+)/.exec(result);
            if (apertureMatch) {
              defaultData.aperture = apertureMatch[0];
            }
            
            // Extract shutter speed
            const shutterMatch = /(1\/\d+\ss)/.exec(result);
            if (shutterMatch) {
              defaultData.shutter = shutterMatch[0].replace('s', '');
            }
            
            // Extract ISO
            const isoMatch = /(ISO\s\d+)/.exec(result);
            if (isoMatch) {
              defaultData.iso = isoMatch[0].replace('ISO ', '');
            }
            
            // Look for GPS data
            const gpsMatch = /(\d+°\s\d+'\s\d+(\.\d+)?"\s[NSEW])/.exec(result);
            if (gpsMatch) {
              defaultData.location = gpsMatch[0];
            }
            
            // Try to extract copyright info
            const copyrightMatch = /(©|copyright|Copyright|COPY|©)([^a-zA-Z0-9]?)([\s]?)([a-zA-Z0-9\s]+)/.exec(result);
            if (copyrightMatch) {
              defaultData.copyright = copyrightMatch[0].trim();
            }
          }
          
          // For a production app, use a dedicated EXIF library
          // This simple implementation above won't catch all EXIF data
          
          resolve(defaultData);
        } catch (error) {
          console.warn("Failed to extract EXIF data:", error);
          resolve(defaultData);
        }
      };
      
      reader.readAsBinaryString(file);
    });
  }

  // Update the EXIF form fields with extracted or default data
  function updateExifFields(data) {
    // Handle date and time separately
    if (data.datetime) {
      const dateTimeParts = data.datetime.split(' ');
      if (dateTimeParts.length === 2) {
        // Format date to YYYY-MM-DD for the date input
        const datePart = dateTimeParts[0].replace(/:/g, '-');
        exifDate.value = datePart;
        
        // Format time for the time input
        exifTime.value = dateTimeParts[1];
        showTimeToggle.checked = true;
      } else {
        exifDate.value = "";
        exifTime.value = "";
        showTimeToggle.checked = false;
      }
    } else {
      exifDate.value = "";
      exifTime.value = "";
      showTimeToggle.checked = false;
    }
    
    // Update time field visibility
    toggleTimeFieldVisibility();
    
    // Set camera model
    exifCamera.value = data.camera || "";
    
    // Set aperture without the f/ prefix
    exifAperture.value = data.aperture ? data.aperture.replace('f/', '') : "";
    
    // Handle shutter speed with more flexibility
    if (data.shutter) {
      const shutterValue = data.shutter.trim();
      // Check if it's a fraction (1/X) format
      if (shutterValue.startsWith('1/')) {
        shutterTypeToggle.value = 'fraction';
        exifShutter.value = shutterValue.replace('1/', '');
        exifShutterSeconds.value = '';
      } 
      // Check if it's a seconds format with 's' or '"' suffix
      else if (shutterValue.endsWith('s') || shutterValue.endsWith('"')) {
        shutterTypeToggle.value = 'seconds';
        exifShutterSeconds.value = shutterValue.replace(/[s"]/g, '');
        exifShutter.value = '';
      } 
      // Otherwise just use the value as is in the appropriate field
      else {
        // Try to determine if it's a fraction or seconds based on value
        const numValue = parseFloat(shutterValue);
        if (numValue && numValue < 1) {
          // It's likely a fraction like 0.5s, convert to seconds
          shutterTypeToggle.value = 'seconds';
          exifShutterSeconds.value = shutterValue;
          exifShutter.value = '';
        } else {
          // Default to fraction
          shutterTypeToggle.value = 'fraction';
          exifShutter.value = shutterValue;
          exifShutterSeconds.value = '';
        }
      }
      // Update the UI based on the selected shutter type
      toggleShutterInputType();
    } else {
      // Default values
      shutterTypeToggle.value = 'fraction';
      exifShutter.value = "";
      exifShutterSeconds.value = "";
      toggleShutterInputType();
    }
    
    // Set ISO
    exifISO.value = data.iso || "";
    
    // Set location
    exifLocation.value = data.location || "";
    
    // Set copyright without the © prefix
    exifCopyright.value = data.copyright ? data.copyright.replace(/^©\s*/, '') : "";
  }

  // Generate a current EXIF preview operation based on form values
  function getExifPreviewOp() {
    // Format date and time for display
    let dateTimeDisplay = "";
    if (exifDate.value) {
      // Format date as YYYY/MM/DD for display
      dateTimeDisplay = exifDate.value.replace(/-/g, '/');
      
      // Add time if the checkbox is checked and time is provided
      if (showTimeToggle.checked && exifTime.value) {
        dateTimeDisplay += ` ${exifTime.value}`;
      }
    }
    
    // Format aperture with f/ prefix
    let aperture = exifAperture.value.trim();
    if (aperture) {
      aperture = `f/${aperture}`;
    }
    
    // Format shutter speed based on selected mode
    let shutter = "";
    if (shutterTypeToggle.value === 'fraction') {
      const fractionValue = exifShutter.value.trim();
      if (fractionValue) {
        shutter = `1/${fractionValue}`;
      }
    } else {
      const secondsValue = exifShutterSeconds.value.trim();
      if (secondsValue) {
        shutter = `${secondsValue}s`;
      }
    }
    
    // Format copyright with © prefix
    let copyright = exifCopyright.value.trim();
    if (copyright && !copyright.startsWith('©')) {
      copyright = `© ${copyright}`;
    }
    
    // Get separator
    const separator = exifSeparator ? exifSeparator.value : ' | ';
    
    return {
      type: "exif",
      date: dateTimeDisplay,
      camera: exifCamera.value,
      aperture: aperture,
      shutter: shutter,
      iso: exifISO.value,
      location: exifLocation.value,
      copyright: copyright,
      position: exifPosition.value,
      alignment: exifAlignment.value, 
      borderAlign: exifBorderAlign.checked,
      inset: parseFloat(exifInset.value),
      sizeMode: exifSizeMode.value,
      displayStyle: exifDisplayStyle.value,
      separator: separator,
      bgColor: exifBgColor.value,
      bgOpacity: parseInt(exifBgOpacity.value, 10) / 100,
      textColor: exifTextColor.value,
      fontSize: parseInt(exifFontSize.value, 10),
      padding: parseInt(exifPadding.value, 10)
    };
  }

  // Calculate a responsive font size based on the image dimensions
  function calculateResponsiveFontSize(imageWidth, imageHeight, baseFontSize) {
    const minSize = 14;
    const maxSize = 200;
    
    // If fixed size is requested, use the base font size but still enforce min/max
    if (exifSizeMode && exifSizeMode.value === 'fixed') {
      return Math.min(Math.max(baseFontSize, minSize), maxSize);
    }
    
    const scaleFactor = 0.015; // 1.5% of the image width
    
    // Calculate a font size based on the smaller dimension
    const smallerDimension = Math.min(imageWidth, imageHeight);
    let fontSize = Math.round(smallerDimension * scaleFactor);
    
    // For very large images, cap the font size
    fontSize = Math.min(fontSize, maxSize);
    
    // For very small images, ensure a minimum font size
    fontSize = Math.max(fontSize, minSize);
    
    return fontSize;
  }

  // Render the EXIF data overlay on the canvas
  function renderExifOverlay(op) {
    if (!op) return;
    
    // Create an array of field data objects
    const fieldData = [
      { label: "", value: op.date, show: op.date.trim() !== "" },
      { label: "", value: op.camera, show: op.camera.trim() !== "" },
      { 
        label: "", 
        value: formatCameraSettings(op.aperture, op.shutter, op.iso, op.separator), 
        show: op.aperture.trim() !== "" || op.shutter.trim() !== "" || op.iso.trim() !== "" 
      },
      { label: "", value: op.location, show: op.location.trim() !== "" },
      { label: "", value: op.copyright, show: op.copyright.trim() !== "" }
    ].filter(field => field.show);
    
    if (fieldData.length === 0) return;
    
    // Get the separator for text joining
    const separator = op.separator || ' | ';
    
    // Format the EXIF text
    let exifText = fieldData.map(field => field.value).join(separator);
    
    // Calculate a responsive font size based on the image dimensions
    const baseFontSize = op.fontSize || 20;
    let fontSize = calculateResponsiveFontSize(canvas.width, canvas.height, baseFontSize);
    
    // Set the font with calculated size
    ctx.font = `${fontSize}px 'Consolas', monospace`;
    
    // Measure text dimensions
    const textMetrics = ctx.measureText(exifText);
    const textWidth = textMetrics.width;
    const lineHeight = fontSize * 1.5;
    const textHeight = lineHeight;
    
    // Get padding and inset values
    const padding = op.padding || 20;
    const inset = op.inset || 0;
    
    // Save the current canvas state
    ctx.save();
    
    // Get style options
    const position = op.position || 'bottom';
    const alignment = op.alignment || 'left';
    const borderAlign = op.borderAlign || false;
    
    // Get colors for styling
    const bgColor = op.bgColor || '#000000';
    const bgOpacity = op.bgOpacity !== undefined ? op.bgOpacity : 0.85;
    const textColor = op.textColor || '#FFFFFF';
    
    // Convert hex to RGB for opacity control
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : {r: 0, g: 0, b: 0};
    };
    
    const rgb = hexToRgb(bgColor);
    
    // --- Determine real borders + ratio padding ---
    const lastInner = ops.filter(o => o.type === 'inner').pop();
    const lastOuter = ops.filter(o => o.type === 'outer').pop();

    const innerB = getBorderWidthsPx(lastInner);
    const outerB = getBorderWidthsPx(lastOuter);

    // extra padding introduced by aspect-ratio letter-boxing (outer border only)
    let padH = 0, padV = 0;
    if (lastOuter && lastOuter.ratio && lastOuter.ratio !== 'orig') {
      const [rw, rh] = lastOuter.ratio.split(':').map(Number);
      const borderedW = originalImg.width  + innerB.left + innerB.right + outerB.left + outerB.right;
      const borderedH = originalImg.height + innerB.top  + innerB.bottom + outerB.top  + outerB.bottom;
      const k = Math.max(borderedW / rw, borderedH / rh);

      padH = Math.round((rw * k - borderedW) / 2);
      padV = Math.round((rh * k - borderedH) / 2);
    }

    // final offsets from canvas edge to naked image
    const totalLeft   = innerB.left + outerB.left + padH;
    const totalRight  = innerB.right + outerB.right + padH;
    const totalTop    = innerB.top  + outerB.top  + padV;
    const totalBottom = innerB.bottom+outerB.bottom+padV;

    // content box (actual photo without any border/padding)
    const contentW = canvas.width  - totalLeft - totalRight;
    const contentH = canvas.height - totalTop  - totalBottom;
    const contentX = totalLeft;
    const contentY = totalTop;
    
    // Calculate overlay dimensions and position
    let overlayHeight = textHeight + (padding * 2);
    
    // Classic bar ALWAYS spans full canvas width regardless of alignment
    let overlayWidth = canvas.width;
    let overlayX = 0;
    
    // Set Y position based on position selection - ALWAYS outside the image
    let overlayY;
    if (position === 'top') {
      // Position above the image
      overlayY = 0;
    } else { // bottom
      // Position below the image
      overlayY = canvas.height - overlayHeight;
    }
    
    // Draw background
    ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${bgOpacity})`;
    ctx.fillRect(overlayX, overlayY, overlayWidth, overlayHeight);
    
    // Add thin highlight line for style
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    if (position === 'top') {
      ctx.fillRect(overlayX, overlayY + overlayHeight - 1, overlayWidth, 1);
    } else {
      ctx.fillRect(overlayX, overlayY, overlayWidth, 1);
    }
    
    // Set text baseline and color
    ctx.fillStyle = textColor;
    ctx.textBaseline = 'middle';
    
    // Apply the inset as percentage of image width, not the overlay width
    const effectiveImageWidth = borderAlign ? contentW : canvas.width;
    
    // Calculate the pixel offset based on alignment and inset percentage
    let insetPx = 0;
    if (effectiveImageWidth > 0) { // Avoid division by zero
      let effectiveInset = inset;
      
      // Convert from percentage to pixels (of image width, not overlay width)
      insetPx = Math.max(0, (effectiveInset / 100) * effectiveImageWidth);
    }
    
    // Apply inset based on alignment
    let textX;
    if (alignment === 'left') {
      ctx.textAlign = 'left';
      textX = overlayX + padding + insetPx;
    } else if (alignment === 'right') {
      ctx.textAlign = 'right';
      textX = overlayX + overlayWidth - padding - insetPx;
    } else { // center - no inset for center alignment
      ctx.textAlign = 'center';
      textX = overlayX + (overlayWidth / 2);
    }
    
    const textY = overlayY + (overlayHeight / 2);
    
    // Draw text with proper max width (accounting for inset)
    const maxTextWidth = overlayWidth - (padding * 2) - (2 * insetPx);
    ctx.fillText(exifText, textX, textY, Math.max(0, maxTextWidth));
    
    // Restore canvas state
    ctx.restore();
  }
  
  // Format camera settings in a nice way
  function formatCameraSettings(aperture, shutter, iso, separator) {
    const parts = [];
    if (aperture.trim()) parts.push(aperture);
    if (shutter.trim()) parts.push(shutter);
    if (iso.trim()) parts.push(`ISO ${iso}`);
    
    // If we have aperture and shutter but no ISO, format as "f/5.6 at 1/2000"
    if (parts.length === 2 && aperture.trim() && shutter.trim() && !iso.trim()) {
      return `${aperture} at ${shutter}`;
    }
    
    return parts.join(separator || ' | ');
  }

  // Update the EXIF preview when form values change
  function updateExifPreview() {
    if (!originalImg) return;
    scheduleRender(getExifPreviewOp());
  }

  // Apply EXIF overlay to the image
  function applyExifOverlay() {
    if (!originalImg || !exifDate) return;
    
    // Create the operation object
    const op = getExifPreviewOp();
    
    // Find existing EXIF operation to replace
    const exifOpIndex = ops.findIndex(o => o.type === "exif");
    if (exifOpIndex >= 0) {
      // Replace existing EXIF op
      ops[exifOpIndex] = op;
    } else {
      // Add new EXIF op
      ops.push(op);
    }
    
    // Render with updated operations
    render(ops);
    undoBtn.disabled = ops.length === 0;
  }

  // Toggle EXIF preview when checkbox is toggled
  showExifToggle.addEventListener("change", () => {
    if (exifOptionsContainer) {
      // Show/hide EXIF options based on toggle
      exifOptionsContainer.classList.toggle("hidden", !showExifToggle.checked);
    }
    
    if (originalImg) {
      render(ops);
    }
  });
  
  // Handle show time toggle
  if (showTimeToggle) {
    showTimeToggle.addEventListener("change", () => {
      toggleTimeFieldVisibility();
      updateExifPreview();
    });
  }
  
  // Handle size mode changes
  exifSizeMode.addEventListener("change", () => {
    toggleManualSizeControls();
    updateExifPreview();
  });
  
  // Update preview when font size changes
  exifFontSize.addEventListener("input", () => {
    exifFontSizeVal.textContent = `${exifFontSize.value}px`;
    updateExifPreview();
  });
  
  // Update preview when padding changes
  exifPadding.addEventListener("input", () => {
    exifPaddingVal.textContent = `${exifPadding.value}px`;
    updateExifPreview();
  });
  
  // Update preview when display style changes
  exifDisplayStyle.addEventListener("change", updateExifPreview);
  
  // Update preview when background color changes
  exifBgColor.addEventListener("input", updateExifPreview);
  
  // Update preview when background opacity changes
  exifBgOpacity.addEventListener("input", () => {
    exifBgOpacityVal.textContent = `${exifBgOpacity.value}%`;
    updateExifPreview();
  });
  
  // Update preview when text color changes
  exifTextColor.addEventListener("input", updateExifPreview);
  
  // Update preview when alignment changes
  exifAlignment.addEventListener("change", () => {
    if (exifBorderAlign.checked) updateInsetFromBorders();
    updateExifPreview();
  });
  
  // Update preview when border alignment toggle changes
  exifBorderAlign.addEventListener("change", () => {
    if (exifBorderAlign.checked && originalImg) {
      // Calculate border percentages based on current border widths
      updateInsetFromBorders();
    }
    updateExifPreview();
  });
  
  // Function to update inset value based on border widths
  function updateInsetFromBorders() {
    if (!originalImg) return;

    const lastInner = ops.filter(o => o.type === 'inner').pop();
    const lastOuter = ops.filter(o => o.type === 'outer').pop();

    const innerB = getBorderWidthsPx(lastInner);
    const outerB = getBorderWidthsPx(lastOuter);

    // ratio padding (same math as above, horizontal only for inset)
    let padH = 0;
    if (lastOuter && lastOuter.ratio && lastOuter.ratio !== 'orig') {
      const [rw, rh] = lastOuter.ratio.split(':').map(Number);
      const borderedW = originalImg.width  + innerB.left + innerB.right + outerB.left + outerB.right;
      const borderedH = originalImg.height + innerB.top  + innerB.bottom + outerB.top  + outerB.bottom;
      const k = Math.max(borderedW / rw, borderedH / rh);
      padH = Math.round((rw * k - borderedW) / 2);
    }

    const totalLeft  = innerB.left  + outerB.left  + padH;
    const totalRight = innerB.right + outerB.right + padH;

    const imgW = originalImg.width;                // width **without** borders
    const alignRight = exifAlignment.value === 'right';
    const relBorder = alignRight ? totalRight : totalLeft;

    const insetPct = Math.min(100, Math.max(0, (relBorder / imgW) * 100));

    exifInset.value = insetPct.toFixed(1);
    exifInsetVal.textContent = `${exifInset.value}%`;
  }
  
  // Update preview when inset value changes
  exifInset.addEventListener("input", () => {
    exifInsetVal.textContent = `${exifInset.value}%`;
    updateExifPreview();
  });
  
  // Update preview when any EXIF form field changes
  [
    exifDate, exifTime, exifCamera, exifAperture, exifShutter, exifShutterSeconds, exifISO, exifLocation, 
    exifCopyright, exifPosition, exifSeparator
  ].forEach(input => {
    if (input) {
      input.addEventListener("input", updateExifPreview);
    }
  });
  
  // Apply EXIF overlay when button is clicked
  applyExif.addEventListener("click", applyExifOverlay);

  // --- Initial Setup ---
  // Initially disable controls until an image is loaded.
  enableControls(false);
  
  // Initially hide EXIF options
  if (exifOptionsContainer) {
    exifOptionsContainer.classList.add("hidden");
  }
  
  // Setup EXIF tabs navigation
  if (exifTabButtons && exifTabButtons.length > 0) {
    exifTabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetTab = button.dataset.tab;
        
        // Update active states for buttons
        exifTabButtons.forEach(btn => {
          btn.classList.remove('active');
        });
        button.classList.add('active');
        
        // Show the target tab content, hide others
        exifTabContents.forEach(content => {
          if (content.id === `${targetTab}-tab`) {
            content.classList.add('active');
          } else {
            content.classList.remove('active');
          }
        });
      });
    });
  }
  
  // Initialize time field visibility
  toggleTimeFieldVisibility();
  
  // Initialize shutter input type visibility
  toggleShutterInputType();
  
  // Initialize manual size controls visibility
  toggleManualSizeControls();
  
  // Reset EXIF UI to defaults
  function resetExifUI() {
    if (exifDate) exifDate.value = new Date().toISOString().split('T')[0];
    if (exifTime) exifTime.value = "12:00";
    if (exifCamera) exifCamera.value = "";
    if (exifAperture) exifAperture.value = "";
    if (exifShutter) exifShutter.value = "";
    if (exifShutterSeconds) exifShutterSeconds.value = "";
    if (exifISO) exifISO.value = "";
    if (exifLocation) exifLocation.value = "";
    if (exifCopyright) exifCopyright.value = "";
    if (exifPosition) exifPosition.value = "bottom";
    if (exifAlignment) exifAlignment.value = "left";
    if (exifBorderAlign) exifBorderAlign.checked = false;
    if (exifInset) {
      exifInset.value = "0";
      if (exifInsetVal) exifInsetVal.textContent = "0%";
    }
    if (exifSizeMode) exifSizeMode.value = "responsive";
    if (exifDisplayStyle) exifDisplayStyle.value = "classic";
    if (exifSeparator) exifSeparator.value = " | ";
    if (exifBgColor) exifBgColor.value = "#000000";
    if (exifBgOpacity) {
      exifBgOpacity.value = "85";
      if (exifBgOpacityVal) exifBgOpacityVal.textContent = "85%";
    }
    if (exifTextColor) exifTextColor.value = "#FFFFFF";
    if (exifFontSize) {
      exifFontSize.value = "20";
      if (exifFontSizeVal) exifFontSizeVal.textContent = "20px";
    }
    if (exifPadding) {
      exifPadding.value = "20";
      if (exifPaddingVal) exifPaddingVal.textContent = "20px";
    }
    
    // Reset visibility states
    toggleManualSizeControls();
    toggleTimeFieldVisibility();
    toggleShutterInputType();
  }
})();

// Tab switching functionality for EXIF panel
function setupTabNavigation() {
  if (!exifTabButtons || !exifTabContents) return;
  
  exifTabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.dataset.tab;
      
      // Update active states for buttons
      exifTabButtons.forEach(btn => {
        btn.classList.remove('active');
      });
      button.classList.add('active');
      
      // Show the target tab content, hide others
      exifTabContents.forEach(content => {
        if (content.id === `${targetTab}-tab`) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
    });
  });
}

// Toggle time field visibility based on checkbox
function toggleTimeFieldVisibility() {
  if (timeFieldContainer && showTimeToggle) {
    timeFieldContainer.style.display = showTimeToggle.checked ? 'flex' : 'none';
  }
}

// Toggle manual size controls visibility
function toggleManualSizeControls() {
  if (manualSizeControls && exifSizeMode) {
    manualSizeControls.classList.toggle('hidden', exifSizeMode.value !== 'fixed');
  }
}

// Toggle between fraction (1/x) and seconds shutter speed
function toggleShutterInputType() {
  if (shutterTypeToggle && fractionShutterInput && secondsShutterInput) {
    const isSeconds = shutterTypeToggle.value === 'seconds';
    
    fractionShutterInput.classList.toggle('hidden', isSeconds);
    secondsShutterInput.classList.toggle('hidden', !isSeconds);
  }
}
