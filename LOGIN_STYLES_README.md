# LKRM Login Pages Styling

This folder contains all the styling extracted from the LKRM login-related pages for use on other websites.

## Files Included

1. **`login-pages-styles.css`** - Standalone CSS file (ready to use)
2. **`login-pages-styles.scss`** - SCSS source file (compile if using SCSS)
3. **`LOGIN_STYLES_README.md`** - This documentation file

## Pages Styling Covers

- ✅ Login page
- ✅ Forgot Password page
- ✅ Reset Password page
- ✅ Signup page

## Color Scheme

- **Background Gradient**: `linear-gradient(#022133, #025A8A)` (dark blue gradient)
- **Text Color**: `rgba(255, 255, 255, 0.7)` (semi-transparent white)
- **Link Hover**: `#1D75D0` (light blue)
- **Divider**: `#ccc` (light gray)

## Layout Structure

The layout uses a split-screen design:
- **Left 40%**: Background image (fixed position)
- **Right 60%**: Form area with gradient background

## Usage Instructions

### Option 1: Using CSS (Recommended for Standalone Projects)

1. Include the CSS file in your HTML:
```html
<link rel="stylesheet" href="login-pages-styles.css">
```

2. Use the class names in your HTML structure (see HTML Structure below)

### Option 2: Using SCSS (For Projects with SCSS Support)

1. Import the SCSS file:
```scss
@import './login-pages-styles.scss';
```

2. Use the class names in your HTML structure

### HTML Structure

#### Basic Login/Signup Structure

```html
<div class="auth-container">
  <!-- Background Image Section -->
  <div class="auth-background">
    <img src="/path/to/login_bg.jpg" alt="Background" loading="lazy" />
  </div>
  
  <!-- Form Section -->
  <div class="auth-form-wrapper">
    <div class="auth-form">
      <!-- Logo Section -->
      <div class="auth-logo">
        <!-- Your logo SVG/image here -->
        <div class="auth-des">Login into your account</div>
      </div>
      
      <!-- Form Content -->
      <form>
        <!-- Your form fields here -->
        
        <!-- Forgot Password Link (Login page only) -->
        <a href="/forgot-password" class="auth-forgot-password">
          Forgot password?
        </a>
        
        <!-- Submit Button -->
        <button type="submit">Login</button>
      </form>
      
      <!-- Divider with OR text -->
      <div class="auth-divider">
        <span class="auth-divider-text">OR</span>
      </div>
      
      <!-- Additional Actions -->
      <button>Create Account</button>
    </div>
  </div>
</div>
```

#### Forgot Password / Reset Password Success State

```html
<div class="auth-container">
  <div class="auth-background">
    <img src="/path/to/login_bg.jpg" alt="Background" />
  </div>
  
  <div class="auth-form-wrapper">
    <div class="auth-form">
      <div class="auth-logo">
        <!-- Your logo -->
        <div class="auth-des">Check your email</div>
      </div>
      
      <!-- Success Message -->
      <div class="auth-success-message">
        <p>We've sent you a password reset link.</p>
        <p>Please check your email and click the link to reset your password.</p>
      </div>
      
      <!-- Action Buttons -->
      <div class="auth-actions">
        <button>Back to Login</button>
        <button>Send Another Email</button>
      </div>
    </div>
  </div>
</div>
```

## CSS Classes Reference

| Class Name | Description | Used In |
|------------|-------------|---------|
| `.auth-container` | Main container wrapper | All pages |
| `.auth-background` | Left-side background image section | All pages |
| `.auth-form-wrapper` | Right-side form wrapper with gradient | All pages |
| `.auth-form` | Form container (max-width: 500px) | All pages |
| `.auth-logo` | Logo and description container | All pages |
| `.auth-des` | Description text below logo | All pages |
| `.auth-divider` | Divider with OR text | All pages |
| `.auth-divider-text` | Text inside divider | All pages |
| `.auth-forgot-password` | Forgot password link styling | Login page |
| `.auth-success-message` | Success message container | Forgot/Reset Password |
| `.auth-actions` | Action buttons container | Forgot/Reset Password |

## Ant Design Integration

If you're using Ant Design (as the original project does), the styles include overrides for:
- Input backgrounds (transparent)
- Form label spacing
- Form label font sizes

If you're **not** using Ant Design, you can safely ignore these global overrides or remove the `:global()` selectors from the SCSS file.

## Responsive Design

The styles include a mobile responsive breakpoint at `768px`:
- On mobile: Background image becomes a top banner (30vh height)
- Form takes full width
- Background image is no longer fixed position

## Customization

### Changing Colors

Edit the gradient in `.auth-form-wrapper`:
```css
background: linear-gradient(#022133, #025A8A);
```

Change to your desired colors:
```css
background: linear-gradient(#yourColor1, #yourColor2);
```

### Changing Background Image Position

Adjust the width percentage in `.auth-background`:
```css
width: 40%; /* Change to 30%, 50%, etc. */
```

And update the margin in `.auth-form-wrapper` accordingly:
```css
margin-left: 40%; /* Should match background width */
```

### Changing Form Width

Adjust in `.auth-form`:
```css
max-width: 500px; /* Change to your desired max width */
min-width: 360px; /* Change to your desired min width */
```

## Dependencies

- **None!** The CSS file is completely standalone
- If using Ant Design, make sure to import it separately
- Background image (`login_bg.jpg`) should be placed in your public/images directory

## Notes

- All class names are prefixed with `auth-` to avoid conflicts with existing styles
- The original SCSS files used CSS Modules (`.module.scss`), but this version uses regular class names for portability
- The `:global()` selectors in SCSS are for Ant Design overrides only

## Original File Locations

If you need to reference the original files:
- `app/login/style.module.scss` - Login page styles
- `app/forgot-password/style.module.scss` - Forgot password styles
- `app/reset-password/style.module.scss` - Reset password styles
- Signup page uses the same styles as login

---

**Last Updated**: Extracted from LKRM project
**Compatibility**: Modern browsers (Chrome, Firefox, Safari, Edge)

