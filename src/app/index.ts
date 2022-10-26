import { icon2svg, svg2icon } from '..';

window.onload = () => {
  'use strict';

  const input = document.getElementById('input') as HTMLTextAreaElement;
  const output = document.getElementById('output') as HTMLTextAreaElement;
  const preview = document.getElementById('preview') as HTMLDivElement;
  const select = document.getElementById('mode-select') as HTMLSelectElement;

  select.addEventListener('change', () => {
    input.value = '';
    output.value = '';
    preview.innerHTML = '';
  });

  input.addEventListener('input', () => {
    const isIcon2Svg = select.value === 'icon2svg';
    const svgPreviewString = isIcon2Svg ? output.value : input.value;
    const outputString = isIcon2Svg ? icon2svg(input.value) : svg2icon(input.value);

    // Update output textarea.
    output.value = outputString;

    // Update preview.
    const previewImage = document.createElement('img');
    previewImage.setAttribute('src', `data:image/svg+xml;utf8,${svgPreviewString}`);
    preview.innerHTML = '';
    preview.appendChild(previewImage);
  });
};
