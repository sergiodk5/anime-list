# AnimeList UI Design Guide

> **2025 Anime-Themed Chrome Extension Design System**  
> Consistent patterns for modern, glass-morphism UI with anime branding

---

## 🎨 Design Philosophy

Our UI follows a **modern anime-themed aesthetic** with:

- **Glass-morphism effects** with backdrop blur
- **Purple-to-pink gradients** for anime vibes
- **Darkness (KonoSuba) branding** for consistency
- **Responsive design** with Tailwind CSS
- **Accessibility-first** approach with proper semantics

---

## 🎯 Core Design Patterns

### 1. **Background & Layout Foundation**

#### Main Gradient Background

```vue
<!-- Full-screen gradient for options pages -->
<div class="bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600">
  <!-- Content -->
</div>

<!-- Popup-specific gradient (smaller) -->
<div class="bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600">
  <!-- Popup content -->
</div>
```

#### Animated Background Particles

```vue
<!-- Subtle animated background elements -->
<div class="fixed inset-0 opacity-10">
  <div class="absolute left-8 top-12 h-3 w-3 animate-pulse rounded-full bg-white"></div>
  <div class="absolute right-16 top-20 h-2 w-2 animate-ping rounded-full bg-pink-300"></div>
  <div class="absolute bottom-16 left-16 h-2.5 w-2.5 animate-bounce rounded-full bg-purple-300"></div>
  <div class="absolute bottom-8 right-8 h-2 w-2 animate-pulse rounded-full bg-white delay-700"></div>
  <div class="absolute left-1/3 top-1/4 h-1.5 w-1.5 animate-ping rounded-full bg-purple-200 delay-1000"></div>
  <div class="absolute bottom-1/3 right-1/4 h-1 w-1 animate-pulse rounded-full bg-pink-200 delay-500"></div>
</div>
```

### 2. **Glass-Morphism Components**

#### Primary Glass Cards

```vue
<!-- Main content cards -->
<div class="rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-sm">
  <!-- Card content -->
</div>

<!-- Smaller glass cards -->
<div class="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
  <!-- Card content -->
</div>
```

#### Interactive Glass Elements

```vue
<!-- Hoverable glass cards -->
<div
    class="group rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:bg-white/15 hover:shadow-lg hover:shadow-black/20"
>
  <!-- Interactive content -->
</div>

<!-- Navigation items -->
<RouterLink
    class="group flex items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-sm font-medium text-white/90 transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white hover:shadow-md hover:shadow-black/20 active:scale-95"
>
  <!-- Nav content -->
</RouterLink>
```

### 3. **Brand & Icon System**

#### Darkness Brand Icon

```vue
<!-- Primary brand icon (options/popup header) -->
<div class="flex h-8 w-8 items-center justify-center rounded-lg border border-white/30 bg-white/20 backdrop-blur-sm">
  <img
    src="/assets/images/darkness_32x32.png"
    alt="Darkness from KonoSuba"
    class="h-6 w-6 rounded"
  />
</div>

<!-- Larger brand icon (welcome sections) -->
<div class="flex h-12 w-12 items-center justify-center rounded-xl border border-white/30 bg-white/20 backdrop-blur-sm">
  <span class="text-2xl drop-shadow-sm">🎌</span> <!-- or Darkness icon -->
</div>
```

#### Emoji Icon System

```vue
<!-- Navigation icons -->
<span class="text-lg drop-shadow-sm">🏠</span>
<!-- Home -->
<span class="text-lg drop-shadow-sm">📺</span>
<!-- Watch Lists -->
<span class="text-lg drop-shadow-sm">⭐</span>
<!-- Favorites -->
<span class="text-lg drop-shadow-sm">⚙️</span>
<!-- Settings -->

<!-- Stat/feature icons -->
<span class="text-2xl drop-shadow-sm">▶️</span>
<!-- Currently Watching -->
<span class="text-2xl drop-shadow-sm">✅</span>
<!-- Completed -->
<span class="text-2xl drop-shadow-sm">📝</span>
<!-- Plan to Watch -->
<span class="text-2xl drop-shadow-sm">🎌</span>
<!-- Welcome/Anime -->
```

### 4. **Typography System**

#### Headings

```vue
<!-- Main page titles -->
<h1 class="text-3xl font-bold text-white drop-shadow-md">Page Title</h1>

<!-- Section titles -->
<h2 class="text-2xl font-bold text-white drop-shadow-md">Section Title</h2>

<!-- Card titles -->
<h3 class="text-lg font-semibold text-white drop-shadow-sm">Card Title</h3>

<!-- Brand title -->
<span class="text-lg font-bold tracking-tight text-white drop-shadow-md">AnimeList</span>
```

#### Body Text

```vue
<!-- Primary description text -->
<p class="leading-relaxed text-white/90 drop-shadow-sm">Description text</p>

<!-- Secondary/subtitle text -->
<p class="text-lg text-white/80 drop-shadow-sm">Subtitle text</p>

<!-- Navigation/button text -->
<span class="text-sm font-medium text-white/90 drop-shadow-sm">Nav text</span>
```

#### Stats/Numbers

