# Finnish Learning Web Application Requirements and Features

## Overview
A Next.js web application designed for learning Finnish, featuring real-time word translation and interactive text processing capabilities.

## Core Features

### 1. Translation System
- Bi-directional translation between Finnish and English
- Support for word-by-word translation
- Translation modes:
  - Hover translation
  - Selection translation
  - Combined mode (both hover and selection)
  - Off mode (no translation)
- Translation delay of 100ms for better user experience
- Uses MyMemory Translation API for translations

### 2. Interactive Word Components
- Each word is individually interactive
- Dynamic tooltip positioning based on viewport
- Visual feedback with color changes:
  - Default text color: gray-800
  - Highlighted text color: indigo-700
  - Highlighted background: indigo-100
- Touch device support
- Responsive tooltip placement

### 3. User Interface
- Text input area for entering content to translate
- Language direction controls (Finnish to English / English to Finnish)
- Translation mode selector
- Character count display
- State persistence (saves text and view state)
- Clean, minimalist design with Tailwind CSS

### 4. Technical Requirements

#### Frontend Framework
- Next.js (App Router)
- React with TypeScript
- Tailwind CSS for styling

#### Components Structure
- TranslatableWord: Core component for word translation
- Layout: App layout with global styles
- Main page: Text input and controls

#### State Management
- Local state management using React hooks
- Browser storage for persistence

#### API Integration
- External translation API integration
- Error handling for failed translations

#### Styling
- Responsive design
- Custom color schemes
- Smooth transitions and animations

## Development Requirements

### Environment Setup
```bash
Node.js
npm or yarn
TypeScript
```

### Key Dependencies
- next.js
- react
- react-dom
- typescript
- tailwindcss
- postcss

### File Structure
```
src/
  app/
    - layout.tsx
    - page.tsx
  components/
    - TranslatableWord.tsx
  config/
    - constants.ts
  utils/
    - translator.ts
    - textStorage.ts
```

## Design Guidelines

### Colors
- Background: System background color
- Foreground: System foreground color
- Text: Gray-800
- Highlight: Indigo-700
- Highlight Background: Indigo-100

### Typography
- System fonts
- Small text size for tooltips
- Regular text size for content

### Layout
- Responsive design
- Mobile-friendly interface
- Proper spacing and margins
- Centered content layout

## Performance Considerations
- Debounced translation requests
- Optimized tooltip positioning
- Passive event listeners for scroll and resize
- Request animation frame for smooth animations

## Accessibility
- Keyboard navigation support
- Touch device support
- Clear visual feedback
- Proper contrast ratios

## Future Enhancement Possibilities
- Offline mode
- Multiple language support
- User accounts
- Progress tracking
- Vocabulary lists
- Practice exercises
- Audio pronunciation