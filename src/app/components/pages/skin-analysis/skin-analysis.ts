import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../services/cart.service';
import {
  SkinAnalysisService,
  SkinAnalysisResult,
  SkinType,
  SkinConcern,
  LifestyleFactor,
  SkinGoal,
  SkinQuizAnswers,
  MatchedProduct
} from '../../../services/skin-analysis.service';
import { Product } from '../../../data';

@Component({
  selector: 'app-skin-analysis',
  standalone: true,
  imports: [DecimalPipe, RouterLink, FormsModule],
  templateUrl: './skin-analysis.html',
  styleUrl: './skin-analysis.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkinAnalysisComponent implements OnInit, OnDestroy {
  readonly analysisService = inject(SkinAnalysisService);
  readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  // Active view mode: 'scan' | 'quiz' | 'result'
  readonly mode = signal<'scan' | 'quiz' | 'result'>('scan');
  readonly isProcessing = signal<boolean>(false);
  readonly progress = signal<number>(0);
  readonly statusText = signal<string>('Memulai AI Skin Scanner...');
  readonly toastMessage = signal<string | null>(null);

  // Camera stream
  @ViewChild('videoElement') videoRef?: ElementRef<HTMLVideoElement>;
  cameraActive = signal<boolean>(false);
  private mediaStream: MediaStream | null = null;
  uploadedPhoto = signal<string | null>(null);

  // Quiz state
  currentQuizStep = signal<number>(1);
  selectedSkinType = signal<SkinType>('combination');
  selectedConcern = signal<SkinConcern>('dullness');
  selectedLifestyle = signal<LifestyleFactor>('sun_outdoor');
  selectedGoal = signal<SkinGoal>('glass_skin');

  // Scanner concerns quick select
  scannerConcern = signal<SkinConcern>('dullness');

  private progressInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    // If there is an existing result, load it into view if user wants
    const existing = this.analysisService.latestResult();
    if (existing) {
      this.mode.set('result');
    }
  }

  ngOnDestroy() {
    this.stopCamera();
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
  }

  setMode(newMode: 'scan' | 'quiz') {
    this.stopCamera();
    this.mode.set(newMode);
  }

  async startCamera() {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.showToast('Kamera tidak didukung pada browser ini. Silakan gunakan Unggah Foto.');
      return;
    }
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } }
      });
      this.cameraActive.set(true);
      setTimeout(() => {
        if (this.videoRef?.nativeElement && this.mediaStream) {
          this.videoRef.nativeElement.srcObject = this.mediaStream;
        }
      }, 100);
    } catch {
      this.cameraActive.set(false);
      this.showToast('Izin kamera ditolak. Silakan unggah foto wajah dari galeri Anda.');
    }
  }

  stopCamera() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    this.cameraActive.set(false);
  }

  onPhotoUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        this.uploadedPhoto.set(url);
        this.stopCamera();
      };
      reader.readAsDataURL(file);
    }
  }

  captureAndAnalyze() {
    let photoData = this.uploadedPhoto();

    if (this.cameraActive() && this.videoRef?.nativeElement) {
      const video = this.videoRef.nativeElement;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 480;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        photoData = canvas.toDataURL('image/jpeg', 0.85);
        this.uploadedPhoto.set(photoData);
      }
      this.stopCamera();
    }

    // Determine skin type from photo simulation or selected concern
    let inferredType: SkinType = 'combination';
    if (this.scannerConcern() === 'acne_pores') inferredType = 'oily';
    else if (this.scannerConcern() === 'dryness') inferredType = 'dry';
    else if (this.scannerConcern() === 'dullness') inferredType = 'combination';

    const answers: SkinQuizAnswers = {
      skinType: inferredType,
      primaryConcern: this.scannerConcern(),
      lifestyle: 'sun_outdoor',
      goal: 'glass_skin'
    };

    this.runAiProcessing(answers, photoData ?? undefined);
  }

  submitQuiz() {
    const answers: SkinQuizAnswers = {
      skinType: this.selectedSkinType(),
      primaryConcern: this.selectedConcern(),
      lifestyle: this.selectedLifestyle(),
      goal: this.selectedGoal()
    };

    this.runAiProcessing(answers);
  }

  private runAiProcessing(answers: SkinQuizAnswers, photoUrl?: string) {
    this.isProcessing.set(true);
    this.progress.set(0);

    const steps = [
      'Memindai zona wajah (T-Zone & U-Zone)...',
      'Menganalisis kadar hidrasi & tekstur pori...',
      'Memeriksa tingkat melanin & penumpukan sel kulit mati...',
      'Mencocokkan bahan aktif SYB BPOM dengan profil kulit...',
      'Menyusun rekomendasi skincare & ritual personal...'
    ];

    let current = 0;
    this.statusText.set(steps[0]);

    this.progressInterval = setInterval(() => {
      current += 4;
      this.progress.set(Math.min(current, 100));

      const stepIndex = Math.min(Math.floor((current / 100) * steps.length), steps.length - 1);
      this.statusText.set(steps[stepIndex]);

      if (current >= 100) {
        if (this.progressInterval) clearInterval(this.progressInterval);
        setTimeout(() => {
          this.analysisService.analyzeSkin(answers, photoUrl);
          this.isProcessing.set(false);
          this.mode.set('result');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 400);
      }
    }, 80);
  }

  addToCart(product: Product, event?: MouseEvent) {
    this.cartService.add(product, (event?.target as HTMLElement) || undefined);
    this.showToast(`${product.name} berhasil ditambahkan ke keranjang! ✨`);
  }

  addAllToCart(products: MatchedProduct[]) {
    products.forEach((item) => {
      this.cartService.add(item.product);
    });
    this.showToast(`Semua produk rekomendasi (${products.length} produk) masuk keranjang! 💖`);
  }

  restartAnalysis() {
    this.stopCamera();
    this.uploadedPhoto.set(null);
    this.currentQuizStep.set(1);
    this.mode.set('scan');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  copyPrescription() {
    const result = this.analysisService.latestResult();
    if (!result) return;

    const text = `✨ Hasil AI Skin Analysis SYB Official ✨\n` +
      `Tipe Kulit: ${result.skinTypeLabel}\n` +
      `Glowing Score: ${result.glowingScore}/100 (${result.glowingStatus})\n` +
      `Keluhan Utama: ${result.primaryConcernLabel}\n` +
      `Rekomendasi Utama: ${result.matchedProducts[0]?.product.name}\n` +
      `Bahan Aktif Kunci: ${result.keyActives.join(', ')}\n` +
      `Cek analisis lengkap di: https://rahelgnwm-alt.github.io/SYB-website1/skin-analysis`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.showToast('Resep kulit AI berhasil disalin ke clipboard! 📋');
      });
    } else {
      this.showToast('Resep kulit AI berhasil disalin!');
    }
  }

  consultWhatsApp() {
    const result = this.analysisService.latestResult();
    const heroProduct = result?.matchedProducts[0]?.product.name || 'Produk SYB';
    const text = encodeURIComponent(
      `Halo CS SYB Official! Saya baru saja melakukan AI Skin Analysis di website.\n` +
      `Hasil Skor Glowing saya: ${result?.glowingScore || 80}/100 dengan tipe kulit ${result?.skinTypeLabel || 'Kombinasi'}.\n` +
      `Rekomendasi produk saya: ${heroProduct}. Saya ingin konsultasi lebih lanjut sebelum order. Terima kasih!`
    );
    window.open(`https://wa.me/6281234567890?text=${text}`, '_blank');
  }

  private showToast(msg: string) {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 3500);
  }
}

