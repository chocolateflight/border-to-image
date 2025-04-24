(() => {
  // --- DOM Elements ---
  const fileInput       = document.getElementById('fileInput');
  const resetBtn        = document.getElementById('resetBtn');
  const undoBtn         = document.getElementById('undoBtn');
  const downloadBtn     = document.getElementById('downloadBtn');
  const dlFormat        = document.getElementById('dlFormat');
  const canvas          = document.getElementById('photoCanvas');
  const ctx             = canvas.getContext('2d');
  const advancedModeToggle = document.getElementById('advancedModeToggle');
  const controlsDiv     = document.getElementById('controls'); // Container for toggling class

  // Inner Border Elements
  const applyInner      = document.getElementById('applyInner');
  const innerColor      = document.getElementById('innerColor');
  const innerWidth      = document.getElementById('innerWidth'); // Slider (Simple)
  const innerVal        = document.getElementById('innerVal');   // Value Display (Simple)
  const innerNum        = document.getElementById('innerNum');   // Number Input (Simple)
  const innerUnitHidden = document.getElementById('innerUnit'); // Hidden input storing unit
  const innerNumT       = document.getElementById('innerNumT');  // Number Input Top (Advanced)
  const innerNumR       = document.getElementById('innerNumR');  // Number Input Right (Advanced)
  const innerNumB       = document.getElementById('innerNumB');  // Number Input Bottom (Advanced)
  const innerNumL       = document.getElementById('innerNumL');  // Number Input Left (Advanced)

  // Outer Border Elements
  const applyOuter      = document.getElementById('applyOuter');
  const outerColor      = document.getElementById('outerColor');
  const outerWidth      = document.getElementById('outerWidth'); // Slider (Simple)
  const outerVal        = document.getElementById('outerVal');   // Value Display (Simple)
  const outerNum        = document.getElementById('outerNum');   // Number Input (Simple)
  const outerUnitHidden = document.getElementById('outerUnit'); // Hidden input storing unit
  const outerNumT       = document.getElementById('outerNumT');  // Number Input Top (Advanced)
  const outerNumR       = document.getElementById('outerNumR');  // Number Input Right (Advanced)
  const outerNumB       = document.getElementById('outerNumB');  // Number Input Bottom (Advanced)
  const outerNumL       = document.getElementById('outerNumL');  // Number Input Left (Advanced)
  const ratioSelect     = document.getElementById('ratioSelect');

  // --- State Variables ---
  let originalImg  = null;
  let originalName = '';
  let ops          = []; // Stores operation history
  let raf          = null; // For requestAnimationFrame
  let isAdvancedMode = false;

  // --- Utility Functions ---

  function enableControls(on) {
    const elements = [
      resetBtn, undoBtn, applyInner, applyOuter, downloadBtn,
      innerColor, innerWidth, innerNum, innerNumT, innerNumR, innerNumB, innerNumL,
      outerColor, outerWidth, outerNum, outerNumT, outerNumR, outerNumB, outerNumL,
      ratioSelect, dlFormat,
      ...document.querySelectorAll('.unit-btn'),
    ];
    elements.forEach(el => { if(el) el.disabled = !on });
    if (fileInput) fileInput.disabled = false; // Keep file input enabled
    if (advancedModeToggle) advancedModeToggle.disabled = !on;
  }

  // Calculates border widths in pixels based on operation details and current image size
  function calculatePixelWidths(op, currentWidth, currentHeight) {
    const parse = (v) => parseInt(v, 10) || 0; // Helper to parse safely

    let pxT = 0, pxR = 0, pxB = 0, pxL = 0;
    const unit = op.unit || 'px'; // Default to px if undefined

    if (unit === '%') {
      pxT = Math.round((parse(op.widthT) / 100) * currentHeight);
      pxB = Math.round((parse(op.widthB) / 100) * currentHeight);
      pxL = Math.round((parse(op.widthL) / 100) * currentWidth);
      pxR = Math.round((parse(op.widthR) / 100) * currentWidth);
    } else { // unit === 'px'
      pxT = parse(op.widthT);
      pxB = parse(op.widthB);
      pxL = parse(op.widthL);
      pxR = parse(op.widthR);
    }

    return {
        top: Math.max(0, pxT),
        right: Math.max(0, pxR),
        bottom: Math.max(0, pxB),
        left: Math.max(0, pxL)
    };
  }

  // --- Core Rendering Logic ---
  function render(useOps, previewOp = null) {
    if (!originalImg) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    let tempCanvas = document.createElement('canvas');
    let tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = originalImg.width;
    tempCanvas.height = originalImg.height;
    tempCtx.drawImage(originalImg, 0, 0);

    const allOps = previewOp ? useOps.concat([previewOp]) : useOps.slice();

    allOps.forEach(op => {
      const currentImgWidth = tempCanvas.width;
      const currentImgHeight = tempCanvas.height;

      const pxBorders = calculatePixelWidths(op, currentImgWidth, currentImgHeight);
      const color = op.color;
      const ratio = op.ratio;

      const borderedWidth = currentImgWidth + pxBorders.left + pxBorders.right;
      const borderedHeight = currentImgHeight + pxBorders.top + pxBorders.bottom;

      let finalCanvasWidth = borderedWidth;
      let finalCanvasHeight = borderedHeight;

      if (op.type === 'outer' && ratio && ratio !== 'orig') {
        const [rw, rh] = ratio.split(':').map(Number);
        if (rw > 0 && rh > 0) {
            const k = Math.ceil(Math.max(borderedWidth / rw, borderedHeight / rh));
            finalCanvasWidth = rw * k;
            finalCanvasHeight = rh * k;
        } else {
             console.warn("Invalid ratio provided:", ratio);
        }
      }

      const newCanvas = document.createElement('canvas');
      newCanvas.width = finalCanvasWidth;
      newCanvas.height = finalCanvasHeight;
      const newCtx = newCanvas.getContext('2d');

      newCtx.fillStyle = color;
      newCtx.fillRect(0, 0, finalCanvasWidth, finalCanvasHeight);

      const paddingX = finalCanvasWidth - borderedWidth;
      const paddingY = finalCanvasHeight - borderedHeight;
      const drawX = pxBorders.left + Math.round(paddingX / 2);
      const drawY = pxBorders.top + Math.round(paddingY / 2);

      newCtx.drawImage(tempCanvas, drawX, drawY);
      tempCanvas = newCanvas;
    });

    canvas.width = tempCanvas.width;
    canvas.height = tempCanvas.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0);
  }

  // Debounced render for previews
  function scheduleRender(previewOp) {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      render(ops, previewOp);
      raf = null;
    });
  }

  // --- Event Listeners ---

  // Image Upload
  fileInput.addEventListener('change', e => {
    const f = e.target.files[0];
    if (!f) return;
    originalName = f.name;
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      originalImg = img;
      ops = [];
      render(ops);
      enableControls(true);
      undoBtn.disabled = true;

      document.querySelectorAll('.unit-btn[data-unit="px"]').forEach(btn => {
          if (!btn.classList.contains('active')) {
              const borderType = btn.dataset.borderType;
              const hiddenInput = document.getElementById(`${borderType}Unit`);
              hiddenInput.value = 'px';
              const group = btn.closest('.width-unit-toggle');
              if (group) { group.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active')); }
              btn.classList.add('active');
              const fieldset = btn.closest('fieldset');
              if (fieldset) { fieldset.querySelectorAll('.unit-label').forEach(label => label.textContent = 'px'); }
              const slider = document.getElementById(`${borderType}Width`);
               if(slider) slider.max = "200"; slider.step = "1";
          }
      });
       innerWidth.value = innerNum.value = "10"; innerVal.textContent = "10";
       outerWidth.value = outerNum.value = "20"; outerVal.textContent = "20";
       innerNumT.value = innerNumB.value = innerNumL.value = innerNumR.value = innerNum.value;
       outerNumT.value = outerNumB.value = outerNumL.value = outerNumR.value = outerNum.value;
    };
    img.onerror = () => {
        URL.revokeObjectURL(url);
        alert("Failed to load image.");
        fileInput.value = '';
        enableControls(false);
        if (advancedModeToggle) advancedModeToggle.disabled = false;
    };
    img.src = url;
  });

  // Reset Button
  resetBtn.addEventListener('click', () => {
    if (!originalImg) return;
    ops = [];
    render(ops);
    undoBtn.disabled = true;
  });

  // Undo Button
  undoBtn.addEventListener('click', () => {
    if (!ops.length) return;
    ops.pop();
    render(ops);
    undoBtn.disabled = ops.length === 0;
  });

  // Advanced Mode Toggle
  advancedModeToggle.addEventListener('change', () => {
      isAdvancedMode = advancedModeToggle.checked;
      controlsDiv.classList.toggle('advanced-mode-active', isAdvancedMode);
      if (isAdvancedMode && originalImg && !innerNum.disabled) {
          innerNumT.value = innerNumB.value = innerNumL.value = innerNumR.value = innerNum.value;
          outerNumT.value = outerNumB.value = outerNumL.value = outerNumR.value = outerNum.value;
      }
  });

  // Unit Toggles (Event Delegation)
  controlsDiv.addEventListener('click', (e) => {
      if (!e.target.classList.contains('unit-btn')) return;
      const button = e.target;
      if (button.disabled || button.classList.contains('active')) return;

      const borderType = button.dataset.borderType;
      const unit = button.dataset.unit;
      const hiddenInput = document.getElementById(`${borderType}Unit`);
      hiddenInput.value = unit;
      const group = button.closest('.width-unit-toggle');
      if (!group) return;
      group.querySelectorAll('.unit-btn').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      const fieldset = button.closest('fieldset');
      if (!fieldset) return;
      fieldset.querySelectorAll('.unit-label').forEach(label => label.textContent = unit);

      const slider = document.getElementById(`${borderType}Width`);
      const numInput = document.getElementById(`${borderType}Num`);
      const valDisplay = document.getElementById(`${borderType}Val`);

      if (slider && numInput && valDisplay) {
          let currentNumVal = parseInt(numInput.value, 10);
          if(isNaN(currentNumVal)) currentNumVal = 0;
          if (unit === '%') {
              slider.max = "50"; slider.step = "1";
              if (currentNumVal > 50) { numInput.value = "50"; currentNumVal = 50; }
              slider.value = currentNumVal;
          } else {
              slider.max = "200"; slider.step = "1";
              slider.value = currentNumVal;
          }
          valDisplay.textContent = slider.value;
      }
      if (originalImg && !button.disabled) {
          if (borderType === 'inner') updateInnerPreview();
          else if (borderType === 'outer') updateOuterPreview();
      }
  });


  // --- Border Apply Logic ---
  function applyBorder(type) {
    if (!originalImg || document.getElementById(`${type}Color`).disabled) {
        alert("Please upload an image first."); return;
    }
    const color = document.getElementById(`${type}Color`).value;
    const unit = document.getElementById(`${type}Unit`).value;
    const ratio = (type === 'outer') ? ratioSelect.value : undefined;
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
    if (parse(op.widthT) < 0 || parse(op.widthR) < 0 || parse(op.widthB) < 0 || parse(op.widthL) < 0) {
        alert("Border widths cannot be negative."); return;
    }
    ops.push(op);
    render(ops);
    undoBtn.disabled = false;
  }
  applyInner.addEventListener('click', () => applyBorder('inner'));
  applyOuter.addEventListener('click', () => applyBorder('outer'));


  // --- Live Preview Logic ---
  function getPreviewOp(type) {
      const colorInput = document.getElementById(`${type}Color`);
      const unitInput = document.getElementById(`${type}Unit`);
      if (!colorInput || !unitInput) return null;
      const color = colorInput.value;
      const unit = unitInput.value;
      const ratio = (type === 'outer') ? ratioSelect.value : undefined;
      let op = { type, color, unit, ratio };

      if (isAdvancedMode) {
          const numT = document.getElementById(`${type}NumT`);
          const numR = document.getElementById(`${type}NumR`);
          const numB = document.getElementById(`${type}NumB`);
          const numL = document.getElementById(`${type}NumL`);
          if (!numT || !numR || !numB || !numL) return null;
          op.widthT = numT.value; op.widthR = numR.value;
          op.widthB = numB.value; op.widthL = numL.value;
      } else {
          const numSimple = document.getElementById(`${type}Num`);
          if (!numSimple) return null;
          const width = numSimple.value;
          op.widthT = op.widthR = op.widthB = op.widthL = width;
      }
      return op;
  }

  // --- Input Event Handlers ---
  function updateInnerPreview() {
      if (!originalImg) return;
      const op = getPreviewOp('inner');
      if (op) scheduleRender(op);
  }
  function updateOuterPreview() {
      if (!originalImg) return;
      const op = getPreviewOp('outer');
      if (op) scheduleRender(op);
  }

  // Inner Border Controls
  innerColor.addEventListener('input', updateInnerPreview);
  innerWidth.addEventListener('input', () => {
      innerVal.textContent = innerWidth.value; innerNum.value = innerWidth.value; updateInnerPreview();
  });
   innerNum.addEventListener('input', () => {
      let v = parseInt(innerNum.value, 10); const sliderMax = parseInt(innerWidth.max, 10);
      if (!isNaN(v)) {
        if (v >= 0 && v <= sliderMax) { innerWidth.value = v; innerVal.textContent = v; }
        else if (v > sliderMax) { innerWidth.value = sliderMax; innerVal.textContent = sliderMax; }
      } updateInnerPreview();
  });
   innerNum.addEventListener('change', () => {
        let v = parseInt(innerNum.value, 10); const sliderMax = parseInt(innerWidth.max, 10);
         if (isNaN(v) || v < 0) v = 0; if (v > sliderMax) v = sliderMax;
         innerNum.value = v; innerWidth.value = v; innerVal.textContent = v; updateInnerPreview();
   });
  [innerNumT, innerNumR, innerNumB, innerNumL].forEach(input => {
      input.addEventListener('input', updateInnerPreview);
      input.addEventListener('change', () => {
            let v = parseInt(input.value, 10); if (isNaN(v) || v < 0) v = 0; input.value = v;
       });
  });

  // Outer Border Controls
  outerColor.addEventListener('input', updateOuterPreview);
  ratioSelect.addEventListener('change', updateOuterPreview);
  outerWidth.addEventListener('input', () => {
      outerVal.textContent = outerWidth.value; outerNum.value = outerWidth.value; updateOuterPreview();
  });
   outerNum.addEventListener('input', () => {
      let v = parseInt(outerNum.value, 10); const sliderMax = parseInt(outerWidth.max, 10);
      if (!isNaN(v)) {
        if (v >= 0 && v <= sliderMax) { outerWidth.value = v; outerVal.textContent = v; }
        else if (v > sliderMax) { outerWidth.value = sliderMax; outerVal.textContent = sliderMax; }
      } updateOuterPreview();
  });
   outerNum.addEventListener('change', () => {
        let v = parseInt(outerNum.value, 10); const sliderMax = parseInt(outerWidth.max, 10);
         if (isNaN(v) || v < 0) v = 0; if (v > sliderMax) v = sliderMax;
         outerNum.value = v; outerWidth.value = v; outerVal.textContent = v; updateOuterPreview();
   });
  [outerNumT, outerNumR, outerNumB, outerNumL].forEach(input => {
     input.addEventListener('input', updateOuterPreview);
     input.addEventListener('change', () => {
            let v = parseInt(input.value, 10); if (isNaN(v) || v < 0) v = 0; input.value = v;
       });
  });


  // --- Download Logic ---
  downloadBtn.addEventListener('click', () => {
    if (!originalImg || canvas.width === 0 || canvas.height === 0) {
        alert("No image loaded or image is empty."); return;
    }
    const mime = dlFormat.value;
    const ext = mime === 'image/png' ? 'png' : 'jpg';
    const nameWithoutExt = originalName.includes('.') ? originalName.substring(0, originalName.lastIndexOf('.')) : originalName;
    const filename = `${nameWithoutExt}_border.${ext}`;

    // Use canvas.toBlob for creating the file
    canvas.toBlob(blob => {
        if (!blob) {
            alert("Failed to create image blob for download.");
            return;
        }
        // --- CORRECTED: Always use the fallback for direct download attempt ---
        downloadFallback(blob, filename);
        // --- Web Share API logic removed ---

    }, mime, 1.0); // Use quality 1.0 for JPEG if format is image/jpeg
  });

  // Fallback function to trigger standard download via link click
  function downloadFallback(blob, filename) {
      const dataURL = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none'; // Hide the link
      a.href = dataURL;
      a.download = filename;
      document.body.appendChild(a); // Required for Firefox compatibility
      a.click();
      // Cleanup: Use setTimeout to allow download initiation before revoking
      setTimeout(() => {
         document.body.removeChild(a);
         URL.revokeObjectURL(dataURL);
      }, 100);
  }


  // --- Initial Setup ---
  enableControls(false); // Disable controls needing an image
  if(advancedModeToggle) advancedModeToggle.disabled = false; // Ensure toggle is enabled
  if(advancedModeToggle) advancedModeToggle.checked = false; // Start in Simple mode
  if(controlsDiv) controlsDiv.classList.remove('advanced-mode-active'); // Ensure correct class state

})();