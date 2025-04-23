(() => {
  const fileInput   = document.getElementById('fileInput');
  const resetBtn    = document.getElementById('resetBtn');
  const undoBtn     = document.getElementById('undoBtn');
  const applyOverlay= document.getElementById('applyOverlay');
  const applyCanvas = document.getElementById('applyCanvas');
  const downloadBtn = document.getElementById('downloadBtn');
  const ovColor     = document.getElementById('ovColor');
  const ovWidth     = document.getElementById('ovWidth');
  const ovVal       = document.getElementById('ovVal');
  const ovNum       = document.getElementById('ovNum');
  const cnColor     = document.getElementById('cnColor');
  const cnWidth     = document.getElementById('cnWidth');
  const cnVal       = document.getElementById('cnVal');
  const cnNum       = document.getElementById('cnNum');
  const ratioSelect = document.getElementById('ratioSelect');
  const dlFormat    = document.getElementById('dlFormat');
  const canvas      = document.getElementById('photoCanvas');
  const ctx         = canvas.getContext('2d');

  let originalImg  = null;
  let originalName = '';
  let ops          = [];
  let raf          = null;

  function enableControls(on) {
    [resetBtn, undoBtn, applyOverlay, applyCanvas, downloadBtn,
     ovColor, ovWidth, ovNum, cnColor, cnWidth, cnNum, ratioSelect, dlFormat
    ].forEach(el => el.disabled = !on);
  }

  function render(useOps, previewOp=null) {
    if (!originalImg) return;
    let temp = document.createElement('canvas');
    let tctx = temp.getContext('2d');
    temp.width  = originalImg.width;
    temp.height = originalImg.height;
    tctx.drawImage(originalImg, 0, 0);

    const all = previewOp ? useOps.concat([previewOp]) : useOps.slice();
    all.forEach(o => {
      const b = o.width, c = o.color;
      const iw = temp.width, ih = temp.height;
      let outerW, outerH;

      if (o.ratio && o.ratio!=='orig') {
        const [rw, rh] = o.ratio.split(':').map(Number);
        const minW = iw + 2*b, minH = ih + 2*b;
        const k = Math.ceil(Math.max(minW/rw, minH/rh));
        outerW = rw*k; outerH = rh*k;
      } else {
        outerW = iw + 2*b;
        outerH = ih + 2*b;
      }

      const offsetX = Math.round((outerW - iw)/2);
      const offsetY = Math.round((outerH - ih)/2);

      const ncan = document.createElement('canvas');
      ncan.width  = outerW;
      ncan.height = outerH;
      const nctx = ncan.getContext('2d');
      nctx.fillStyle = c;
      nctx.fillRect(0,0,outerW,outerH);
      nctx.drawImage(temp, offsetX, offsetY);
      temp = ncan;
    });

    canvas.width  = temp.width;
    canvas.height = temp.height;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(temp,0,0);
  }

  function scheduleRender(previewOp) {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      render(ops, previewOp);
      raf = null;
    });
  }

  fileInput.addEventListener('change', e => {
    const f = e.target.files[0];
    if (!f) return;
    originalName = f.name;
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      originalImg = img;
      ops = [];
      render(ops);
      enableControls(true);
      undoBtn.disabled = true;
    };
    img.src = url;
  });

  resetBtn.addEventListener('click', () => {
    ops = [];
    render(ops);
    undoBtn.disabled = true;
  });

  undoBtn.addEventListener('click', () => {
    if (!ops.length) return;
    ops.pop();
    render(ops);
    undoBtn.disabled = ops.length===0;
  });

  applyOverlay.addEventListener('click', () => {
    const w = parseInt(ovNum.value,10);
    ops.push({ color: ovColor.value, width: w, ratio: 'orig' });
    render(ops);
    undoBtn.disabled = false;
  });

  applyCanvas.addEventListener('click', () => {
    const w = parseInt(cnNum.value,10);
    ops.push({ color: cnColor.value, width: w, ratio: ratioSelect.value });
    render(ops);
    undoBtn.disabled = false;
  });

  downloadBtn.addEventListener('click', () => {
    if (!originalImg) return;
    const mime = dlFormat.value;
    const ext  = mime === 'image/png' ? 'png' : 'jpg';
    const parts = originalName.split('.');
    parts.pop();
    const base = parts.join('.');
    const filename = `${base}_border.${ext}`;

    if (navigator.canShare && navigator.canShare({ files: [] })) {
      canvas.toBlob(blob => {
        const file = new File([blob], filename, { type: mime });
        navigator.share({ files: [file] });
      }, mime);
    } else {
      const dataURL = canvas.toDataURL(mime, 1.0);
      const a = document.createElement('a');
      a.href = dataURL;
      a.download = filename;
      a.click();
    }
  });

  function updateOverlay(w) {
    ovVal.textContent = w;
    ovNum.value = w;
    scheduleRender({ color: ovColor.value, width: w, ratio: 'orig' });
  }
  ovWidth .addEventListener('input', () => updateOverlay(parseInt(ovWidth .value,10)));
  ovColor .addEventListener('input', () => updateOverlay(parseInt(ovNum   .value,10)));
  ovNum   .addEventListener('change', () => {
    let v = parseInt(ovNum.value,10);
    if (isNaN(v)||v<0) v=0;
    ovNum.value = v;
    if (v <= parseInt(ovWidth.max,10)) ovWidth.value = v;
    updateOverlay(v);
  });

  function updateCanvas(w) {
    cnVal.textContent = w;
    cnNum.value = w;
    scheduleRender({ color: cnColor.value, width: w, ratio: ratioSelect.value });
  }
  cnWidth    .addEventListener('input', () => updateCanvas(parseInt(cnWidth   .value,10)));
  cnColor    .addEventListener('input', () => updateCanvas(parseInt(cnNum     .value,10)));
  ratioSelect.addEventListener('change', ()   => updateCanvas(parseInt(cnNum     .value,10)));
  cnNum      .addEventListener('change', ()   => {
    let v = parseInt(cnNum.value,10);
    if (isNaN(v)||v<0) v=0;
    cnNum.value = v;
    if (v <= parseInt(cnWidth.max,10)) cnWidth.value = v;
    updateCanvas(v);
  });

  // finally enable controls once script loads
  enableControls(false);
})();
