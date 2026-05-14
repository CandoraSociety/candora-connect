export async function fetchAndApplyBranding() {
  try {
    const response = await fetch('https://beacon-92324875.base44.app/functions/getHubConfig');
    const data = await response.json();
    
    if (data.ok && data.config?.branding) {
      const { brand_primary_color, brand_secondary_color } = data.config.branding;
      
      // Apply colors to CSS variables
      const root = document.documentElement;
      
      if (brand_primary_color) {
        // Convert hex to hsl for CSS variable
        const primaryHsl = hexToHsl(brand_primary_color);
        root.style.setProperty('--primary', primaryHsl);
        root.style.setProperty('--ring', primaryHsl);
        root.style.setProperty('--chart-1', primaryHsl);
        root.style.setProperty('--sidebar-primary', primaryHsl);
        root.style.setProperty('--sidebar-ring', primaryHsl);
      }
      
      if (brand_secondary_color) {
        const secondaryHsl = hexToHsl(brand_secondary_color);
        root.style.setProperty('--secondary', secondaryHsl);
        root.style.setProperty('--chart-3', secondaryHsl);
      }
    }
  } catch (error) {
    console.warn('Failed to fetch branding config:', error);
  }
}

function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  
  let h = 0, s = 0;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}