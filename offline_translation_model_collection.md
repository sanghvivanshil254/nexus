# Offline Translation Model Collection

## Overview

This document organizes recommended translation models by language and region for an offline translation system.

### Core strategy

- **IndicTrans2** — primary model for the 22 scheduled Indian languages.
- **AfriNLLB** — primary specialist where its African-language coverage applies.
- **NLLB-200** — broad multilingual fallback and primary model for many languages without a strong specialist.
- **OPUS-MT** — language-pair specialist option where benchmarking shows an advantage.

> **Important:** A specialist model is not automatically better for every language pair. Translation quality depends on language pair, direction, domain, dialect, and training data. Benchmark the exact pair before replacing NLLB.

---

# 1. India / South Asia

| Language | Best primary model | Fallback |
|---|---|---|
| Assamese | **IndicTrans2 1B** | NLLB-200 |
| Bengali | **IndicTrans2 1B** | NLLB-200 |
| Bodo | **IndicTrans2 1B** | NLLB-200 |
| Dogri | **IndicTrans2 1B** | NLLB-200 |
| Gujarati | **IndicTrans2 1B** | NLLB-200 |
| Hindi | **IndicTrans2 1B** | NLLB-200 |
| Kannada | **IndicTrans2 1B** | NLLB-200 |
| Kashmiri | **IndicTrans2 1B** | NLLB-200 |
| Konkani | **IndicTrans2 1B** | NLLB-200 |
| Maithili | **IndicTrans2 1B** | NLLB-200 |
| Malayalam | **IndicTrans2 1B** | NLLB-200 |
| Manipuri | **IndicTrans2 1B** | NLLB-200 |
| Marathi | **IndicTrans2 1B** | NLLB-200 |
| Nepali | **IndicTrans2 1B** | NLLB-200 |
| Odia | **IndicTrans2 1B** | NLLB-200 |
| Punjabi | **IndicTrans2 1B** | NLLB-200 |
| Sanskrit | **IndicTrans2 1B** | NLLB-200 |
| Santali | **IndicTrans2 1B** | NLLB-200 |
| Sindhi | **IndicTrans2 1B** | NLLB-200 |
| Tamil | **IndicTrans2 1B** | NLLB-200 |
| Telugu | **IndicTrans2 1B** | NLLB-200 |
| Urdu | **IndicTrans2 1B** | NLLB-200 |

### IndicTrans2 models to download

```text
ai4bharat/indictrans2-en-indic-1B
ai4bharat/indictrans2-indic-en-1B
ai4bharat/indictrans2-indic-indic-1B
```

For smaller Indic→Indic deployments:

```text
ai4bharat/indictrans2-indic-indic-dist-320M
```

IndicTrans2 supports all 22 scheduled Indian languages.

---

# 2. Africa

Use **AfriNLLB** where its published language-pair coverage applies. Use NLLB-200 for African languages outside that coverage.

| Language | Best primary model | Fallback |
|---|---|---|
| Afrikaans | **AfriNLLB** | NLLB-200 |
| Amharic | **AfriNLLB** | NLLB-200 |
| Hausa | **AfriNLLB** | NLLB-200 |
| Somali | **AfriNLLB** | NLLB-200 |
| Swahili | **AfriNLLB** | NLLB-200 |
| Yoruba | **AfriNLLB** | NLLB-200 |
| Zulu | **AfriNLLB** | NLLB-200 |
| Lingala | **AfriNLLB** | NLLB-200 |
| Wolof | **AfriNLLB** | NLLB-200 |
| Egyptian Arabic | **AfriNLLB / NLLB-200** | — |
| Modern Standard Arabic | **AfriNLLB / NLLB-200** | — |
| French (African use) | **AfriNLLB** | NLLB-200 |
| Portuguese (African use) | **AfriNLLB** | NLLB-200 |
| Spanish (African use) | **AfriNLLB** | NLLB-200 |
| Akan | NLLB-200 | — |
| Bambara | NLLB-200 | — |
| Bemba | NLLB-200 | — |
| Chichewa | NLLB-200 | — |
| Dinka | NLLB-200 | — |
| Dyula | NLLB-200 | — |
| Ewe | NLLB-200 | — |
| Fulfulde | NLLB-200 | — |
| Kinyarwanda | NLLB-200 | — |
| Kikuyu | NLLB-200 | — |
| Malagasy | NLLB-200 | — |
| Oromo | NLLB-200 | — |
| Sesotho | NLLB-200 | — |
| Shona | NLLB-200 | — |
| Swati | NLLB-200 | — |
| Tigrinya | NLLB-200 | — |
| Tsonga | NLLB-200 | — |
| Tswana | NLLB-200 | — |
| Umbundu | NLLB-200 | — |
| Xhosa | NLLB-200 | — |

> **AfriNLLB note:** AfriNLLB is specialized for African-language translation, but its published coverage is a specific set of language pairs rather than every African language.

---

# 3. Europe