```vue
<!-- Large stat numbers -->
<p class="text-2xl font-bold text-purple-200 drop-shadow-sm">12</p>
<p class="text-2xl font-bold text-green-200 drop-shadow-sm">87</p>
<p class="text-2xl font-bold text-blue-200 drop-shadow-sm">25</p>
```

### 5. **Layout Patterns**

#### Sidebar Layout

```vue
<!-- Fixed sidebar for options pages -->
<aside class="flex w-64 flex-col border-r border-white/20 bg-black/30 text-white backdrop-blur-sm">
  <!-- Sidebar header -->
  <div class="flex h-16 items-center justify-center border-b border-white/20 bg-black/40">
    <!-- Brand -->
  </div>
  
  <!-- Navigation -->
  <nav class="flex-1 space-y-2 p-4">
    <!-- Nav items -->
  </nav>
</aside>
```

#### Header Layout

```vue
<!-- Page header with breadcrumbs -->
<header class="border-b border-white/20 bg-black/20 px-6 py-4 backdrop-blur-sm">
  <div class="flex items-center justify-between">
    <!-- Breadcrumbs -->
    <nav class="flex items-center space-x-2 text-sm text-white/80">
      <!-- Breadcrumb items -->
    </nav>
    
    <!-- Actions -->
    <div class="flex items-center gap-3">
      <!-- Header actions -->
    </div>
  </div>
</header>
```

#### Grid Layouts

```vue
<!-- 3-column responsive grid -->
<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
  <!-- Grid items -->
</div>

<!-- 2-column responsive grid -->
<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
  <!-- Grid items -->
</div>

<!-- 4-column responsive grid -->
<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
  <!-- Grid items -->
</div>
```

### 6. **Interactive Elements**

#### Buttons

```vue
<!-- Primary glass button -->
<button
    class="rounded-xl border border-white/30 bg-white/20 px-6 py-3 font-medium text-white backdrop-blur-sm transition-all duration-200 hover:border-white/40 hover:bg-white/30 hover:shadow-lg hover:shadow-black/20 active:scale-95"
>
  Button Text
</button>

<!-- Secondary button -->
<button
    class="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-sm transition-all duration-200 hover:bg-white/20 active:scale-95"
>
  Secondary Action
</button>
```

#### Active States

```vue
<!-- Active navigation item -->
<RouterLink
    :class="{
        'border-white/30 bg-white/15 text-white shadow-md shadow-black/20': $route.path === '/',
    }"
>
  <!-- Nav content -->
</RouterLink>

<!-- Active breadcrumb -->
<span class="font-medium text-white">Current Page</span>
```

### 7. **Animation Guidelines**

#### Hover Animations

```vue
<!-- Scale on interaction -->
<div class="transition-all duration-200 hover:scale-105 active:scale-95"></div>
```

#### Background Animations

```vue
<!-- Pulsing elements -->
<div class="animate-pulse"></div>
```

---

## 🧪 Testing Requirements

### Data-TestId Attributes

Always include `data-testid` attributes for:

```vue
<!-- Layout elements -->
<div data-testid="dashboard-layout"></div>
```

---

## 📱 Responsive Design

### Breakpoint Strategy

```vue
<!-- Mobile-first responsive classes -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"></div>
```

### Popup Constraints

```vue
<!-- Fixed popup dimensions -->
<div class="h-60 w-80 overflow-hidden">
  <!-- Popup content must fit within these constraints -->
</div>
```

---

## 🎨 Color Palette

### Primary Colors

- **Background Gradient**: `from-purple-600 via-purple-700 to-pink-600`
- **Glass Elements**: `bg-white/10`, `bg-white/20`
- **Borders**: `border-white/20`, `border-white/30`
- **Text**: `text-white`, `text-white/90`, `text-white/80`

### Accent Colors

- **Purple Accent**: `text-purple-200`, `bg-purple-300`
- **Pink Accent**: `text-pink-200`, `bg-pink-300`
- **Green Success**: `text-green-200`
- **Blue Info**: `text-blue-200`

### Shadow & Effects

- **Drop Shadow**: `drop-shadow-sm`, `drop-shadow-md`
- **Box Shadow**: `shadow-lg shadow-black/20`
- **Backdrop Blur**: `backdrop-blur-sm`

---

## ✅ Implementation Checklist

When creating new UI components:

- [ ] Apply base gradient background
- [ ] Add glass-morphism effects with proper backdrop blur
- [ ] Include Darkness brand icon where appropriate
- [ ] Use consistent typography with drop-shadow
- [ ] Add hover/interaction animations
- [ ] Include comprehensive `data-testid` attributes
- [ ] Ensure responsive design with mobile-first approach
- [ ] Test accessibility with proper semantic HTML
- [ ] Verify color contrast meets WCAG standards
- [ ] Add animated background particles for full-screen layouts

---

## 🔄 Maintenance

### When Adding New Components:

1. Follow existing glass-morphism patterns
2. Use established color palette
3. Include proper test attributes
4. Document any new patterns in this guide
5. Ensure 100% test coverage

### When Updating Existing Components:

1. Maintain backward compatibility
2. Update tests accordingly
3. Verify visual consistency
4. Update this guide if patterns change

---

_This guide ensures consistent, beautiful, and maintainable UI across the entire AnimeList Chrome extension. Follow these patterns to maintain the anime-themed aesthetic and user experience quality!_ ✨
