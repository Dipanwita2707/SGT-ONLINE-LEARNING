# Design System - SGT Online Learning Platform

## 🎨 Color Palette

### Primary Colors
```css
/* Primary Dark - Deep Navy Blue */
--primary-dark: #011f4b

/* Primary Mid - Rich Blue */
--primary-mid: #03396c

/* Primary Blue - Main Brand Color */  
--primary-blue: #005b96

/* Light Blue - Accent Color */
--light-blue: #6497b1

/* Very Light Blue - Subtle Accent */
--very-light-blue: #b3cde0
```

### Status Colors
```css
--success: #059669
--warning: #d97706  
--error: #dc2626
--info: #005b96
```

### Neutral Colors
```css
--gray-50: #f8fafc
--gray-100: #f1f5f9
--gray-200: #e2e8f0
--gray-300: #cbd5e1
--gray-400: #94a3b8
--gray-500: #64748b
--gray-600: #475569
--gray-700: #334155
--gray-800: #1e293b
--gray-900: #0f172a
```

### Role-Based Colors
```css
--role-admin: #011f4b
--role-dean: #03396c
--role-hod: #005b96
--role-teacher: #6497b1
--role-student: #b3cde0
```

## 📝 Typography

### Font Family
- **Primary**: Inter (Google Fonts)
- **Fallback**: Roboto, Arial, sans-serif

### Typography Scale
```css
/* Headings */
h1: 2.25rem (36px) - Bold (700)
h2: 1.875rem (30px) - SemiBold (600) 
h3: 1.5rem (24px) - SemiBold (600)
h4: 1.25rem (20px) - SemiBold (600)
h5: 1.125rem (18px) - SemiBold (600)
h6: 1rem (16px) - SemiBold (600)

/* Body Text */
body1: 1rem (16px) - Regular (400)
body2: 0.875rem (14px) - Regular (400)

/* Button Text */
button: Medium (500) - No text transform
```

## 🔘 Button Styles

### Primary Button
```css
background: #005b96
color: #ffffff
border-radius: 8px
padding: 10px 20px
font-weight: 600
box-shadow: none

/* Hover State */
background: #03396c
box-shadow: 0 4px 12px rgba(0, 91, 150, 0.15)
```

### Secondary Button  
```css
background: #6497b1
color: #ffffff
border-radius: 8px
padding: 10px 20px
font-weight: 600

/* Hover State */
background: #03396c
```

### Outlined Button
```css
border: 1px solid #005b96
color: #005b96
background: transparent
border-radius: 8px
padding: 10px 20px
font-weight: 600

/* Hover State */
border-color: #03396c
background: rgba(0, 91, 150, 0.04)
```

### Danger Button
```css
background: #dc2626
color: #ffffff
border-radius: 8px
padding: 10px 20px
font-weight: 600

/* Hover State */
background: #b91c1c
```

## 📦 Component Styles

### Cards
```css
border-radius: 12px
background: #ffffff
border: 1px solid #e2e8f0
box-shadow: 0 1px 3px rgba(0, 31, 75, 0.1)
```

### Chips
```css
border-radius: 8px
font-weight: 500
padding: 4px 12px

/* Primary Chip */
background: #005b96
color: #ffffff

/* Secondary Chip */
background: #6497b1  
color: #ffffff

/* Status Chips */
success: #059669 | warning: #d97706 | error: #dc2626
```

### Paper/Dialogs
```css
border-radius: 12px
background: #ffffff
box-shadow: 0 4px 20px rgba(0, 31, 75, 0.1)
```

## 📐 Spacing System

### Base Unit: 8px

```css
/* Spacing Scale */
xs: 4px   (0.5 * base)
sm: 8px   (1 * base) 
md: 16px  (2 * base)
lg: 24px  (3 * base)
xl: 32px  (4 * base)
2xl: 48px (6 * base)
3xl: 64px (8 * base)
```

### Component Spacing Guidelines
- **Cards**: 16px-24px internal padding
- **Sections**: 24px-32px between major sections  
- **Lists**: 12px-16px between list items
- **Form Elements**: 16px-20px between form fields
- **Buttons**: 12px-16px between button groups

## 🎯 Usage Guidelines

### Do's ✅
- Use theme colors consistently across all components
- Maintain 12px minimum border radius for modern look
- Use Inter font for all text content
- Follow established spacing patterns
- Use role-based colors for user identification
- Implement proper hover states for interactive elements

### Don'ts ❌
- Don't use hardcoded hex colors in components
- Don't mix different border radius values arbitrarily
- Don't use inconsistent font weights
- Don't create cramped layouts with insufficient spacing
- Don't use random colors outside the established palette

## 🛠️ Implementation

### Using Theme Colors in Components
```javascript
// Correct ✅
sx={{ 
  color: theme.palette.primary.main,
  backgroundColor: theme.palette.background.paper
}}

// Incorrect ❌  
sx={{
  color: '#1976d2',
  backgroundColor: '#ffffff'
}}
```

### Button Implementation
```jsx
// Primary Action
<Button variant="contained" color="primary">
  Save Changes
</Button>

// Secondary Action  
<Button variant="contained" color="secondary">
  Cancel
</Button>

// Outlined Action
<Button variant="outlined" color="primary">
  Learn More
</Button>
```

### Spacing Implementation
```javascript
// Use theme spacing function
sx={{ 
  p: 3,        // 24px padding
  mb: 2,       // 16px margin bottom
  gap: 1.5     // 12px gap
}}
```

This design system ensures consistency, accessibility, and maintainability across the entire SGT Online Learning Platform.