For broad European coverage, use **NLLB-200**. Add **OPUS-MT** for specific language pairs when testing demonstrates better quality.

| Language | Primary | Specialist option |
|---|---|---|
| English | **NLLB-200** | OPUS-MT |
| French | **NLLB-200** | OPUS-MT |
| German | **NLLB-200** | OPUS-MT |
| Spanish | **NLLB-200** | OPUS-MT |
| Portuguese | **NLLB-200** | OPUS-MT |
| Italian | **NLLB-200** | OPUS-MT |
| Dutch | **NLLB-200** | OPUS-MT |
| Polish | **NLLB-200** | OPUS-MT |
| Czech | **NLLB-200** | OPUS-MT |
| Slovak | **NLLB-200** | OPUS-MT |
| Slovenian | **NLLB-200** | OPUS-MT |
| Croatian | **NLLB-200** | OPUS-MT |
| Serbian | **NLLB-200** | OPUS-MT |
| Bulgarian | **NLLB-200** | OPUS-MT |
| Macedonian | **NLLB-200** | OPUS-MT |
| Romanian | **NLLB-200** | OPUS-MT |
| Hungarian | **NLLB-200** | OPUS-MT |
| Greek | **NLLB-200** | OPUS-MT |
| Albanian | **NLLB-200** | OPUS-MT |
| Ukrainian | **NLLB-200** | OPUS-MT |
| Belarusian | **NLLB-200** | OPUS-MT |
| Russian | **NLLB-200** | OPUS-MT |
| Lithuanian | **NLLB-200** | OPUS-MT |
| Latvian | **NLLB-200** | OPUS-MT |
| Estonian | **NLLB-200** | OPUS-MT |
| Finnish | **NLLB-200** | OPUS-MT |
| Swedish | **NLLB-200** | OPUS-MT |
| Danish | **NLLB-200** | OPUS-MT |
| Norwegian Bokmål | **NLLB-200** | OPUS-MT |
| Norwegian Nynorsk | **NLLB-200** | OPUS-MT |
| Icelandic | **NLLB-200** | OPUS-MT |
| Irish | **NLLB-200** | OPUS-MT |
| Welsh | **NLLB-200** | OPUS-MT |
| Scottish Gaelic | **NLLB-200** | OPUS-MT |
| Catalan | **NLLB-200** | OPUS-MT |
| Galician | **NLLB-200** | OPUS-MT |
| Basque | **NLLB-200** | OPUS-MT |
| Maltese | **NLLB-200** | OPUS-MT |
| Esperanto | **NLLB-200** | OPUS-MT |

---

# 4. Russian / Eastern Europe

| Language | Recommended models |
|---|---|
| Russian | **NLLB-200 + OPUS-MT** |
| Ukrainian | **NLLB-200 + OPUS-MT** |
| Belarusian | **NLLB-200 + OPUS-MT** |
| Polish | **NLLB-200 + OPUS-MT** |
| Czech | **NLLB-200 + OPUS-MT** |
| Slovak | **NLLB-200 + OPUS-MT** |
| Bulgarian | **NLLB-200 + OPUS-MT** |
| Serbian | **NLLB-200 + OPUS-MT** |
| Croatian | **NLLB-200 + OPUS-MT** |
| Slovenian | **NLLB-200 + OPUS-MT** |

### OPUS-MT

Model family:

```text
Helsinki-NLP/opus-mt-*
```

OPUS-MT has many language-pair-specific models. It should be treated as a specialist option rather than automatically superior to NLLB.

---

# 5. East Asia

| Language | Primary | Fallback / specialist |
|---|---|---|
| Chinese Simplified | **NLLB-200** | OPUS-MT |
| Chinese Traditional | **NLLB-200** | OPUS-MT |
| Japanese | **NLLB-200** | OPUS-MT |
| Korean | **NLLB-200** | OPUS-MT |
| Mongolian | **NLLB-200** | OPUS-MT |
| Tibetan | **NLLB-200** | — |
| Burmese | **NLLB-200** | — |
| Khmer | **NLLB-200** | — |
| Lao | **NLLB-200** | — |
| Thai | **NLLB-200** | OPUS-MT |
| Vietnamese | **NLLB-200** | OPUS-MT |
| Indonesian | **NLLB-200** | OPUS-MT |
| Malay | **NLLB-200** | OPUS-MT |
| Javanese | **NLLB-200** | — |
| Sundanese | **NLLB-200** | — |
| Tagalog | **NLLB-200** | OPUS-MT |
| Cebuano | **NLLB-200** | — |

---

# 6. Americas

For many Indigenous and low-resource languages, NLLB-200 is the practical broad-coverage choice. A language-specific model should be tested whenever a credible specialist exists.

| Language | Primary model |
|---|---|
| English | NLLB-200 |
| Spanish | NLLB-200 |
| Portuguese | NLLB-200 |
| Haitian Creole | NLLB-200 |
| Quechua | NLLB-200 |
| Aymara | NLLB-200 |
| Guarani | NLLB-200 |
| Navajo | NLLB-200 |
| Greenlandic | NLLB-200 |

