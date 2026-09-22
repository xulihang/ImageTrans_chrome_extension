# Changelog

## Version 5.91
**Released Sep 22, 2026**

- Add more language codes
- Set direction based on lang code for DOM-based text rendering

---

## Version 5.90
**Released Sep 20, 2026**

- Run OCR in sandbox to bypass CSP

---

## Version 5.80
**Released Aug 26, 2026**

- Run translation requests in the background to bypass CSP restrictions
- Fix translation overlay not being hidden if there is no text detected
- Protect result dialog with shadow DOM
- Protect DOM-based text rendering using important for CSS
- New front-end text rendering option
- New text repair mode option
- New stroke CSS button

---

## Version 5.72
**Released Aug 21, 2026**

- Fix the ineffective WebGPU option and use WASM as the backend by default
- Fix the text rendering for Safari

---

## Version 5.71
**Released Aug 20, 2026**

- Use DeepSeek's params for OpenAI by default
- Extra params options for OpenAI

---

## Version 5.70
**Released Aug 19, 2026**

- Improve the accuracy of PaddleOCR
- WebGPU option
- Use tiny as the default recognition model

---

## Version 5.60
**Released Aug 18, 2026**

- Use the small PaddleOCR detection model by default
- Load tiny PaddleOCR models from remote
- More PaddleOCR options
- More translation options

---

## Version 5.50
**Released Aug 17, 2026**

- Use DOM to render text to support more languages and options (vertical text, right to left)
- Better handling of clipped and overflowed text
- Minimum font size option

---

## Version 5.41
**Released Aug 12, 2026**

- More mobile friendly
- More actions for the floating button

---

## Version 5.40
**Released Aug 9, 2026**

- Save translation results to IndexedDB
- Auto scroll for auto translation

---

## Version 5.30
**Released Aug 2, 2026**

- Store remote model in IndexedDB
- More TTS options
- Shortcut for OCR
- Instant OCR option
- Bug fixes

---

## Version 5.21
**Released Jul 26, 2026**

- Waiting for translation overlay
- Better image data URL conversion

---

## Version 5.20
**Released Jul 16, 2026**

- Add headless to post data
- Floating translation button
- Image fetching fallback using background
- Update options set in content page if the options are changed

---

## Version 5.12
**Released Jun 26, 2026**

- Add support for webtoon

---

## Version 5.11
**Released Jun 19, 2026**

- Close camera after capture

---

## Version 5.10
**Released Jun 18, 2026**

- TTS
- Copy button
- Click to show result dialog
- Camera mode

---

## Version 5.9
**Released Jun 17, 2026**

- Pinyin and furigana annotation

---

## Version 5.8
**Released Jun 15, 2026**

- Update to PPOCRv6

---

## Version 5.7
**Released Jun 11, 2026**

- Screen capture OCR overlay mode

---

## Version 5.6
**Released Jun 10, 2026**

- (No changes listed)

---

## Version 5.5
**Released Jun 9, 2026**

- Added an option to enable "Send Network Requests in background.js"

---

## Version 5.4
**Released Jun 9, 2026**

- Use background.js to fetch ImageTrans server
- Rename mjs to js

---

## Version 5.3
**Released Jun 7, 2026**

- Fallback to MyMemory if the default translation fails
- Add support for touch screens
