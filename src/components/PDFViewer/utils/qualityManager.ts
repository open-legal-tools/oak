import { PDF_CONFIG } from '../config';
import { PageState, QualityLevel } from '../types';

class QualityManager {
  private currentQuality: number = PDF_CONFIG.quality.defaultQuality;
  private qualityLevels: QualityLevel[] = [
    { scale: 0.25, quality: 0.5, renderType: 'image', compression: 0.5 },
    { scale: 0.5, quality: 0.75, renderType: 'image', compression: 0.7 },
    { scale: 1.0, quality: 1.0, renderType: 'canvas', compression: 0.8 },
    { scale: 2.0, quality: 1.25, renderType: 'canvas', compression: 0.9 },
    { scale: 3.0, quality: 1.5, renderType: 'canvas', compression: 1.0 }
  ];

  private isZooming: boolean = false;

  getQualityForPage(
    pageNumber: number,
    isVisible: boolean,
    isNearby: boolean,
    scale: number
  ): QualityLevel {
    // During zooming, use lower quality
    if (this.isZooming) {
      return {
        scale: scale,
        quality: PDF_CONFIG.quality.zoomingQuality,
        renderType: 'image',
        compression: 0.5
      };
    }

    // Find base quality level based on scale
    const baseLevel = this.qualityLevels.find(l => scale <= l.scale) || 
                     this.qualityLevels[this.qualityLevels.length - 1];

    // Adjust quality based on visibility
    if (isVisible) {
      return {
        ...baseLevel,
        scale: scale,
        renderType: 'canvas'
      };
    }

    if (isNearby) {
      return {
        scale: scale,
        quality: baseLevel.quality * 0.8,
        renderType: 'image',
        compression: 0.7
      };
    }

    // For non-visible, non-nearby pages
    return {
      scale: scale,
      quality: baseLevel.quality * 0.5,
      renderType: 'image',
      compression: 0.5
    };
  }

  startZoomOperation() {
    this.isZooming = true;
  }

  endZoomOperation() {
    this.isZooming = false;
  }

  shouldRerender(
    currentState: PageState,
    targetQuality: QualityLevel,
    forceRerender: boolean = false
  ): boolean {
    if (forceRerender) return true;
    if (!currentState.quality) return true;

    // Always rerender if switching render types
    if (currentState.renderType !== targetQuality.renderType) return true;

    // Check if quality difference is significant
    const qualityDiff = Math.abs(currentState.quality - targetQuality.quality);
    return qualityDiff >= PDF_CONFIG.quality.qualityThreshold;
  }
}

export default new QualityManager(); 