---

# 7. Middle East / Central Asia

| Language | Primary | Fallback / specialist |
|---|---|---|
| Arabic MSA | **NLLB-200** | OPUS-MT |
| Egyptian Arabic | **NLLB-200 / AfriNLLB** | — |
| Moroccan Arabic | **NLLB-200** | — |
| Tunisian Arabic | **NLLB-200** | — |
| Iraqi Arabic | **NLLB-200** | — |
| Levantine Arabic | **NLLB-200** | — |
| Persian | **NLLB-200** | OPUS-MT |
| Dari | **NLLB-200** | — |
| Pashto | **NLLB-200** | OPUS-MT |
| Kurdish | **NLLB-200** | OPUS-MT |
| Turkish | **NLLB-200** | OPUS-MT |
| Azerbaijani | **NLLB-200** | OPUS-MT |
| Kazakh | **NLLB-200** | OPUS-MT |
| Kyrgyz | **NLLB-200** | — |
| Uzbek | **NLLB-200** | OPUS-MT |
| Tajik | **NLLB-200** | OPUS-MT |
| Turkmen | **NLLB-200** | — |
| Uyghur | **NLLB-200** | — |
| Hebrew | **NLLB-200** | OPUS-MT |
| Armenian | **NLLB-200** | OPUS-MT |
| Georgian | **NLLB-200** | OPUS-MT |

---

# 8. Southeast Asia / Pacific

| Language | Primary model |
|---|---|
| Indonesian | NLLB-200 |
| Malay | NLLB-200 |
| Javanese | NLLB-200 |
| Sundanese | NLLB-200 |
| Filipino / Tagalog | NLLB-200 |
| Cebuano | NLLB-200 |
| Vietnamese | NLLB-200 |
| Thai | NLLB-200 |
| Lao | NLLB-200 |
| Khmer | NLLB-200 |
| Burmese | NLLB-200 |
| Māori | NLLB-200 |
| Samoan | NLLB-200 |
| Tongan | NLLB-200 |
| Fijian | NLLB-200 |

---

# 9. Core Models to Download

## Essential

### 🇮🇳 IndicTrans2

```text
ai4bharat/indictrans2-en-indic-1B
ai4bharat/indictrans2-indic-en-1B
ai4bharat/indictrans2-indic-indic-1B
```

Optional smaller Indic→Indic model:

```text
ai4bharat/indictrans2-indic-indic-dist-320M
```

### 🌍 NLLB-200

```text
facebook/nllb-200-distilled-600M
```

Use this as the broad multilingual fallback.

### 🌍 AfriNLLB

Use the AfriNLLB release for supported African language pairs.

### 🇪🇺 / 🇷🇺 OPUS-MT

```text
Helsinki-NLP/opus-mt-*
```

Only download specific pair models after benchmarking them against NLLB.

---

# 10. Recommended Offline Translation Architecture

```text
                    OFFLINE TRANSLATOR
                           │
                    LANGUAGE DETECTOR
                           │
                     MODEL ROUTER
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
       INDIA            AFRICA           OTHER
          │                │                │
     IndicTrans2        AfriNLLB         NLLB-200
          │                │                │
          └────────────────┼────────────────┘
                           │
                    OPUS-MT CHECK
                           │
                    QUALITY ROUTER
                           │
                     FINAL OUTPUT
```

## Routing priority

```text
1. Direct language-specific specialist
2. IndicTrans2 for Indian languages
3. AfriNLLB for supported African pairs
4. OPUS-MT for tested specialist pairs
5. NLLB-200 direct translation
6. Pivot translation only when necessary
```

## Important principle

Do **not** download a separate model for every language.

The practical high-quality collection is:

```text
IndicTrans2 1B
       +
NLLB-200
       +
AfriNLLB
       +
Selected OPUS-MT pair models
```

This gives broad coverage while avoiding hundreds of redundant model downloads.

---

# 11. Model Selection Summary

| Region | Preferred model |
|---|---|
| 🇮🇳 Indian languages | **IndicTrans2 1B** |
| 🌍 Supported African pairs | **AfriNLLB** |
| 🇷🇺 Russian | **NLLB-200 + tested OPUS-MT** |
| 🇪🇺 Europe | **NLLB-200** |
| 🇨🇳 East Asia | **NLLB-200** |
| 🌎 Americas | **NLLB-200** |
| 🌏 Southeast Asia | **NLLB-200** |
| 🌍 Other low-resource languages | **NLLB-200** |
| Specific language pair with proven specialist | **Specialist model** |

> **Bottom line:** IndicTrans2 should be your Indian-language specialist, AfriNLLB your African-language specialist where applicable, and NLLB-200 your global safety net. OPUS-MT should be added selectively rather than treating every OPUS-MT checkpoint as a superior model.
