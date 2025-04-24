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

  // --- Application State ---
  let originalImg = null;
  let originalName = "";
  let ops = []; // History of applied border operations
  let raf = null; // requestAnimationFrame ID for debouncing previews
  let isAdvancedMode = false;

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
      ...document.querySelectorAll(".unit-btn"),
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
    if (op) scheduleRender(op);
  }
  // Trigger a debounced preview render for the outer border settings.
  function updateOuterPreview() {
    if (!originalImg) return;
    const op = getPreviewOp("outer");
    if (op) scheduleRender(op);
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

  // --- Initial Setup ---
  // Initially disable controls until an image is loaded.
  enableControls(false);
})();
