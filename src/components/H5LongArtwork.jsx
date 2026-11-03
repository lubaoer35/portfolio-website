import React from 'react';
import { Maximize2 } from 'lucide-react';
import { asset } from '../data';
import { fullImageSource } from '../imageSources';
import './h5-long-artwork.css';

export default function H5LongArtwork({ pages, onOpenOriginal }) {
  return <button className="gallery-image h5-long-artwork" onClick={onOpenOriginal} aria-label="放大：红牛 H5 完整长图，PDF 第30至32页">
    {pages.map(page=><img key={page.src} src={asset(fullImageSource(page.src))}
      alt={`红牛 H5 长图连续部分：${page.title}`} data-pdf-page={page.number}
      width="2182.57" height="1227.69" loading="lazy" decoding="async"/>)}
    <span className="zoom-label"><Maximize2 size={15}/> VIEW FULL SIZE</span>
  </button>;
}
