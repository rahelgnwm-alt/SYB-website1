import { Injectable, inject, signal } from '@angular/core';
import { Product } from '../data';
import { ProductService } from './product.service';

export type SkinType = 'oily' | 'dry' | 'combination' | 'normal' | 'sensitive';
export type SkinConcern = 'dullness' | 'acne_pores' | 'dryness' | 'dark_spots' | 'body_dark_areas' | 'chapped_lips';
export type LifestyleFactor = 'ac_room' | 'sun_outdoor' | 'night_owl' | 'pollution';
export type SkinGoal = 'glass_skin' | 'clear_pores' | 'even_tone' | 'plump_elastic';

export interface SkinMetric {
  label: string;
  value: number;
  status: string;
  description: string;
}

export interface MatchedProduct {
  product: Product;
  matchScore: number;
  badge: string;
  reason: string;
}

export interface RoutineStep {
  step: number;
  time: 'Pagi' | 'Malam';
  action: string;
  product: Product;
  note: string;
}

export interface SkinAnalysisResult {
  id: string;
  timestamp: number;
  skinType: SkinType;
  skinTypeLabel: string;
  primaryConcern: SkinConcern;
  primaryConcernLabel: string;
  glowingScore: number;
  glowingStatus: string;
  photoUrl?: string;
  metrics: {
    hydration: SkinMetric;
    sebumControl: SkinMetric;
    radiance: SkinMetric;
    texture: SkinMetric;
    barrier: SkinMetric;
  };
  aiDermatologistNote: string;
  keyActives: string[];
  matchedProducts: MatchedProduct[];
  routine: RoutineStep[];
}

export interface SkinQuizAnswers {
  skinType: SkinType;
  primaryConcern: SkinConcern;
  lifestyle: LifestyleFactor;
  goal: SkinGoal;
}

const STORAGE_KEY = 'syb_skin_analysis_v1';

@Injectable({
  providedIn: 'root'
})
export class SkinAnalysisService {
  private readonly productService = inject(ProductService);
  readonly latestResult = signal<SkinAnalysisResult | null>(this.loadSavedResult());
  readonly isAnalyzing = signal<boolean>(false);

  private loadSavedResult(): SkinAnalysisResult | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  saveResult(result: SkinAnalysisResult) {
    this.latestResult.set(result);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      } catch (err) {
        console.warn('Could not save skin analysis result to localStorage', err);
      }
    }
  }

  clearResult() {
    this.latestResult.set(null);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (err) {
        console.warn('Could not clear skin analysis result', err);
      }
    }
  }

  analyzeSkin(answers: SkinQuizAnswers, photoUrl?: string): SkinAnalysisResult {
    // 1. Calculate Score & Metrics
    let baseGlowing = 75;
    let hydrationVal = 65;
    let sebumVal = 60;
    let radianceVal = 62;
    let textureVal = 70;
    let barrierVal = 75;

    // Adjust based on skin type
    switch (answers.skinType) {
      case 'oily':
        sebumVal = 38; // excess oil
        hydrationVal = 60;
        textureVal = 62;
        break;
      case 'dry':
        sebumVal = 75;
        hydrationVal = 42; // lacking moisture
        textureVal = 60;
        break;
      case 'combination':
        sebumVal = 55;
        hydrationVal = 58;
        textureVal = 68;
        break;
      case 'sensitive':
        barrierVal = 50;
        hydrationVal = 52;
        textureVal = 58;
        break;
      case 'normal':
        hydrationVal = 82;
        sebumVal = 80;
        textureVal = 85;
        baseGlowing += 10;
        break;
    }

    // Adjust based on concern
    switch (answers.primaryConcern) {
      case 'dullness':
        radianceVal = 45;
        baseGlowing -= 8;
        break;
      case 'acne_pores':
        textureVal -= 12;
        sebumVal -= 8;
        break;
      case 'dryness':
        hydrationVal -= 15;
        barrierVal -= 8;
        break;
      case 'dark_spots':
        radianceVal -= 10;
        break;
      case 'body_dark_areas':
        radianceVal -= 5;
        break;
      case 'chapped_lips':
        hydrationVal -= 6;
        break;
    }

    // Adjust based on lifestyle
    if (answers.lifestyle === 'ac_room') hydrationVal -= 8;
    if (answers.lifestyle === 'sun_outdoor') radianceVal -= 10;
    if (answers.lifestyle === 'night_owl') {
      radianceVal -= 8;
      baseGlowing -= 5;
    }

    const calculatedScore = Math.max(50, Math.min(95, Math.round((hydrationVal + sebumVal + radianceVal + textureVal + barrierVal) / 5)));

    // Labels
    const skinTypeLabels: Record<SkinType, string> = {
      oily: 'Berminyak (Oily)',
      dry: 'Kering & Dehidrasi (Dry)',
      combination: 'Kombinasi T-Zone (Combination)',
      normal: 'Normal Seimbang (Balanced)',
      sensitive: 'Sensitif Rentan Iritasi (Sensitive)'
    };

    const concernLabels: Record<SkinConcern, string> = {
      dullness: 'Wajah Kusam & Kurang Bercahaya',
      acne_pores: 'Pori-Pori Besar, Komedo & Jerawat',
      dryness: 'Dehidrasi, Kasar & Garis Halus',
      dark_spots: 'Flek Hitam & Bekas Jerawat',
      body_dark_areas: 'Daki Membandel & Lipatan Tubuh Gelap',
      chapped_lips: 'Bibir Gelap, Kering & Pecah-Pecah'
    };

    // Matched Products calculation
    const matchedProducts = this.matchProducts(answers.skinType, answers.primaryConcern, answers.goal);

    // AI Note creation
    const aiDermatologistNote = this.generateAiDermatologistNote(
      answers.skinType,
      answers.primaryConcern,
      calculatedScore,
      matchedProducts[0]?.product.name ?? 'Produk SYB'
    );

    // Routine steps
    const routine = this.generateRoutine(matchedProducts);

    const result: SkinAnalysisResult = {
      id: 'skin-scan-' + Date.now(),
      timestamp: Date.now(),
      skinType: answers.skinType,
      skinTypeLabel: skinTypeLabels[answers.skinType],
      primaryConcern: answers.primaryConcern,
      primaryConcernLabel: concernLabels[answers.primaryConcern],
      glowingScore: calculatedScore,
      glowingStatus: calculatedScore >= 80 ? 'Kulit Prima & Bercahaya' : calculatedScore >= 65 ? 'Potensi Glowing Tinggi' : 'Memerlukan Pemulihan Barrier',
      photoUrl,
      metrics: {
        hydration: {
          label: 'Tingkat Hidrasi',
          value: Math.max(25, Math.min(98, hydrationVal)),
          status: hydrationVal > 70 ? 'Optimal' : hydrationVal > 50 ? 'Cukup' : 'Dehidrasi',
          description: hydrationVal > 70 ? 'Kadar air kulit sangat baik, kenyal dan elastis.' : 'Kulit membutuhkan hidrasi intensif seperti Hyaluronic Acid atau DNA Salmon.'
        },
        sebumControl: {
          label: 'Keseimbangan Minyak',
          value: Math.max(30, Math.min(95, sebumVal)),
          status: sebumVal > 70 ? 'Seimbang' : sebumVal > 50 ? 'Cenderung Berminyak' : 'Minyak Berlebih',
          description: sebumVal > 65 ? 'Pori-pori bernapas dengan baik tanpa minyak berlebih.' : 'Perlu pembersihan pori mendalam dan eksfoliasi lembut kaolin clay.'
        },
        radiance: {
          label: 'Indeks Kecerahan',
          value: Math.max(30, Math.min(96, radianceVal)),
          status: radianceVal > 75 ? 'Glowing Merona' : radianceVal > 55 ? 'Cerah Alami' : 'Kusam / Kurang Segar',
          description: radianceVal > 70 ? 'Pantulan cahaya alami kulit tampak sehat dan berkilau.' : 'Butuh booster Niacinamide 10% dan Vitamin C untuk memudarkan kusam.'
        },
        texture: {
          label: 'Kehalusan Tekstur',
          value: Math.max(35, Math.min(95, textureVal)),
          status: textureVal > 75 ? 'Mulus Halus' : textureVal > 55 ? 'Rata' : 'Perlu Eksfoliasi',
          description: textureVal > 70 ? 'Permukaan kulit lembut dan rata saat disentuh.' : 'Terdapat penumpukan sel kulit mati yang perlu diangkat dengan eksfoliasi teratur.'
        },
        barrier: {
          label: 'Ketahanan Skin Barrier',
          value: Math.max(40, Math.min(98, barrierVal)),
          status: barrierVal > 75 ? 'Kuat & Kebal' : barrierVal > 55 ? 'Stabil' : 'Rentan Sensitif',
          description: barrierVal > 70 ? 'Lapisan pelindung kulit kokoh mencegah bakteri & radikal bebas.' : 'Hindari produk keras, berikan nutrisi pelembap soothing seperti Centella.'
        }
      },
      aiDermatologistNote,
      keyActives: this.getKeyActives(answers.primaryConcern, answers.skinType),
      matchedProducts,
      routine
    };

    this.saveResult(result);
    return result;
  }

  private matchProducts(type: SkinType, concern: SkinConcern, goal: SkinGoal): MatchedProduct[] {
    const list: MatchedProduct[] = [];

    // Finder helpers
    const getP = (id: string): Product => {
      const found = this.productService.storefrontProducts().find((p) => p.id === id);
      return (
        found || {
          id,
          name: 'SYB Skincare',
          tagline: 'Formula Glowing BPOM',
          image: 'products/red-jelly-serum.jpg',
          price: 25000,
          compareAt: 50000,
          handle: 'syb-skincare',
          tint: '#ffe1ef'
        }
      );
    };

    if (concern === 'body_dark_areas') {
      list.push({
        product: getP('aha-body-toner'),
        matchScore: 99,
        badge: 'Kecocokan Utama 99%',
        reason: 'Glycolic Acid AHA terbukti ampuh mengangkat daki membandel dan mencerahkan area lipatan gelap tubuh.'
      });
      list.push({
        product: getP('body-serum-booster'),
        matchScore: 96,
        badge: 'Booster Pendamping 96%',
        reason: 'Glutathione & Niacinamide konsentrat mengunci kelembapan dan mempercepat peremajaan kulit tubuh.'
      });
      list.push({
        product: getP('glow-fresh-bundle'),
        matchScore: 92,
        badge: 'Paket Hemat 92%',
        reason: 'Paket bundling komplit untuk perawatan pencerah wajah dan tubuh dari ujung kepala hingga kaki.'
      });
      return list;
    }

    if (concern === 'chapped_lips') {
      list.push({
        product: getP('lippy-oil-serum'),
        matchScore: 99,
        badge: 'Kecocokan Utama 99%',
        reason: 'Jojoba Oil murni dan Vitamin C/E memberikan nutrisi mendalam untuk bibir pecah-pecah dan mengembalikan rona merah alami.'
      });
      list.push({
        product: getP('lip-cream-matte'),
        matchScore: 94,
        badge: 'Pewarna Bibir Sehat 94%',
        reason: 'Lip cream transferproof yang diformulasikan dengan Vitamin E agar bibir tetap lembut tanpa crack.'
      });
      list.push({
        product: getP('golden-egg-mask'),
        matchScore: 90,
        badge: 'Perawatan Malam 90%',
        reason: 'Masker DNA Salmon mewah untuk menjaga kelembapan seluruh wajah saat tidur.'
      });
      return list;
    }

    if (concern === 'acne_pores' || type === 'oily') {
      list.push({
        product: getP('powder-mask'),
        matchScore: 98,
        badge: 'Kecocokan Utama 98%',
        reason: 'Kaolin clay dan peppermint extract menyerap sebum berlebih, mendetoks kotoran pori, dan menyejukkan jerawat.'
      });
      list.push({
        product: getP('jelly-mask'),
        matchScore: 95,
        badge: 'Penenang Kulit 95%',
        reason: 'Ekstrak Centella Asiatica & Watermelon ampuh meredakan kemerahan, inflamasi jerawat, dan menghidrasi pori.'
      });
      list.push({
        product: getP('red-jelly-serum'),
        matchScore: 93,
        badge: 'Pengontrol Minyak 93%',
        reason: 'Niacinamide 10% mengatur produksi sebum dan memudarkan noda bekas jerawat tanpa rasa lengket.'
      });
      return list;
    }

    if (type === 'sensitive') {
      list.push({
        product: getP('jelly-mask'),
        matchScore: 99,
        badge: 'Kecocokan Utama 99%',
        reason: 'Formula gel alami yang sangat lembut, menenangkan rasa perih dan memperkuat pertahanan skin barrier.'
      });
      list.push({
        product: getP('golden-egg-mask'),
        matchScore: 94,
        badge: 'Nutrisi Sel 94%',
        reason: 'Kandungan Sodium PCA dan DNA Salmon memberikan kelembapan intens tanpa memicu iritasi kulit.'
      });
      list.push({
        product: getP('red-jelly-serum'),
        matchScore: 91,
        badge: 'Serum Pemulih 91%',
        reason: 'Allantoin di dalamnya menenangkan kulit sensitif sembari menyamarkan warna kulit belang.'
      });
      return list;
    }

    if (concern === 'dryness' || type === 'dry' || goal === 'plump_elastic') {
      list.push({
        product: getP('golden-egg-mask'),
        matchScore: 99,
        badge: 'Kecocokan Utama 99%',
        reason: 'DNA Salmon premium dan Sodium PCA mengunci hidrasi 24 jam dan mengembalikan elastisitas kenyal kulit.'
      });
      list.push({
        product: getP('red-jelly-serum'),
        matchScore: 95,
        badge: 'Serum Hidrasi 95%',
        reason: 'Hyaluronic Acid 4D dan Red Algae menembus lapisan kulit terdalam untuk hidrasi tahan lama.'
      });
      list.push({
        product: getP('glow-fresh-bundle'),
        matchScore: 92,
        badge: 'Paket Ritual Lengkap 92%',
        reason: 'Perawatan bertahap dari pembersihan, eksfoliasi lembut, hingga nutrisi pengunci kelembapan.'
      });
      return list;
    }

    // Default: Dullness / General Brightening / Glass Skin
    list.push({
      product: getP('red-jelly-serum'),
      matchScore: 98,
      badge: 'Kecocokan Utama 98%',
      reason: 'Niacinamide dosis klinis 10% dipadu Red Algae adalah senjata terampuh untuk meratakan warna kulit dan mencerahkan kusam.'
    });
    list.push({
      product: getP('peeling-serum'),
      matchScore: 95,
      badge: 'Booster Eksfoliasi 95%',
      reason: 'Vitamin C murni dan Marine Collagen merontokkan sel kulit mati penumpuk kusam agar serum bekerja 3x lebih cepat.'
    });
    list.push({
      product: getP('golden-egg-mask'),
      matchScore: 93,
      badge: 'Kunci Glowing 93%',
      reason: 'Masker jelly emas dengan DNA Salmon memberikan efek glass skin bercahaya seketika dalam 15 menit.'
    });

    return list;
  }

  private generateAiDermatologistNote(
    type: SkinType,
    concern: SkinConcern,
    score: number,
    heroProductName: string
  ): string {
    const intros = [
      `Berdasarkan kalkulasi cerdas algoritma dermatologis SYB, kulitmu memiliki skor Glowing Index sebesar ${score}/100.`,
      `Hasil pemindaian AI menunjukkan kondisi kulitmu berada di tingkat ${score}/100 dengan potensi glowing yang sangat baik!`
    ];

    let diagnosis = '';
    if (type === 'oily') {
      diagnosis = 'Aktivitas kelenjar minyak pada T-Zone terdeteksi aktif, yang seringkali menyebabkan pori-pori tampak membesar dan rentan komedo.';
    } else if (type === 'dry') {
      diagnosis = 'Lapisan epidermis kulit mengalami penurunan kadar kelembapan akibat faktor cuaca atau ruangan ber-AC, sehingga terasa kencang dan rentan garis halus.';
    } else if (type === 'sensitive') {
      diagnosis = 'Skin barrier terdeteksi sensitif dan membutuhkan formula non-iritatif dengan kandungan penenang herbal tinggi.';
    } else {
      diagnosis = 'Struktur kulitmu secara keseluruhan seimbang, namun terdapat penumpukan sel kulit mati mikro yang menahan pancaran kilau alaminya.';
    }

    const prescription = `Solusi utama yang sangat direkomendasikan adalah fokus pada ${heroProductName}. Dengan kombinasi bahan aktif yang tepat dan pemakaian teratur 2x sehari, hasil cerah kenyal nyata akan terlihat dalam 7-14 hari pemakaian.`;

    return `${intros[score % intros.length]} ${diagnosis} ${prescription}`;
  }

  private getKeyActives(concern: SkinConcern, type: SkinType): string[] {
    const actives = new Set<string>();
    actives.add('Niacinamide 10%');

    if (type === 'oily' || concern === 'acne_pores') {
      actives.add('Kaolin Clay');
      actives.add('Tea Tree Leaf Oil');
      actives.add('Peppermint Extract');
    }
    if (type === 'dry' || concern === 'dryness') {
      actives.add('DNA Salmon');
      actives.add('Sodium PCA');
      actives.add('Hyaluronic Acid 4D');
    }
    if (concern === 'dullness' || concern === 'dark_spots') {
      actives.add('Ethyl Ascorbic Acid (Vit C)');
      actives.add('Red Algae Extract');
      actives.add('Marine Collagen');
    }
    if (concern === 'body_dark_areas') {
      actives.add('Glycolic Acid (AHA)');
      actives.add('Glutathione');
      actives.add('Aloe Vera');
    }
    if (concern === 'chapped_lips') {
      actives.add('Jojoba Seed Oil');
      actives.add('Sweet Almond Oil');
      actives.add('Vitamin E Acetate');
    }

    return Array.from(actives).slice(0, 5);
  }

  private generateRoutine(matched: MatchedProduct[]): RoutineStep[] {
    const hero = matched[0]?.product;
    const secondary = matched[1]?.product;
    const tertiary = matched[2]?.product;

    return [
      {
        step: 1,
        time: 'Pagi',
        action: 'Pembersihan & Nutrisi Pagi',
        product: secondary ?? hero,
        note: 'Gunakan sehabis cuci muka untuk mempersiapkan kulit menyerap serum secara optimal.'
      },
      {
        step: 2,
        time: 'Pagi',
        action: 'Serum Perlindungan Glowing Siang',
        product: hero,
        note: 'Teteskan 2-3 tetes, tepuk lembut di wajah dan leher sebelum menggunakan pelembap dan sunscreen.'
      },
      {
        step: 3,
        time: 'Malam',
        action: 'Eksfoliasi & Detox Malam (2-3x Seminggu)',
        product: tertiary ?? secondary,
        note: 'Biarkan bahan aktif mengangkat sel kulit mati dan kotoran polusi selama Anda beristirahat.'
      },
      {
        step: 4,
        time: 'Malam',
        action: 'Perawatan Regenerasi Sel Intensif',
        product: hero,
        note: 'Kunci kelembapan di malam hari untuk mempercepat pembentukan sel kulit baru yang kenyal.'
      }
    ];
  }
}

